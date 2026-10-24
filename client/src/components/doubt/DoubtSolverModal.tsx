import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Send,
  AlertCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MarkdownMessage } from '../assistant/MarkdownMessage';
import { api } from '../../lib/api';
import type { Task, DoubtActionType, DoubtSolverResponse } from '../../types';

export interface DoubtSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTask?: Task | null;
  activeTopic?: string;
  initialQuery?: string;
  roadmapId?: string;
  onReturnToLesson?: (task: Task) => void;
}

export const DoubtSolverModal: React.FC<DoubtSolverModalProps> = ({
  isOpen,
  onClose,
  currentTask,
  activeTopic,
  initialQuery = '',
  roadmapId,
  onReturnToLesson,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeAction, setActiveAction] = useState<DoubtActionType>('general');
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<DoubtSolverResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayTopic = activeTopic || currentTask?.title || 'Software Engineering & Programming';

  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setQuery(initialQuery);
        handleSolve(initialQuery, 'general', 1);
      } else if (!response) {
        setQuery('');
        setResponse(null);
        setError(null);
      }
    }
  }, [isOpen, initialQuery]);

  const handleSolve = async (
    questionQuery: string,
    action: DoubtActionType = activeAction,
    level: number = hintLevel
  ) => {
    const trimmed = questionQuery.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setActiveAction(action);
    setHintLevel(level);

    try {
      const result = await api.solveStudentDoubt({
        query: trimmed,
        topic: displayTopic,
        roadmapId,
        lessonTitle: currentTask?.title,
        lessonContext: currentTask?.conceptSummary,
        actionType: action,
        hintLevel: level,
      });

      setResponse(result);
    } catch (err: any) {
      setError(err.message || 'Failed to resolve doubt. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: DoubtActionType) => {
    setActiveAction(action);
    const newHintLevel = action === 'give_hint' ? 1 : 1;
    setHintLevel(newHintLevel);
    const currentQ = query.trim() || `Help me understand ${displayTopic}`;
    handleSolve(currentQ, action, newHintLevel);
  };

  const handleNextHint = () => {
    const nextLevel = (hintLevel || 1) + 1;
    setHintLevel(nextLevel);
    const currentQ = query.trim() || `Help me understand ${displayTopic}`;
    handleSolve(currentQ, 'give_hint', nextLevel);
  };

  const handleRevealSolution = () => {
    setHintLevel(4);
    const currentQ = query.trim() || `Help me understand ${displayTopic}`;
    handleSolve(currentQ, 'give_hint', 4);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Doubt Solver & Conceptual Mentor"
      description="Ask questions, get plain-English explanations, progressive hints, or practical code traces."
      maxWidth="xl"
    >
      <div className="space-y-5 pt-1">
        {/* Active Lesson Context Strip & Return Button */}
        {currentTask && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="font-semibold text-slate-400">Lesson Context:</span>
              <span className="text-white font-medium truncate max-w-[280px]">
                {currentTask.title}
              </span>
            </div>
            {onReturnToLesson && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose();
                  onReturnToLesson(currentTask);
                }}
                rightIcon={<ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                className="text-indigo-300 hover:text-indigo-200"
              >
                Return to Lesson
              </Button>
            )}
          </div>
        )}

        {/* Input Composer */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSolve(query, activeAction, hintLevel);
                }
              }}
              placeholder={`Ask any question about ${displayTopic} (e.g. "Why is this algorithm O(n)?", "Where do race conditions happen?")...`}
              rows={3}
              className="w-full p-3.5 text-xs sm:text-sm bg-slate-950 rounded-2xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 resize-none transition-all"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <Button
                variant="accent"
                size="sm"
                onClick={() => handleSolve(query, activeAction, hintLevel)}
                disabled={!query.trim() || isLoading}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                {isLoading ? 'Solving...' : 'Solve Doubt'}
              </Button>
            </div>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Actions:
            </span>
            <button
              type="button"
              onClick={() => handleActionClick('explain_simply')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                activeAction === 'explain_simply'
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span>🐣</span>
              <span>Explain Simply (ELI5)</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionClick('give_example')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                activeAction === 'give_example'
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span>💡</span>
              <span>Give Code Example</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionClick('give_hint')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                activeAction === 'give_hint'
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span>🔍</span>
              <span>Give a Hint (Step-by-Step)</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionClick('practice_question')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                activeAction === 'practice_question'
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span>🎯</span>
              <span>Practice Question</span>
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="p-8 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-200">
              Analyzing doubt and formulating beginner-friendly reasoning...
            </p>
            <p className="text-xs text-slate-500">
              Examining mental models, edge cases, and code analogies
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-2">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSolve(query, activeAction, hintLevel)}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Response Container */}
        {response && !isLoading && (
          <div className="space-y-4 animate-fade-in">
            {/* Progressive Hint Stepper Banner if in hint mode */}
            {activeAction === 'give_hint' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center">
                    {hintLevel >= 4 ? '✓' : hintLevel}
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-amber-200">
                      {hintLevel >= 4
                        ? 'Full Solution Revealed'
                        : `Progressive Hint Level ${hintLevel} of 3`}
                    </h5>
                    <p className="text-[11px] text-amber-300/80">
                      {hintLevel === 1 && 'Mental model pointer without code spoilers.'}
                      {hintLevel === 2 && 'Structural pattern clue to guide logic.'}
                      {hintLevel === 3 && 'Code skeleton and edge-case guard.'}
                      {hintLevel >= 4 && 'Complete production-grade implementation.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hintLevel < 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextHint}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      className="border-amber-500/30 text-amber-200 hover:text-white"
                    >
                      Next Hint ({hintLevel + 1}/3)
                    </Button>
                  )}
                  {hintLevel < 4 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRevealSolution}
                      className="text-amber-300 hover:text-amber-200"
                    >
                      Reveal Full Solution
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Response Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="indigo" size="sm">
                    {response.provider}
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Mode: {response.actionType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Markdown Body */}
              <div className="max-h-[50vh] overflow-y-auto pr-2">
                <MarkdownMessage content={response.answer} />
              </div>

              {/* Verification Disclaimer Badge */}
              {response.requiresVerification && (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{response.verificationNote || 'AI-generated tutor guidance • Verify language-specific nuances or compiler flags with primary documentation.'}</span>
                </div>
              )}
            </div>

            {/* Follow-up Question Suggestions */}
            {response.followUpSuggestions && response.followUpSuggestions.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Suggested Follow-up Questions:
                </span>
                <div className="flex flex-wrap gap-2">
                  {response.followUpSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(suggestion);
                        handleSolve(suggestion, 'general', 1);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-indigo-300 hover:text-white transition-all text-left flex items-center gap-1.5"
                    >
                      <span>💬</span>
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          <div className="text-xs text-slate-500">
            SkillPilot Anti-Overwhelm Mentorship
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={onClose}>
              Close
            </Button>
            {currentTask && onReturnToLesson && (
              <Button
                variant="accent"
                size="md"
                onClick={() => {
                  onClose();
                  onReturnToLesson(currentTask);
                }}
              >
                Back to Lesson
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
