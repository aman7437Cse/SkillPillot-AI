import React, { useState } from 'react';
import { Sparkles, Copy, Check, RotateCcw } from 'lucide-react';
import { MarkdownMessage } from './MarkdownMessage';
import { Badge } from '../ui/Badge';
import type { ChatMessage } from '../../types';

export interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: (message: ChatMessage) => void;
  userFullName?: string;
  userAvatarUrl?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRetry,
  userFullName = 'Student',
  userAvatarUrl,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isGeminiLive = message.provider?.includes('Gemini');

  return (
    <div className={`flex gap-3 sm:gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1px] shadow-glow-sm mt-0.5">
          <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Bubble Container */}
      <div className={`max-w-[88%] sm:max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* User / Assistant Header Info */}
        <div className={`flex items-center gap-2 text-[11px] ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="font-semibold text-slate-300">
            {isUser ? userFullName : 'SkillPilot AI Tutor'}
          </span>
          <span className="text-slate-500">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {!isUser && message.provider && (
            <Badge variant={isGeminiLive ? 'emerald' : 'indigo'} size="sm">
              {isGeminiLive ? 'Gemini 2.5 Live' : 'AI Tutor Demo'}
            </Badge>
          )}
        </div>

        {/* Bubble Content Card */}
        <div
          className={`p-4 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-none'
              : 'glass-card bg-slate-900/90 border border-slate-800 rounded-tl-none'
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-white font-sans">
              {message.content}
            </p>
          ) : (
            <MarkdownMessage content={message.content} />
          )}
        </div>

        {/* Action bar for Assistant messages */}
        {!isUser && (
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors"
              title="Copy entire response"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {onRetry && (
              <button
                onClick={() => onRetry(message)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors"
                title="Regenerate this response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300 mt-0.5">
          {userAvatarUrl ? (
            <img src={userAvatarUrl} alt={userFullName} className="w-full h-full rounded-xl object-cover" />
          ) : (
            getInitials(userFullName)
          )}
        </div>
      )}
    </div>
  );
};
