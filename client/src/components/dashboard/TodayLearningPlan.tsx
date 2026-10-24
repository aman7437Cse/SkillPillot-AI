import React from 'react';
import {
  Calendar,
  Clock,
  Play,
  RotateCcw,
  Check,
  Terminal
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import type { Task } from '../../types';

export interface TodayLearningPlanProps {
  dayNumber: number;
  tasks: Task[];
  totalEstimatedMinutes: number;
  completedMinutes: number;
  isDayCompleted: boolean;
  onOpenTask: (task: Task) => void;
  onToggleComplete: (task: Task) => Promise<void>;
  onRescheduleTask: (task: Task, newDayNumber: number) => Promise<void>;
  isLoading?: boolean;
}

export const TodayLearningPlan: React.FC<TodayLearningPlanProps> = ({
  dayNumber,
  tasks,
  totalEstimatedMinutes,
  completedMinutes,
  isDayCompleted,
  onOpenTask,
  onToggleComplete,
  onRescheduleTask,
  isLoading,
}) => {
  const percent = totalEstimatedMinutes > 0 ? Math.round((completedMinutes / totalEstimatedMinutes) * 100) : 0;

  return (
    <Card padding="md" className="space-y-4 border-slate-800">
      {/* Header with Day & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Today's Learning Plan (Day {dayNumber})
              </h3>
              {isDayCompleted && (
                <Badge variant="emerald" size="sm">
                  Day Completed ✓
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {tasks.length} {tasks.length === 1 ? 'lesson' : 'lessons'} planned • ~{totalEstimatedMinutes} mins total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-indigo-300">
              {completedMinutes}/{totalEstimatedMinutes} mins ({percent}%)
            </div>
            <div className="w-24 mt-1">
              <Progress value={percent} size="sm" showPercentage={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Task List for Today */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No specific lessons scheduled for Day {dayNumber}. You can explore the full curriculum or catch up on previous days.
          </div>
        ) : (
          tasks.map((task) => {
            const isInProgress = task.status === 'in_progress';

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  task.isCompleted
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                    : isInProgress
                    ? 'bg-indigo-950/30 border-indigo-500/40 shadow-glow-sm'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => onToggleComplete(task)}
                      disabled={isLoading}
                      className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                        task.isCompleted
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-700 hover:border-indigo-400 text-transparent'
                      }`}
                      aria-label="Toggle completion"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                          Lesson
                        </span>
                        <h4
                          onClick={() => onOpenTask(task)}
                          className={`text-sm font-bold cursor-pointer hover:text-indigo-300 transition-colors ${
                            task.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </h4>
                        {task.isMilestone && <Badge variant="violet" size="sm">Milestone</Badge>}
                        {isInProgress && <Badge variant="emerald" size="sm" dot>In Progress</Badge>}
                      </div>

                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {task.conceptSummary}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-slate-500" />
                      ~{task.estimatedMinutes}m
                    </span>
                  </div>
                </div>

                {/* Practical Mission Preview */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed font-sans">
                    <strong>Goal:</strong> {task.practicalExercise}
                  </span>
                </div>

                {/* Action Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onRescheduleTask(task, task.dayNumber + 1)}
                      className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Move to Tomorrow
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={isInProgress ? 'accent' : task.isCompleted ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => onOpenTask(task)}
                      leftIcon={isInProgress ? <Play className="w-3.5 h-3.5" /> : undefined}
                    >
                      {isInProgress ? 'Resume Lesson' : task.isCompleted ? 'Review' : 'Start Lesson'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
