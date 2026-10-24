import React, { useState } from 'react';
import { Compass, Sparkles, Flame, Zap, CheckCircle2, AlertCircle, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import type { Roadmap } from '../../types';

export interface NavbarProps {
  activeRoadmap: Roadmap | null;
  onOpenGenerator: () => void;
  isBackendHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRoadmap,
  onOpenGenerator,
  isBackendHealthy,
}) => {
  const { user, logout, isConfiguredWithSupabase } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-4 sm:px-8 py-3.5 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1px] shadow-glow-sm">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-indigo-400">
              <Compass className="w-5 h-5 animate-pulse-subtle" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-sans">
                SkillPilot <span className="text-gradient-accent">AI</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Anti-Overwhelm Learning Engine</p>
          </div>
        </div>

        {/* Stats & User Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Backend / Cloud Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            {isBackendHealthy ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">API Live</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Local Fallback</span>
              </>
            )}
          </div>

          {/* Gamification Stats */}
          {activeRoadmap && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span>{activeRoadmap.streakDays || 1}d Streak</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                <span>{activeRoadmap.totalXp || 100} XP</span>
              </div>
            </div>
          )}

          {/* New Roadmap CTA */}
          <Button
            variant="accent"
            size="sm"
            onClick={onOpenGenerator}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">New Roadmap</span>
            <span className="sm:hidden">Create</span>
          </Button>

          {/* User Profile & Logout Dropdown */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all text-xs text-slate-200"
                aria-label="User profile menu"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-6 h-6 rounded-lg object-cover border border-indigo-500/40"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
                    {getInitials(user.fullName)}
                  </div>
                )}
                <span className="hidden md:inline font-semibold max-w-[100px] truncate">
                  {user.fullName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowUserMenu(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-card bg-slate-900/95 border border-slate-800 shadow-2xl p-2 z-40 animate-slide-up">
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className={`w-1.5 h-1.5 rounded-full ${isConfiguredWithSupabase ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                        <span>{isConfiguredWithSupabase ? 'Supabase Live' : 'Local Auth'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
