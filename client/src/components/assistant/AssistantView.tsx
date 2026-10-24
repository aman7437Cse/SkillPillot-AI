import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sparkles,
  Bot,
  AlertCircle,
  Terminal,
  Target,
  Zap,
  RotateCcw,
  Plus
} from 'lucide-react';
import { ChatSidebar } from './ChatSidebar';
import { MessageBubble } from './MessageBubble';
import { ChatComposer } from './ChatComposer';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { Conversation, ChatMessage, Roadmap, Task } from '../../types';

export interface AssistantViewProps {
  activeRoadmap: Roadmap | null;
  currentTask: Task | null;
  onOpenRoadmap?: () => void;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  activeRoadmap,
  currentTask,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const { user } = useAuth();

  // Sidebar & Conversation states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Chat execution state
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Load conversations on mount
  const loadConversations = async (selectLatest = true) => {
    setIsLoadingConversations(true);
    try {
      const data = await api.listConversations();
      setConversations(data);
      if (data.length > 0 && selectLatest && !activeConversationId) {
        selectConversation(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  // Load messages when active conversation changes
  const selectConversation = async (id: string) => {
    setActiveConversationId(id);
    setIsLoadingMessages(true);
    setStreamError(null);
    try {
      const conv = await api.getConversation(id);
      setMessages(conv.messages);
    } catch (err: any) {
      setStreamError(err.message || 'Could not load conversation messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Handle New Chat
  const handleNewChat = async () => {
    if (isGenerating) return;
    try {
      const newConv = await api.createConversation('New Chat', activeRoadmap?.id);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([]);
      setStreamError(null);
    } catch (err: any) {
      alert(`Could not create new chat: ${err.message}`);
    }
  };

  // Handle Rename
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const updated = await api.renameConversation(id, newTitle);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c))
      );
    } catch (err: any) {
      alert(`Could not rename chat: ${err.message}`);
    }
  };

  // Handle Delete
  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch (err: any) {
      alert(`Could not delete chat: ${err.message}`);
    }
  };

  // Send message with streaming
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;
    setStreamError(null);
    setIsGenerating(true);

    let convId = activeConversationId;

    // Temporary optimistic user message
    const tempUserId = `temp-user-${Date.now()}`;
    const optimisticUserMessage: ChatMessage = {
      id: tempUserId,
      conversationId: convId || 'pending',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);

    // Setup abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Temporary assistant message for live streaming accumulation
    const tempAssistantId = `temp-assistant-${Date.now()}`;
    let streamedContent = '';

    try {
      await api.streamChatMessage(
        {
          message: text,
          conversationId: convId || undefined,
          roadmapId: activeRoadmap?.id,
          currentTopic: currentTask?.title,
        },
        // onStart
        (startedConvId, userMsg) => {
          convId = startedConvId;
          setActiveConversationId(startedConvId);
          setMessages((prev) =>
            prev.map((m) => (m.id === tempUserId ? userMsg : m))
          );
          // Add blank assistant bubble to stream into
          setMessages((prev) => [
            ...prev,
            {
              id: tempAssistantId,
              conversationId: startedConvId,
              role: 'assistant',
              content: '',
              provider: 'SkillPilot AI Tutor',
              isAiGenerated: true,
              createdAt: new Date().toISOString(),
            },
          ]);
        },
        // onChunk
        (chunk) => {
          streamedContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantId ? { ...m, content: streamedContent } : m
            )
          );
        },
        // onDone
        (finalMsg, _provider) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempAssistantId ? finalMsg : m))
          );
          setIsGenerating(false);
          loadConversations(false);
        },
        // onError
        (err) => {
          console.error('Streaming error, falling back:', err);
          setStreamError(err.message || 'Stream generation failed');
          setIsGenerating(false);
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStreamError(err.message || 'Failed to generate response. Please try again.');
      }
      setIsGenerating(false);
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Retry prompt
  const handleRetry = (msg: ChatMessage) => {
    // Find preceding user message
    const msgIndex = messages.findIndex((m) => m.id === msg.id);
    if (msgIndex > 0) {
      const previousUserMsg = messages[msgIndex - 1];
      if (previousUserMsg.role === 'user') {
        handleSendMessage(previousUserMsg.content);
      }
    }
  };

  // Handle auto-triggering initial prompt if passed from dashboard
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[580px] rounded-3xl glass-card border border-slate-800 bg-[#070b13] overflow-hidden shadow-2xl relative">
      {/* Left History Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isLoading={isLoadingConversations}
      />

      {/* Main Chat Conversation View */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950/60 relative">
        {/* Chat Header Strip */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-slate-900/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger to open sidebar */}
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate font-sans">
                {activeConv?.title || 'SkillPilot AI Tutor'}
              </h2>
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                {activeRoadmap && (
                  <span className="hidden sm:inline-block text-slate-400 truncate max-w-[200px]">
                    Goal: {activeRoadmap.targetGoal}
                  </span>
                )}
                {currentTask && (
                  <span className="px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-500/30 font-medium truncate max-w-[220px]">
                    Focus: {currentTask.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              New Chat
            </Button>
          </div>
        </div>

        {/* Scrollable Message List */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {isLoadingMessages ? (
            <div className="space-y-4 max-w-3xl mx-auto py-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 animate-pulse" />
                <div className="h-14 w-2/3 rounded-2xl bg-slate-900 animate-pulse" />
              </div>
              <div className="flex justify-end">
                <div className="h-10 w-1/2 rounded-2xl bg-indigo-950/40 animate-pulse" />
              </div>
            </div>
          ) : messages.length === 0 ? (
            /* Empty State: Quick Prompt Starters */
            <div className="max-w-2xl mx-auto text-center py-8 sm:py-12 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1px] shadow-glow-md mx-auto">
                <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-indigo-400">
                  <Bot className="w-7 h-7" />
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans">
                  How can I accelerate your learning today?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
                  Ask deep programming questions, get line-by-line code breakdowns, debug errors, or practice technical interview drills.
                </p>
              </div>

              {/* 4 Interactive Prompt Starter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <button
                  onClick={() =>
                    handleSendMessage(
                      currentTask
                        ? `Explain the core concept of "${currentTask.title}" with a clear real-world analogy.`
                        : 'Explain the Compound Component pattern in React with a clean real-world analogy.'
                    )
                  }
                  className="p-3.5 rounded-2xl glass-card bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all text-xs group"
                >
                  <div className="flex items-center gap-2 text-indigo-400 font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explain with Analogy</span>
                  </div>
                  <p className="text-slate-300 group-hover:text-white leading-relaxed line-clamp-2">
                    {currentTask
                      ? `Explain "${currentTask.title}" simply with an intuitive mental model.`
                      : 'Deconstruct complex architectural patterns without academic jargon.'}
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage(
                      'Why does setting state inside a React useEffect cause infinite re-render loops? Show how to fix it.'
                    )
                  }
                  className="p-3.5 rounded-2xl glass-card bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all text-xs group"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Debug Tricky Error</span>
                  </div>
                  <p className="text-slate-300 group-hover:text-white leading-relaxed line-clamp-2">
                    Why does setting state inside useEffect cause infinite loops? Show the fix.
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage(
                      currentTask
                        ? `Generate 3 progressive practice drill questions with test cases for: ${currentTask.title}`
                        : 'Give me 3 progressive coding drill questions on binary search and edge cases.'
                    )
                  }
                  className="p-3.5 rounded-2xl glass-card bg-slate-900/60 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 transition-all text-xs group"
                >
                  <div className="flex items-center gap-2 text-violet-400 font-bold mb-1">
                    <Target className="w-3.5 h-3.5" />
                    <span>Generate Practice Drills</span>
                  </div>
                  <p className="text-slate-300 group-hover:text-white leading-relaxed line-clamp-2">
                    Generate 3 progressive questions with edge cases and solution hints.
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage(
                      `How do database indexes improve query performance under high load? Explain B-Trees line by line.`
                    )
                  }
                  className="p-3.5 rounded-2xl glass-card bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all text-xs group"
                >
                  <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Performance Optimization</span>
                  </div>
                  <p className="text-slate-300 group-hover:text-white leading-relaxed line-clamp-2">
                    How do database indexes work under high load? Explain B-Trees clearly.
                  </p>
                </button>
              </div>
            </div>
          ) : (
            /* Stream of Messages */
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onRetry={handleRetry}
                  userFullName={user?.fullName}
                  userAvatarUrl={user?.avatarUrl}
                />
              ))}

              {/* Typing / Thinking Indicator */}
              {isGenerating && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex items-center gap-3 text-xs text-slate-400 py-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-2 font-medium text-slate-300">SkillPilot AI is thinking...</span>
                  </div>
                </div>
              )}

              {/* Stream Error Alert */}
              {streamError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{streamError}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                      if (lastUserMsg) handleSendMessage(lastUserMsg.content);
                    }}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Retry
                  </Button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Composer Area */}
        <div className="p-3 sm:p-5 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md shrink-0">
          <div className="max-w-4xl mx-auto">
            <ChatComposer
              onSendMessage={handleSendMessage}
              onStopGeneration={handleStopGeneration}
              isGenerating={isGenerating}
              activeTopic={currentTask?.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
