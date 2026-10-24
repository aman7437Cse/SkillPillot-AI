import { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Sliders,
  Award,
  Layers,
  Target,
  Check,
  ChevronDown,
  ChevronRight,
  Server,
  Lock,
  Trophy,
  PlayCircle
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { OnboardingWizard } from './components/auth/OnboardingWizard';
import { EditGoalModal } from './components/features/EditGoalModal';
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

import { PersonalizedHeader } from './components/dashboard/PersonalizedHeader';
import { ContinueLearningCard } from './components/dashboard/ContinueLearningCard';
import { TodayLearningPlan } from './components/dashboard/TodayLearningPlan';
import { WeeklyActivityChart } from './components/dashboard/WeeklyActivityChart';
import { TasksQueueTabs } from './components/dashboard/TasksQueueTabs';
import { AssistantView } from './components/assistant/AssistantView';

import type { Roadmap, Task, SkillGap, GenerateRoadmapPayload, HealthStatus, DashboardData } from './types';

function DashboardContent() {
  const { user, isLoading: authLoading } = useAuth();

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'daily' | 'roadmap' | 'gaps' | 'assistant' | 'system'>('daily');
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState<string | null>(null);
  
  // Data state
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isPaceModalOpen, setIsPaceModalOpen] = useState(false);
  const [isPaceRecovering, setIsPaceRecovering] = useState(false);
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [activeQuizGap, setActiveQuizGap] = useState<SkillGap | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

  // Filter for roadmap view
  const [roadmapFilter, setRoadmapFilter] = useState<'all' | 'pending' | 'completed' | 'essential'>('all');

  // Fetch dashboard data
  const fetchDashboard = async (roadmapId: string) => {
    try {
      setIsDashboardLoading(true);
      const data = await api.getDashboard(roadmapId);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsDashboardLoading(false);
    }
  };

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
        const firstId = roadmapsData[0].id;
        setSelectedRoadmapId(firstId);
        // expand first phase by default
        if (roadmapsData[0].phases && roadmapsData[0].phases.length > 0) {
          setExpandedPhases({ [roadmapsData[0].phases[0].id]: true });
        }
        await fetchDashboard(firstId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize SkillPilot');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.isOnboarded) {
      fetchData();
    }
  }, [user?.id, user?.isOnboarded]);

  useEffect(() => {
    if (selectedRoadmapId) {
      fetchDashboard(selectedRoadmapId);
    }
  }, [selectedRoadmapId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1px] shadow-glow-md animate-pulse">
          <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-indigo-400">
            <Compass className="w-7 h-7 animate-spin" />
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-4 animate-pulse">
          Authenticating SkillPilot Session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!user.isOnboarded) {
    return <OnboardingWizard onComplete={() => fetchData()} />;
  }

  const activeRoadmap = roadmaps.find((r) => r.id === selectedRoadmapId) || roadmaps[0] || null;

  // Flattened tasks
  const allTasks: Task[] = activeRoadmap?.phases.flatMap((p) => p.tasks) || [];
  const pendingTasks = allTasks.filter((t) => !t.isCompleted);
  const currentActionTask = allTasks.find((t) => t.status === 'current') || pendingTasks[0] || null;

  // Toggle task completion
  const handleToggleTask = async (task: Task) => {
    if (!activeRoadmap) return;
    try {
      const willComplete = !task.isCompleted;
      const result = await api.toggleTaskCompletion(activeRoadmap.id, task.id, willComplete);
      
      // Update local state smoothly
      setRoadmaps((prev) =>
        prev.map((r) => (r.id === activeRoadmap.id ? result.roadmap : r))
      );

      if (focusedTask && focusedTask.id === task.id) {
        setFocusedTask(result.task);
      }

      if (willComplete) {
        fireCelebrationConfetti();
      }

      await fetchDashboard(activeRoadmap.id);
    } catch (err: any) {
      alert(`Could not update task: ${err.message}`);
    }
  };

  // Start or resume a lesson
  const handleStartLesson = async (task: Task) => {
    if (!activeRoadmap) return;
    try {
      if (task.status !== 'completed' && task.status !== 'in_progress') {
        const res = await api.updateTaskStatus(activeRoadmap.id, task.id, 'in_progress');
        setRoadmaps((prev) =>
          prev.map((r) =>
            r.id === activeRoadmap.id
              ? {
                  ...r,
                  phases: r.phases.map((p) => ({
                    ...p,
                    tasks: p.tasks.map((t) => (t.id === task.id ? res.task : t)),
                  })),
                }
              : r
          )
        );
        setFocusedTask(res.task);
      } else {
        setFocusedTask(task);
      }
      fetchDashboard(activeRoadmap.id);
    } catch (err: any) {
      console.error('Failed to start lesson:', err);
      setFocusedTask(task);
    }
  };

  // Reschedule a task to a different day
  const handleRescheduleTask = async (task: Task, newDayNumber: number) => {
    if (!activeRoadmap) return;
    try {
      const res = await api.rescheduleTask(activeRoadmap.id, task.id, newDayNumber);
      setRoadmaps((prev) =>
        prev.map((r) => (r.id === activeRoadmap.id ? res.roadmap : r))
      );
      if (focusedTask && focusedTask.id === task.id) {
        setFocusedTask(res.task);
      }
      await fetchDashboard(activeRoadmap.id);
    } catch (err: any) {
      alert(`Could not reschedule task: ${err.message}`);
    }
  };

  // Record a focused study session
  const handleRecordSession = async (task: Task, minutes: number) => {
    if (!activeRoadmap) return;
    try {
      await api.recordStudySession(activeRoadmap.id, task.id, minutes);
      await fetchDashboard(activeRoadmap.id);
    } catch (err: any) {
      console.error('Failed to record study session:', err);
    }
  };

  // Navigate to next lesson step
  const handleNextStep = () => {
    if (dashboardData?.upcomingTasks && dashboardData.upcomingTasks.length > 0) {
      setFocusedTask(dashboardData.upcomingTasks[0]);
    } else {
      const nextPending = allTasks.find((t) => !t.isCompleted && (!focusedTask || t.id !== focusedTask.id));
      if (nextPending) {
        setFocusedTask(nextPending);
      }
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
      await fetchDashboard(newRoadmap.id);
    } catch (err: any) {
      alert(`Roadmap generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Edit Goal and Regenerate Roadmap
  const handleRegenerateRoadmap = async (payload: GenerateRoadmapPayload) => {
    if (!activeRoadmap) return;
    setIsRegenerating(true);
    try {
      const updated = await api.regenerateRoadmap(activeRoadmap.id, payload);
      setRoadmaps((prev) => prev.map((r) => (r.id === activeRoadmap.id ? updated : r)));
      setIsEditGoalOpen(false);
      fireCelebrationConfetti();
      await fetchDashboard(activeRoadmap.id);
    } catch (err: any) {
      alert(`Failed to regenerate roadmap: ${err.message}`);
    } finally {
      setIsRegenerating(false);
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
      await fetchDashboard(activeRoadmap.id);
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

  const handleAskAiAboutTask = (task: Task) => {
    const prompt = `Can you explain the concept of "${task.title}" in beginner-friendly terms, provide a practical code example, and give me a step-by-step walkthrough of: "${task.conceptSummary}"?`;
    setAssistantInitialPrompt(prompt);
    setActiveTab('assistant');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeRoadmap={activeRoadmap}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenAssistant={() => setActiveTab('assistant')}
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
            {/* Header / Personalized Student Experience */}
            {dashboardData ? (
              <PersonalizedHeader
                roadmap={activeRoadmap}
                dashboard={dashboardData}
                onEditGoal={() => setIsEditGoalOpen(true)}
                onPaceRecovery={() => setIsPaceModalOpen(true)}
              />
            ) : (
              <Skeleton className="h-44 w-full rounded-2xl" />
            )}

            {/* Roadmap Switcher if multiple roadmaps */}
            {roadmaps.length > 1 && (
              <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
                <span>Select Roadmap:</span>
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
              </div>
            )}

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
                onClick={() => setActiveTab('assistant')}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'assistant'
                    ? 'bg-indigo-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AI Assistant & Tutor
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
                {/* Left 2 Cols: Continue Learning & Today's Plan */}
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

                  {/* Continue Learning Action Card */}
                  <ContinueLearningCard
                    task={dashboardData?.continueLearningTask || currentActionTask}
                    onStartLesson={handleStartLesson}
                    onToggleComplete={handleToggleTask}
                    onReschedule={handleRescheduleTask}
                    onViewNextStep={handleNextStep}
                    onAskAi={handleAskAiAboutTask}
                    isLoading={isDashboardLoading}
                  />

                  {/* Today's Learning Plan */}
                  <TodayLearningPlan
                    dayNumber={dashboardData?.todayPlan.dayNumber || 1}
                    tasks={dashboardData?.todayPlan.tasks || []}
                    totalEstimatedMinutes={dashboardData?.todayPlan.totalEstimatedMinutes || 0}
                    completedMinutes={dashboardData?.todayPlan.completedMinutes || 0}
                    isDayCompleted={dashboardData?.todayPlan.isDayCompleted || false}
                    onOpenTask={(t) => setFocusedTask(t)}
                    onToggleComplete={handleToggleTask}
                    onRescheduleTask={handleRescheduleTask}
                    isLoading={isDashboardLoading}
                  />
                </div>

                {/* Right 1 Col: Weekly Activity Chart, Overdue/Upcoming Queue, and Diagnostics */}
                <div className="space-y-6">
                  {/* 7-Day Velocity Chart */}
                  <WeeklyActivityChart
                    weeklyActivity={dashboardData?.weeklyActivity || []}
                    totalHoursStudied={dashboardData?.totalHoursStudied || 0}
                    dailyTargetHours={activeRoadmap.hoursPerDay || 1.5}
                    streakDays={dashboardData?.currentStreak || 1}
                  />

                  {/* Tasks Queue: Overdue, Upcoming, Recently Completed */}
                  <TasksQueueTabs
                    overdueTasks={dashboardData?.overdueTasks || []}
                    upcomingTasks={dashboardData?.upcomingTasks || []}
                    recentlyCompletedTasks={dashboardData?.recentlyCompletedTasks || []}
                    currentDayNumber={dashboardData?.todayPlan.dayNumber || 1}
                    onOpenTask={(t) => setFocusedTask(t)}
                    onRescheduleTask={handleRescheduleTask}
                    isLoading={isDashboardLoading}
                  />

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
                {/* Next Recommended Action Banner */}
                {currentActionTask && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-violet-950/60 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-glow-sm">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shrink-0 mt-0.5">
                        <PlayCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                            Next Recommended Action
                          </span>
                          <Badge variant="indigo" size="sm">Day {currentActionTask.dayNumber}</Badge>
                          <span className="text-xs text-slate-400 font-medium">{currentActionTask.phaseTitle}</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">
                          {currentActionTask.title}
                        </h4>
                        <p className="text-xs text-slate-300 mt-0.5 line-clamp-1 max-w-2xl">
                          {currentActionTask.conceptSummary}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Button
                        variant="accent"
                        size="md"
                        onClick={() => setFocusedTask(currentActionTask)}
                        leftIcon={<PlayCircle className="w-4 h-4" />}
                      >
                        Start Lesson (~{currentActionTask.estimatedMinutes}m)
                      </Button>
                    </div>
                  </div>
                )}

                {/* Provenance Strip & Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl glass-card border border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-slate-400">Curriculum Source:</span>
                      <strong className="text-slate-200">{activeRoadmap.generationProvider || 'Curriculum Catalog'}</strong>
                      {activeRoadmap.isAiGenerated && (
                        <Badge variant="indigo" size="sm">Live AI</Badge>
                      )}
                    </div>

                    {activeRoadmap.learningStyle && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-300 capitalize">
                        Style: {activeRoadmap.learningStyle.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['all', 'pending', 'completed', 'essential'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setRoadmapFilter(filter)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                          roadmapFilter === filter
                            ? 'bg-indigo-600 text-white shadow-glow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
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
                              <div className="flex items-center gap-2 flex-wrap">
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
                                    task.status === 'completed'
                                      ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                                      : task.status === 'current'
                                      ? 'bg-indigo-950/30 border-indigo-500/40 shadow-glow-sm'
                                      : task.status === 'locked'
                                      ? 'bg-slate-950/60 border-slate-800/80 opacity-70'
                                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-start sm:items-center gap-3">
                                    {/* Completion Checkbox */}
                                    <button
                                      onClick={() => handleToggleTask(task)}
                                      className={`w-5 h-5 rounded-lg border mt-0.5 sm:mt-0 flex items-center justify-center transition-colors shrink-0 ${
                                        task.isCompleted
                                          ? 'border-emerald-500 bg-emerald-500 text-white'
                                          : task.status === 'current'
                                          ? 'border-indigo-400 text-transparent hover:text-indigo-400'
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

                                        {/* Status Badge */}
                                        {task.status === 'completed' && (
                                          <Badge variant="emerald" size="sm">✓ Done</Badge>
                                        )}
                                        {task.status === 'current' && (
                                          <Badge variant="indigo" size="sm" dot>Current</Badge>
                                        )}
                                        {task.status === 'locked' && (
                                          <Badge variant="amber" size="sm">
                                            <Lock className="w-2.5 h-2.5 mr-1 inline" />
                                            Locked
                                          </Badge>
                                        )}

                                        {/* Milestone & Capstone Badges */}
                                        {task.isMilestone && (
                                          <Badge variant="violet" size="sm">🌟 Milestone</Badge>
                                        )}
                                        {task.isFinalProject && (
                                          <Badge variant="cyan" size="sm">🏆 Capstone</Badge>
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
                                      variant={
                                        task.status === 'current'
                                          ? 'accent'
                                          : task.status === 'completed'
                                          ? 'secondary'
                                          : task.status === 'locked'
                                          ? 'outline'
                                          : 'ghost'
                                      }
                                      size="sm"
                                      onClick={() => setFocusedTask(task)}
                                    >
                                      {task.status === 'current'
                                        ? 'Start Lesson'
                                        : task.status === 'completed'
                                        ? 'Review'
                                        : task.status === 'locked'
                                        ? 'Preview'
                                        : 'Details'}
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

                {/* Final Capstone Project Card */}
                {activeRoadmap.finalProject && (
                  <Card padding="lg" glow="violet" className="border-violet-500/30 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                              Curriculum Capstone Portfolio Project
                            </span>
                            <Badge variant="violet" size="sm">Final Milestone</Badge>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                            {activeRoadmap.finalProject.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {activeRoadmap.finalProject.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Project Deliverables
                        </h5>
                        <ul className="space-y-1.5 text-xs text-slate-400">
                          {activeRoadmap.finalProject.deliverables.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Evaluation Rubric
                        </h5>
                        <ul className="space-y-1.5 text-xs text-slate-400">
                          {activeRoadmap.finalProject.rubric.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                )}
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

            {/* TAB: AI ASSISTANT & TUTOR */}
            {activeTab === 'assistant' && (
              <div className="space-y-4">
                <AssistantView
                  activeRoadmap={activeRoadmap}
                  currentTask={currentActionTask}
                  initialPrompt={assistantInitialPrompt}
                  onClearInitialPrompt={() => setAssistantInitialPrompt(null)}
                />
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
        onStartSession={handleRecordSession}
        onReschedule={handleRescheduleTask}
        onNextStep={handleNextStep}
        onAskAi={handleAskAiAboutTask}
        isLoading={false}
      />

      {activeRoadmap && (
        <EditGoalModal
          isOpen={isEditGoalOpen}
          onClose={() => setIsEditGoalOpen(false)}
          roadmap={activeRoadmap}
          onRegenerate={handleRegenerateRoadmap}
          isLoading={isRegenerating}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;
