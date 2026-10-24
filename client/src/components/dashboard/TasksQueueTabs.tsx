import React, { useState } from 'react';
import {
  AlertTriangle,
  Layers,
  CheckCircle2,
  RotateCcw,
  Play,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { Task } from '../../types';

export interface TasksQueueTabsProps {
  overdueTasks: Task[];
  upcomingTasks: Task[];
  recentlyCompletedTasks: Task[];
  currentDayNumber: number;
  onOpenTask: (task: Task) => void;
  onRescheduleTask: (task: Task, newDayNumber: number) => Promise<void>;
  isLoading?: boolean;
}

export const TasksQueueTabs: React.FC<TasksQueueTabsProps> = ({
  overdueTasks,
  upcomingTasks,
  recentlyCompletedTasks,
  currentDayNumber,
  onOpenTask,
  onRescheduleTask,
  isLoading: _isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'overdue' | 'upcoming' | 'completed'>(
    overdueTasks.length > 0 ? 'overdue' : 'upcoming'
  );

  return (
    <Card padding="md" className="space-y-4 border-slate-800">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2.5 overflow-x-auto">
        {overdueTasks.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overdue'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-glow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Overdue Tasks</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-[10px] font-bold text-amber-200">
              {overdueTasks.length}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-glow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Upcoming Schedule</span>
          <span className="text-[10px] text-slate-400 font-normal">({upcomingTasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'completed'
              ? 'bg-indigo-600 text-white shadow-glow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Recently Completed</span>
          <span className="text-[10px] text-slate-400 font-normal">({recentlyCompletedTasks.length})</span>
        </button>
      </div>

      {/* Tab 1: Overdue Tasks */}
      {activeTab === 'overdue' && (
        <div className="space-y-2.5">
          {overdueTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No overdue tasks! You're completely up to date with your schedule.
            </p>
          ) : (
            overdueTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      Day {task.dayNumber} (Earlier)
                    </span>
                    <Badge variant="amber" size="sm">Overdue</Badge>
                  </div>
                  <h4
                    onClick={() => onOpenTask(task)}
                    className="text-xs sm:text-sm font-bold text-white mt-0.5 cursor-pointer hover:text-amber-300 transition-colors"
                  >
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {task.conceptSummary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRescheduleTask(task, currentDayNumber)}
                    leftIcon={<RotateCcw className="w-3 h-3" />}
                  >
                    Reschedule to Today
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => onOpenTask(task)}
                    leftIcon={<Play className="w-3 h-3" />}
                  >
                    Catch Up
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Upcoming Tasks */}
      {activeTab === 'upcoming' && (
        <div className="space-y-2.5">
          {upcomingTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No upcoming tasks left in this roadmap!
            </p>
          ) : (
            upcomingTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Day {task.dayNumber}
                    </span>
                    {task.isMilestone && <Badge variant="violet" size="sm">Milestone</Badge>}
                    {task.status === 'locked' && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </div>
                  <h4
                    onClick={() => onOpenTask(task)}
                    className="text-xs sm:text-sm font-semibold text-slate-200 cursor-pointer hover:text-indigo-300 transition-colors mt-0.5"
                  >
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {task.phaseTitle} • ~{task.estimatedMinutes}m
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenTask(task)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Preview
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Recently Completed */}
      {activeTab === 'completed' && (
        <div className="space-y-2.5">
          {recentlyCompletedTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No lessons completed yet. Start your Day 1 mission above!
            </p>
          ) : (
            recentlyCompletedTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4
                      onClick={() => onOpenTask(task)}
                      className="text-xs sm:text-sm font-semibold text-slate-200 line-through cursor-pointer hover:text-white"
                    >
                      {task.title}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Day {task.dayNumber} • Finished{' '}
                      {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="emerald" size="sm">+50 XP</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenTask(task)}
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
};
