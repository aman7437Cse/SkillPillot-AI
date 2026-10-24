import { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Zap,
  CheckCircle2,
  Sliders,
  Award,
  Layers,
  ArrowRight,
  Target,
  Clock,
  Check,
  Terminal,
  ChevronDown,
  ChevronRight,
  Server
} from 'lucide-react';

import { api } from './lib/api';
import { Navbar } from './components/layout/Navbar';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Progress } from './components/ui/Progress';
import { Alert } from './components/ui/Alert';
import { Skeleton } from './components/ui/Skeleton';
import { EmptyState } from './components/common/EmptyState';
import { ErrorState } from './components/common/ErrorState';
import { RoadmapGeneratorModal } from './components/features/RoadmapGeneratorModal';
import { PaceRecoveryModal } from './components/features/PaceRecoveryModal';
import { TopicQuizModal } from './components/features/TopicQuizModal';
import { TaskFocusModal } from './components/features/TaskFocusModal';
import { fireCelebrationConfetti } from './lib/confetti';

import type { Roadmap, Task, SkillGap, GenerateRoadmapPayload, HealthStatus } from './types';

export function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'daily' | 'roadmap' | 'gaps' | 'system'>('daily');
  
  // Data state
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>('');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaceModalOpen, setIsPaceModalOpen] = useState(false);
  const [isPaceRecovering, setIsPaceRecovering] = useState(false);
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [activeQuizGap, setActiveQuizGap] = useState<SkillGap | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

  // Filter for roadmap view
  const [roadmapFilter, setRoadmapFilter] = useState<'all' | 'pending' | 'completed' | 'essential'>('all');

  // Load initial data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [healthData, roadmapsData] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getRoadmaps().catch(() => []),
      ]);

      setHealth(healthData);
      setRoadmaps(roadmapsData);
      if (roadmapsData.length > 0) {
        setSelectedRoadmapId(roadmapsData[0].id);
        // expand first phase by default
        if (roadmapsData[0].phases && roadmapsData[0].phases.length > 0) {
          setExpandedPhases({ [roadmapsData[0].phases[0].id]: true });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize SkillPilot');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeRoadmap = roadmaps.find((r) => r.id === selectedRoadmapId) || roadmaps[0] || null;

  // Flattened tasks
  const allTasks: Task[] = activeRoadmap?.phases.flatMap((p) => p.tasks) || [];
  const completedTasks = allTasks.filter((t) => t.isCompleted);
  const pendingTasks = allTasks.filter((t) => !t.isCompleted);
  const nextUpTask = pendingTasks[0] || null;

  // Toggle task completion
  const handleToggleTask = async (task: Task) => {
    if (!activeRoadmap) return;
    try {
      const result = await api.toggleTaskCompletion(activeRoadmap.id, task.id, !task.isCompleted);
      
      // Update local state smoothly
      setRoadmaps((prev) =>
        prev.map((r) => (r.id === activeRoadmap.id ? result.roadmap : r))
      );

      if (focusedTask && focusedTask.id === task.id) {
        setFocusedTask(result.task);
      }
    } catch (err: any) {
      alert(`Could not update task: ${err.message}`);
    }
  };

  // Generate new roadmap
  const handleGenerateRoadmap = async (payload: GenerateRoadmapPayload) => {
    setIsGenerating(true);
    try {
      const newRoadmap = await api.generateRoadmap(payload);
      setRoadmaps((prev) => [newRoadmap, ...prev]);
      setSelectedRoadmapId(newRoadmap.id);
      setIsGeneratorOpen(false);
      fireCelebrationConfetti();
      setActiveTab('daily');
    } catch (err: any) {
      alert(`Roadmap generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Recover Pace
  const handleRecoverPace = async (strategy: 'redistribute' | 'sprint' | 'core_essentials') => {
    if (!activeRoadmap) return;
    setIsPaceRecovering(true);
    try {
      const updated = await api.recoverPace(activeRoadmap.id, strategy);
      setRoadmaps((prev) => prev.map((r) => (r.id === activeRoadmap.id ? updated : r)));
      setIsPaceModalOpen(false);
      fireCelebrationConfetti();
    } catch (err: any) {
      alert(`Pace recovery failed: ${err.message}`);
    } finally {
      setIsPaceRecovering(false);
    }
  };

  // Diagnostic Quiz score updated
  const handleQuizScoreSubmitted = (updatedGap: SkillGap) => {
    if (!activeRoadmap) return;
    setRoadmaps((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoadmap.id) return r;
        return {
          ...r,
          skillGaps: r.skillGaps.map((g) => (g.id === updatedGap.id ? updatedGap : g)),
          totalXp: r.totalXp + 75,
        };
      })
    );
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeRoadmap={activeRoadmap}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        isBackendHealthy={Boolean(health && health.status === 'healthy')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Loading / Error States */}
        {isLoading ? (
          <div className="space-y-6 pt-4">
            <Skeleton className="h-28 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-64 md:col-span-2" />
              <Skeleton className="h-64" />
            </div>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : !activeRoadmap ? (
          <EmptyState onAction={() => setIsGeneratorOpen(true)} />
        ) : (
          <>
            {/* Header / Roadmap Switcher Strip */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="indigo" size="sm" dot>
                    Active Roadmap
                  </Badge>
                  <span className="text-xs text-slate-400 capitalize">
                    {activeRoadmap.experienceLevel} Level • {activeRoadmap.hoursPerDay} hrs/day • {activeRoadmap.targetWeeks} Weeks
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
                  {activeRoadmap.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Target Goal: <span className="text-slate-200">{activeRoadmap.targetGoal}</span>
                </p>
              </div>

              {/* Progress and Roadmap Selector */}
              <div className="flex items-center gap-3">
                {roadmaps.length > 1 && (
                  <select
                    value={selectedRoadmapId}
                    onChange={(e) => setSelectedRoadmapId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                  >
                    {roadmaps.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPaceModalOpen(true)}
                  leftIcon={<Sliders className="w-3.5 h-3.5 text-indigo-400" />}
                >
                  Pace Recovery
                </Button>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="p-4 rounded-2xl glass-card border border-slate-800 bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Roadmap Progress</span>
                <span className="font-bold text-indigo-300">
                  {completedTasks.length} of {allTasks.length} Tasks Completed ({activeRoadmap.progressPercentage}%)
                </span>
              </div>
              <Progress value={activeRoadmap.progressPercentage} size="md" variant="indigo" showPercentage={false} />
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('daily')}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'daily'
                    ? 'bg-indigo-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Target className="w-4 h-4" />
                Daily Focus Mode
              </button>

              <button
                onClick={() => setActiveTab('roadmap')}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'roadmap'
                    ? 'bg-indigo-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-4 h-4" />
                Full Curriculum Roadmap ({allTasks.length} Tasks)
              </button>

              <button
                onClick={() => setActiveTab('gaps')}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'gaps'
                    ? 'bg-indigo-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Award className="w-4 h-4" />
                Skill Gap Diagnostics ({activeRoadmap.skillGaps.length})
              </button>

              <button
                onClick={() => setActiveTab('system')}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'system'
                    ? 'bg-indigo-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Server className="w-4 h-4" />
                Platform & AI Status
              </button>
            </div>

            {/* TAB 1: DAILY FOCUS MODE */}
            {activeTab === 'daily' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Today's Spotlight & Next Up */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Anti-Abandonment Schedule Rebalance Suggestion Banner */}
                  <Alert
                    type="info"
                    title="Anti-Overwhelm Guarantee Active"
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsPaceModalOpen(true)}
                        leftIcon={<Sliders className="w-3.5 h-3.5" />}
                      >
                        Adjust Schedule or Catch Up
                      </Button>
                    }
                  >
                    If life interrupts your streak, use Smart Pace Recovery to redistribute tasks smoothly with zero guilt or burnout.
                  </Alert>

                  {/* Today's Spotlight Task */}
                  {nextUpTask ? (
                    <Card glow="indigo" padding="lg" className="border-indigo-500/40 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge variant="indigo" size="md">
                          Today's Bite-Sized Mission
                        </Badge>
                        <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>~{nextUpTask.estimatedMinutes} Mins</span>
                        </div>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        {nextUpTask.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                        {nextUpTask.conceptSummary}
                      </p>

                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 mb-6 space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          Hands-On Practical Goal
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300">
                          {nextUpTask.practicalExercise}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                        <span className="text-xs text-slate-400 font-medium">
                          Day {nextUpTask.dayNumber} • {nextUpTask.phaseTitle}
                        </span>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={() => handleToggleTask(nextUpTask)}
                            leftIcon={<Check className="w-4 h-4" />}
                          >
                            Mark Done
                          </Button>
                          <Button
                            variant="accent"
                            size="md"
                            onClick={() => setFocusedTask(nextUpTask)}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                          >
                            Enter Focus Mode
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card padding="lg" className="text-center py-12">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-white mb-1">
                        All Tasks Completed!
                      </h3>
                      <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
                        Incredible dedication! You have finished every milestone in this roadmap. Ready for your next skill?
                      </p>
                      <Button
                        variant="accent"
                        size="md"
                        onClick={() => setIsGeneratorOpen(true)}
                        leftIcon={<Sparkles className="w-4 h-4" />}
                      >
                        Create a New Roadmap
                      </Button>
                    </Card>
                  )}

                  {/* Next Up Queue */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Upcoming Daily Tasks
                    </h3>

                    <div className="space-y-2.5">
                      {pendingTasks.slice(1, 5).map((task) => (
                        <div
                          key={task.id}
                          className="p-3.5 rounded-xl glass-card border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleTask(task)}
                              className="w-5 h-5 rounded-lg border border-slate-700 hover:border-indigo-400 flex items-center justify-center text-transparent hover:text-indigo-400 transition-colors"
                              aria-label="Complete task"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <div>
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white cursor-pointer" onClick={() => setFocusedTask(task)}>
                                {task.title}
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                Day {task.dayNumber} • {task.estimatedMinutes} mins • {task.phaseTitle}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFocusedTask(task)}
                          >
                            Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right 1 Col: Gamification, Streaks & Quick Gaps */}
                <div className="space-y-6">
                  {/* Streak & XP Card */}
                  <Card padding="md" className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Motivation & Momentum
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <Flame className="w-6 h-6 text-amber-400 mx-auto mb-1 fill-amber-400/20" />
                        <div className="text-lg font-black text-white">{activeRoadmap.streakDays || 1} Days</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Daily Streak</div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <Zap className="w-6 h-6 text-indigo-400 mx-auto mb-1 fill-indigo-400/20" />
                        <div className="text-lg font-black text-white">{activeRoadmap.totalXp || 100} XP</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Knowledge XP</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Consistent daily practice yields 4.2x higher retention than weekend cramming!</span>
                    </div>
                  </Card>

                  {/* Priority Skill Gaps Snapshot */}
                  <Card padding="md" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Diagnostic Focus Areas
                      </h4>
                      <button
                        onClick={() => setActiveTab('gaps')}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-2">
                      {activeRoadmap.skillGaps.slice(0, 3).map((gap) => (
                        <div
                          key={gap.id}
                          className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-200 truncate">{gap.topicName}</p>
                            <span className="text-[10px] text-slate-400 capitalize">{gap.status.replace('_', ' ')}</span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveQuizGap(gap)}
                          >
                            Quiz
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE CURRICULUM ROADMAP */}
            {activeTab === 'roadmap' && (
              <div className="space-y-6">
                {/* Roadmap Filters */}
                <div className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-xl glass-card border border-slate-800">
                  <div className="flex items-center gap-1.5">
                    {(['all', 'pending', 'completed', 'essential'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setRoadmapFilter(filter)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                          roadmapFilter === filter
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-slate-400">
                    Showing {activeRoadmap.phases.length} Phases • {allTasks.length} Total Milestones
                  </div>
                </div>

                {/* Phases Tree */}
                <div className="space-y-4">
                  {activeRoadmap.phases.map((phase, pIdx) => {
                    const isExpanded = expandedPhases[phase.id] !== false;
                    const phaseCompleted = phase.tasks.filter((t) => t.isCompleted).length;
                    const phaseTotal = phase.tasks.length;
                    const phasePercent = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;

                    // Filter tasks
                    const filteredTasks = phase.tasks.filter((t) => {
                      if (roadmapFilter === 'pending') return !t.isCompleted;
                      if (roadmapFilter === 'completed') return t.isCompleted;
                      if (roadmapFilter === 'essential') return t.isEssential;
                      return true;
                    });

                    return (
                      <Card key={phase.id} padding="none" className="overflow-hidden border-slate-800">
                        {/* Phase Header Accordion */}
                        <div
                          onClick={() => togglePhase(phase.id)}
                          className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              className="text-slate-400 p-1 rounded hover:bg-slate-800 transition-colors"
                              aria-label="Toggle phase"
                            >
                              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                                  Phase {pIdx + 1} ({phase.estimatedWeeks} wks)
                                </span>
                                {phasePercent === 100 && (
                                  <Badge variant="emerald" size="sm">
                                    Phase Completed ✓
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                                {phase.title}
                              </h3>
                              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl hidden sm:block">
                                {phase.description}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-indigo-300">
                              {phaseCompleted}/{phaseTotal} Tasks
                            </span>
                            <div className="w-24 mt-1">
                              <Progress value={phasePercent} size="sm" showPercentage={false} />
                            </div>
                          </div>
                        </div>

                        {/* Phase Task Items */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 pt-0 space-y-2.5 border-t border-slate-800/60 bg-slate-950/40">
                            {filteredTasks.length === 0 ? (
                              <p className="text-xs text-slate-500 py-3 text-center">
                                No tasks matching "{roadmapFilter}" filter in this phase.
                              </p>
                            ) : (
                              filteredTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className={`p-3.5 rounded-xl border transition-all flex items-start sm:items-center justify-between gap-3 ${
                                    task.isCompleted
                                      ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-start sm:items-center gap-3">
                                    <button
                                      onClick={() => handleToggleTask(task)}
                                      className={`w-5 h-5 rounded-lg border mt-0.5 sm:mt-0 flex items-center justify-center transition-colors shrink-0 ${
                                        task.isCompleted
                                          ? 'border-emerald-500 bg-emerald-500 text-white'
                                          : 'border-slate-700 hover:border-indigo-400 text-transparent'
                                      }`}
                                      aria-label={task.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                                    >
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </button>

                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] font-semibold text-slate-400">
                                          Day {task.dayNumber}
                                        </span>
                                        <h4
                                          onClick={() => setFocusedTask(task)}
                                          className={`text-xs sm:text-sm font-semibold cursor-pointer hover:text-indigo-300 transition-colors ${
                                            task.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                                          }`}
                                        >
                                          {task.title}
                                        </h4>
                                        {!task.isEssential && (
                                          <Badge variant="slate" size="sm">
                                            Elective Deep Dive
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                        {task.conceptSummary}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                                      ~{task.estimatedMinutes}m
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setFocusedTask(task)}
                                    >
                                      Focus
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: SKILL GAPS & REVISION */}
            {activeTab === 'gaps' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl glass-card border border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Diagnostic Skill Gap Radar</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Targeted assessments to detect conceptual weaknesses and unblock your progress.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Blocker
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Needs Review
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeRoadmap.skillGaps.map((gap) => {
                    const badgeVariant =
                      gap.status === 'mastered'
                        ? 'emerald'
                        : gap.status === 'needs_review'
                        ? 'amber'
                        : 'rose';

                    return (
                      <Card key={gap.id} padding="md" className="space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <Badge variant={badgeVariant} size="sm" dot>
                              {gap.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs font-bold text-slate-300">
                              {gap.proficiencyScore}% Score
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-white">{gap.topicName}</h4>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            {gap.recommendedAction}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            Last checked: {new Date(gap.lastEvaluatedAt).toLocaleDateString()}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveQuizGap(gap)}
                            leftIcon={<Award className="w-3.5 h-3.5 text-indigo-400" />}
                          >
                            Practice Quiz
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: SYSTEM & PLATFORM STATUS */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <Card padding="lg" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Platform Infrastructure & AI Connectivity</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      SkillPilot AI is architected with dual-mode resilience. It runs out of the box with an intelligent local engine, and seamlessly connects to cloud AI and PostgreSQL when configured.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AI Engine Status */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          AI Reasoning Engine
                        </span>
                        <Badge variant={health?.integrations.ai.configured ? 'emerald' : 'indigo'} size="sm">
                          {health?.integrations.ai.configured ? 'Gemini 2.5 Live' : 'Active Local Generator'}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-white">{health?.integrations.ai.provider}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {health?.integrations.ai.recommendation}
                      </p>
                    </div>

                    {/* Persistence Engine Status */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Database & Storage
                        </span>
                        <Badge variant={health?.integrations.persistence.configured ? 'emerald' : 'indigo'} size="sm">
                          {health?.integrations.persistence.configured ? 'Supabase Live' : 'In-Memory Store'}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-white">{health?.integrations.persistence.provider}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {health?.integrations.persistence.recommendation}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-3">
                    <h5 className="font-semibold text-slate-200">How to configure external services:</h5>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                      <li>
                        To enable Google Gemini live generation, set <code className="text-indigo-300">GEMINI_API_KEY=your_key</code> in <code className="text-indigo-300">server/.env</code>.
                      </li>
                      <li>
                        To persist data in Supabase, run <code className="text-indigo-300">server/db/schema.sql</code> in the Supabase SQL Editor and set <code className="text-indigo-300">SUPABASE_URL</code> and <code className="text-indigo-300">SUPABASE_SERVICE_ROLE_KEY</code> in <code className="text-indigo-300">server/.env</code>.
                      </li>
                    </ol>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SkillPilot AI • Master Any Skill Without Overwhelm</span>
          <span>Bite-sized micro-tasks • Zero-guilt pace recovery • Production Grade</span>
        </div>
      </footer>

      {/* Modals */}
      <RoadmapGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSubmit={handleGenerateRoadmap}
        isLoading={isGenerating}
      />

      <PaceRecoveryModal
        isOpen={isPaceModalOpen}
        onClose={() => setIsPaceModalOpen(false)}
        roadmapTitle={activeRoadmap?.title || 'Current Roadmap'}
        onConfirm={handleRecoverPace}
        isLoading={isPaceRecovering}
      />

      <TopicQuizModal
        isOpen={Boolean(activeQuizGap)}
        onClose={() => setActiveQuizGap(null)}
        gap={activeQuizGap}
        skillName={activeRoadmap?.skillCategory || 'Technology'}
        onScoreSubmitted={handleQuizScoreSubmitted}
      />

      <TaskFocusModal
        isOpen={Boolean(focusedTask)}
        onClose={() => setFocusedTask(null)}
        task={focusedTask}
        onToggleComplete={handleToggleTask}
        isLoading={false}
      />
    </div>
  );
}

export default App;
