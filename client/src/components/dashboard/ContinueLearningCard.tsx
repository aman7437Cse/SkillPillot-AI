import React, { useState } from 'react';
import {
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Clock,
  Terminal,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Check,
  RotateCcw
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { Task } from '../../types';

export interface ContinueLearningCardProps {
  task: Task | null;
  onStartLesson: (task: Task) => void;
  onToggleComplete: (task: Task) => Promise<void>;
  onReschedule: (task: Task, newDayNumber: number) => Promise<void>;
  onViewNextStep?: () => void;
  isLoading?: boolean;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  task,
  onStartLesson,
  onToggleComplete,
  onReschedule,
  onViewNextStep,
  isLoading,
}) => {
  const [isRescheduling, setIsRescheduling] = useState(false);

  if (!task) {
    return (
      <Card padding="lg" glow="indigo" className="text-center py-12 border-slate-800">
        <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
          Curriculum Mastered! 🎉
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
          You've conquered every lesson and milestone in this roadmap! Take on the final capstone project or explore another skill path.
        </p>
        <div className="flex items-center justify-center gap-3">
          {onViewNextStep && (
            <Button variant="accent" size="md" onClick={onViewNextStep} leftIcon={<Sparkles className="w-4 h-4" />}>
              View Capstone Project
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const isInProgress = task.status === 'in_progress';
  const isOverdue = task.status === 'overdue' || task.isOverdue;

  const handleQuickReschedule = async () => {
    setIsRescheduling(true);
    try {
      await onReschedule(task, task.dayNumber + 1);
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <Card
      glow="indigo"
      padding="lg"
      className="border-indigo-500/40 relative overflow-hidden space-y-5"
    >
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-600/15 via-violet-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="indigo" size="md" dot>
            Continue Learning
          </Badge>

          {isInProgress ? (
            <Badge variant="emerald" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block mr-1.5" />
              Active Session in Progress
            </Badge>
          ) : isOverdue ? (
            <Badge variant="amber" size="sm">
              <AlertTriangle className="w-3 h-3 mr-1 inline" />
              Overdue Task
            </Badge>
          ) : (
            <Badge variant="slate" size="sm">
              Day {task.dayNumber} Recommended
            </Badge>
          )}

          {task.isMilestone && (
            <Badge variant="violet" size="sm">
              🌟 Phase Milestone
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Estimated: ~{task.estimatedMinutes} mins</span>
        </div>
      </div>

      {/* Main Task Title & Concept */}
      <div className="relative z-10 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
          Day {task.dayNumber} • {task.phaseTitle}
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          {task.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          {task.conceptSummary}
        </p>
      </div>

      {/* Learning Objectives Preview */}
      {task.learningObjectives && task.learningObjectives.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 relative z-10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Learning Objectives for Today
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            {task.learningObjectives.map((obj, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Today's Practical Mission Box */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-indigo-950/30 to-slate-950 border border-indigo-500/20 space-y-1.5 relative z-10">
        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" />
          Today's Practical Mission
        </div>
        <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
          {task.practicalExercise}
        </p>
      </div>

      {/* Primary Actions Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 relative z-10">
        {/* Left: Quick Reschedule */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleQuickReschedule}
            disabled={isRescheduling || isLoading}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            {isRescheduling ? 'Rescheduling...' : 'Reschedule to Tomorrow'}
          </Button>
        </div>

        {/* Right: Start / Resume & Mark Complete */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            onClick={() => onToggleComplete(task)}
            disabled={isLoading}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          >
            Mark Done (+50 XP)
          </Button>

          <Button
            variant="accent"
            size="md"
            onClick={() => onStartLesson(task)}
            leftIcon={
              isInProgress ? (
                <PauseCircle className="w-4 h-4 text-white" />
              ) : (
                <PlayCircle className="w-4 h-4 text-white" />
              )
            }
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isInProgress ? 'Resume Lesson' : 'Start Lesson'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
