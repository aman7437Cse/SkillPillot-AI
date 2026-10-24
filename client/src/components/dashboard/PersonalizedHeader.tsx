import React from 'react';
import {
  Flame,
  Zap,
  Trophy,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import type { Roadmap, DashboardData } from '../../types';

export interface PersonalizedHeaderProps {
  roadmap: Roadmap;
  dashboard: DashboardData;
  onEditGoal: () => void;
  onPaceRecovery: () => void;
}

export const PersonalizedHeader: React.FC<PersonalizedHeaderProps> = ({
  roadmap,
  dashboard,
  onEditGoal,
  onPaceRecovery,
}) => {
  const { greeting, level, nextMilestone, currentStreak, totalXp, overallProgress } = dashboard;

  return (
    <div className="space-y-4">
      {/* Top Greeting & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="indigo" size="sm" dot>
              {roadmap.skillCategory}
            </Badge>
            <span className="text-xs text-slate-400 capitalize">
              {roadmap.experienceLevel} Level • {roadmap.hoursPerDay}h/day • {roadmap.targetWeeks} Weeks
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5 font-sans">
            {greeting}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Current Goal: <strong className="text-white">{roadmap.targetGoal}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onEditGoal}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-violet-400" />}
          >
            Edit Goal
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onPaceRecovery}
            leftIcon={<Sliders className="w-3.5 h-3.5 text-indigo-400" />}
          >
            Pace Recovery
          </Button>
        </div>
      </div>

      {/* Gamification & Milestone Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Streak */}
        <div className="p-3.5 rounded-2xl glass-card bg-slate-900/60 border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-6 h-6 fill-amber-400/20" />
          </div>
          <div>
            <div className="text-lg font-black text-white">{currentStreak} Days</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Streak
            </div>
          </div>
        </div>

        {/* Metric 2: XP & Level */}
        <div className="p-3.5 rounded-2xl glass-card bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
              <span className="text-xs font-bold text-white">Level {level.levelNumber}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">{totalXp} XP</span>
          </div>

          <div className="text-[11px] text-indigo-300 font-medium truncate">
            {level.title}
          </div>

          <div className="w-full">
            <Progress value={level.progressPercent} size="sm" showPercentage={false} />
          </div>
        </div>

        {/* Metric 3: Overall Completion */}
        <div className="p-3.5 rounded-2xl glass-card bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Curriculum Progress</span>
            <span className="font-bold text-indigo-300">{overallProgress}%</span>
          </div>

          <div className="text-[11px] text-slate-400">
            {dashboard.completedTasksCount} of {dashboard.totalTasksCount} lessons completed
          </div>

          <div className="w-full">
            <Progress value={overallProgress} size="sm" variant="indigo" showPercentage={false} />
          </div>
        </div>

        {/* Metric 4: Next Milestone */}
        <div className="p-3.5 rounded-2xl glass-card bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
              Next Milestone
            </div>
            <div className="text-xs font-bold text-white truncate">
              {nextMilestone ? nextMilestone.title : 'All Milestones Met!'}
            </div>
            <div className="text-[10px] text-slate-400">
              {nextMilestone
                ? `${nextMilestone.tasksRemaining} ${nextMilestone.tasksRemaining === 1 ? 'task' : 'tasks'} remaining`
                : '100% Complete'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
