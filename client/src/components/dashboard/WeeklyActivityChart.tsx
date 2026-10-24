import React from 'react';
import { Clock, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import type { WeeklyDayActivity } from '../../types';

export interface WeeklyActivityChartProps {
  weeklyActivity: WeeklyDayActivity[];
  totalHoursStudied: number;
  dailyTargetHours: number;
  streakDays: number;
}

export const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({
  weeklyActivity,
  totalHoursStudied,
  dailyTargetHours,
  streakDays,
}) => {
  const maxMinutes = Math.max(60, ...weeklyActivity.map((d) => d.minutes), dailyTargetHours * 60);

  return (
    <Card padding="md" className="space-y-4 border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Weekly Learning Velocity
            </h4>
            <p className="text-[11px] text-slate-400">
              Target: {dailyTargetHours}h/day (~{Math.round(dailyTargetHours * 60)} mins)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span><strong>{totalHoursStudied}h</strong> Logged</span>
          </div>
        </div>
      </div>

      {/* 7-Day Bar Chart */}
      <div className="pt-2">
        <div className="grid grid-cols-7 gap-2 items-end h-32 px-1">
          {weeklyActivity.map((activity, idx) => {
            const heightPercent = maxMinutes > 0 ? Math.min(100, Math.round((activity.minutes / maxMinutes) * 100)) : 0;
            const targetMins = Math.round(dailyTargetHours * 60);
            const metTarget = activity.minutes >= targetMins && activity.minutes > 0;

            return (
              <div key={idx} className="flex flex-col items-center justify-end h-full gap-2 group">
                {/* Tooltip / Value on hover */}
                <div className="text-[10px] font-mono text-slate-400 group-hover:text-indigo-300 transition-colors">
                  {activity.minutes > 0 ? `${activity.minutes}m` : '0m'}
                </div>

                {/* Bar */}
                <div className="w-full max-w-[28px] bg-slate-950 rounded-lg p-0.5 border border-slate-800/80 flex items-end h-20 relative overflow-hidden">
                  <div
                    style={{ height: `${Math.max(8, heightPercent)}%` }}
                    className={`w-full rounded-[6px] transition-all duration-500 ${
                      activity.minutes === 0
                        ? 'bg-slate-800/50'
                        : metTarget
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-glow-sm'
                        : activity.isToday
                        ? 'bg-gradient-to-t from-indigo-600 to-cyan-400 shadow-glow-sm'
                        : 'bg-gradient-to-t from-indigo-600 to-violet-500'
                    }`}
                  />
                  {metTarget && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300" />
                    </div>
                  )}
                </div>

                {/* Day label */}
                <span
                  className={`text-[11px] font-medium transition-colors ${
                    activity.isToday
                      ? 'text-indigo-400 font-bold underline decoration-indigo-500 decoration-2 underline-offset-4'
                      : 'text-slate-400'
                  }`}
                >
                  {activity.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational insight strip */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {streakDays >= 3
              ? `Incredible! You're on a ${streakDays}-day streak. Daily micro-sessions build deep neuro-connections.`
              : 'Consistent 30-minute daily missions beat weekend cramming by 4.2x in retention tests.'}
          </span>
        </div>
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 shrink-0 hidden sm:block">
          Active Calibrated
        </div>
      </div>
    </Card>
  );
};
