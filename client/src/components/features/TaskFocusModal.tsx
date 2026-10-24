import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Terminal,
  ExternalLink,
  Lightbulb,
  Lock,
  Award,
  Sparkles,
  Check,
  HelpCircle
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { fireCelebrationConfetti } from '../../lib/confetti';
import type { Task } from '../../types';

export interface TaskFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onToggleComplete: (task: Task) => Promise<void>;
  onStartSession?: (task: Task, minutes: number) => Promise<void>;
  onReschedule?: (task: Task, newDayNumber: number) => Promise<void>;
  onNextStep?: () => void;
  onAskAi?: (task: Task) => void;
  onOpenDoubtSolver?: (task: Task) => void;
  onLaunchQuiz?: (topic: string) => void;
  isLoading: boolean;
}

export const TaskFocusModal: React.FC<TaskFocusModalProps> = ({
  isOpen,
  onClose,
  task,
  onToggleComplete,
  onStartSession,
  onReschedule,
  onNextStep,
  onAskAi,
  onOpenDoubtSolver,
  onLaunchQuiz,
  isLoading,
}) => {
  const initialSeconds = (task?.estimatedMinutes || 25) * 60;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [exerciseNotes, setExerciseNotes] = useState('');
  const [expandedHint, setExpandedHint] = useState<number | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    if (task) {
      setTimeLeft((task.estimatedMinutes || 25) * 60);
      setIsRunning(false);
      setExerciseNotes('');
      setExpandedHint(null);
    }
  }, [task]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      fireCelebrationConfetti();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  if (!task) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleToggleTimer = () => {
    if (!isRunning && onStartSession) {
      onStartSession(task, Math.round(((task.estimatedMinutes || 25) * 60 - timeLeft) / 60) || 5);
    }
    setIsRunning(!isRunning);
  };

  const handleCompleteClick = async () => {
    if (!task.isCompleted) {
      fireCelebrationConfetti();
    }
    await onToggleComplete(task);
    onClose();
  };

  const handleQuickReschedule = async () => {
    if (!onReschedule) return;
    setIsRescheduling(true);
    try {
      await onReschedule(task, task.dayNumber + 1);
      onClose();
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      description={`Day ${task.dayNumber} • ${task.phaseTitle}`}
      maxWidth="xl"
    >
      <div className="space-y-5 pt-1">
        {/* Status & Milestone Tags */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {task.status === 'completed' && (
              <Badge variant="emerald" size="sm" dot>
                Completed
              </Badge>
            )}
            {task.status === 'in_progress' && (
              <Badge variant="emerald" size="sm" dot>
                In Progress
              </Badge>
            )}
            {task.status === 'current' && (
              <Badge variant="indigo" size="sm" dot>
                Ready to Start
              </Badge>
            )}
            {task.status === 'overdue' && (
              <Badge variant="amber" size="sm">
                Overdue
              </Badge>
            )}
            {task.status === 'locked' && (
              <Badge variant="amber" size="sm">
                <Lock className="w-3 h-3 mr-1 inline" />
                Locked Prerequisite
              </Badge>
            )}
            {task.isMilestone && (
              <Badge variant="violet" size="sm">
                <Award className="w-3 h-3 mr-1 inline" />
                Phase Milestone
              </Badge>
            )}
            {task.isFinalProject && (
              <Badge variant="cyan" size="sm">
                <Sparkles className="w-3 h-3 mr-1 inline" />
                Capstone Project
              </Badge>
            )}
          </div>

          {onReschedule && !task.isCompleted && (
            <button
              type="button"
              onClick={handleQuickReschedule}
              disabled={isRescheduling}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              {isRescheduling ? 'Rescheduling...' : 'Reschedule to Tomorrow'}
            </button>
          )}
        </div>

        {/* Locked Prerequisite Warning */}
        {task.status === 'locked' && !task.isCompleted && (
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              This lesson has prerequisites from earlier days. We recommend finishing previous lessons first to prevent cognitive overload, but you can explore the notes below at your own pace.
            </div>
          </div>
        )}

        {/* Anti-Overwhelm Focus Timer Strip */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-violet-950/30 to-slate-950 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 shadow-glow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                Anti-Overwhelm Focus Session
              </div>
              <div className="text-2xl font-mono font-bold text-white tracking-wider">
                {formattedTime}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isRunning ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleToggleTimer}
              leftIcon={isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            >
              {isRunning ? 'Pause' : 'Start Lesson Timer'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsRunning(false);
                setTimeLeft((task.estimatedMinutes || 25) * 60);
              }}
              aria-label="Reset timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Learning Objectives */}
        {task.learningObjectives && task.learningObjectives.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
              <Lightbulb className="w-3.5 h-3.5" />
              Learning Objectives
            </h4>
            <ul className="space-y-1.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              {task.learningObjectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concept Summary */}
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Bite-Sized Mental Model
          </h4>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {task.conceptSummary}
          </div>
        </div>

        {/* Practical Hands-on Exercise */}
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <Terminal className="w-3.5 h-3.5" />
            Today's Practical Mission
          </h4>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            {task.practicalExercise}
          </div>
          <textarea
            value={exerciseNotes}
            onChange={(e) => setExerciseNotes(e.target.value)}
            placeholder="Jot down code snippets, test assertions, or your completion reflections..."
            className="w-full h-20 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Completion Criteria */}
        {task.completionCriteria && task.completionCriteria.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Actionable Completion Criteria
            </h4>
            <ul className="space-y-1.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              {task.completionCriteria.map((crit, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span>{crit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Practice Questions & Knowledge Drill */}
        {task.practiceQuestions && task.practiceQuestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <HelpCircle className="w-3.5 h-3.5" />
              Practice Drill & Knowledge Check
            </h4>
            <div className="space-y-2">
              {task.practiceQuestions.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <p className="text-xs font-semibold text-slate-200">Q: {q.question}</p>
                  {q.answerHint && (
                    <button
                      type="button"
                      onClick={() => setExpandedHint(expandedHint === idx ? null : idx)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                    >
                      {expandedHint === idx ? 'Hide Hint' : '💡 Show Answer Hint'}
                    </button>
                  )}
                  {expandedHint === idx && q.answerHint && (
                    <p className="text-[11px] text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 italic">
                      {q.answerHint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Takeaways */}
        {task.keyTakeaways && task.keyTakeaways.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-300">
              Core Takeaways
            </h4>
            <ul className="space-y-1.5">
              {task.keyTakeaways.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Curated External Resources */}
        {task.resources && task.resources.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <BookOpen className="w-3.5 h-3.5" />
              Verified Resources
            </h4>
            <div className="flex flex-wrap gap-2">
              {task.resources.map((res, idx) => (
                <a
                  key={idx}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-indigo-300 hover:border-slate-700 transition-colors"
                >
                  <span>{res.title}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {task.isCompleted ? (
              <span className="text-emerald-400 font-medium">✓ Completed</span>
            ) : (
              <span>Estimated: ~{task.estimatedMinutes} mins</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenDoubtSolver ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  onClose();
                  onOpenDoubtSolver(task);
                }}
                leftIcon={<Lightbulb className="w-4 h-4 text-amber-400" />}
                className="border-amber-500/30 text-amber-300 hover:text-amber-200"
              >
                AI Doubt Solver
              </Button>
            ) : onAskAi ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  onClose();
                  onAskAi(task);
                }}
                leftIcon={<Sparkles className="w-4 h-4 text-indigo-400" />}
                className="border-indigo-500/30 text-indigo-300 hover:text-indigo-200"
              >
                Ask AI Tutor
              </Button>
            ) : null}

            {onLaunchQuiz && (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  onClose();
                  onLaunchQuiz(task.title);
                }}
                leftIcon={<Award className="w-4 h-4 text-violet-400" />}
                className="border-violet-500/30 text-violet-300 hover:text-violet-200"
              >
                Take Quiz
              </Button>
            )}
            <Button variant="ghost" size="md" onClick={onClose}>
              Close
            </Button>
            {task.isCompleted && onNextStep && (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  onClose();
                  onNextStep();
                }}
              >
                Next Step
              </Button>
            )}
            <Button
              variant={task.isCompleted ? 'secondary' : 'accent'}
              size="md"
              onClick={handleCompleteClick}
              isLoading={isLoading}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {task.isCompleted ? 'Mark Incomplete' : 'Complete Lesson (+50 XP)'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
