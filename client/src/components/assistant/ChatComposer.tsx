import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Sparkles, Terminal, HelpCircle, Target } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ChatComposerProps {
  onSendMessage: (content: string) => void;
  onStopGeneration?: () => void;
  isGenerating: boolean;
  activeTopic?: string;
  disabled?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  activeTopic,
  disabled,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating || disabled) return;
    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const insertSuggestion = (prefix: string) => {
    setInput(prefix);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full space-y-2">
      {/* Quick Action Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
        <button
          type="button"
          onClick={() => insertSuggestion('Explain the concept of ')}
          className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Explain Concept</span>
        </button>

        <button
          type="button"
          onClick={() => insertSuggestion('Debug this code error:\n\n```\n// paste error or code\n```')}
          className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Terminal className="w-3 h-3 text-emerald-400" />
          <span>Debug Error</span>
        </button>

        <button
          type="button"
          onClick={() => insertSuggestion('Give me 3 progressive practice questions on ')}
          className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Target className="w-3 h-3 text-violet-400" />
          <span>Practice Drills</span>
        </button>

        {activeTopic && (
          <button
            type="button"
            onClick={() => insertSuggestion(`Help me understand my current lesson: ${activeTopic}`)}
            className="px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <HelpCircle className="w-3 h-3 text-indigo-400" />
            <span className="truncate max-w-[160px]">Current Topic</span>
          </button>
        )}
      </div>

      {/* Input Box */}
      <div className="relative rounded-2xl glass-card bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/40 transition-all shadow-lg p-2.5 sm:p-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about programming, code debugging, or your roadmap... (Enter to send, Shift+Enter for new line)"
          rows={1}
          maxLength={4000}
          disabled={disabled}
          className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none min-h-[44px] max-h-[180px] pr-12 leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-500">
          <span>
            {input.length > 0 && `${input.length}/4000`}
          </span>

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <Button
                variant="danger"
                size="sm"
                onClick={onStopGeneration}
                className="h-8 px-3 rounded-xl flex items-center gap-1.5 shadow-glow-sm"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-semibold">Stop</span>
              </Button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() || disabled}
                className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                  input.trim() && !disabled
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-glow-sm cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
