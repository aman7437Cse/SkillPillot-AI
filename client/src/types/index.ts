export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type PaceMode = 'relaxed' | 'balanced' | 'intensive';
export type LearningStyle = 'hands_on' | 'visual' | 'reading' | 'video' | 'problem_solving';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'locked' | 'current' | 'upcoming';

export interface PracticeQuestion {
  question: string;
  answerHint?: string;
}

export interface TaskResource {
  title: string;
  url: string;
  type: 'doc' | 'video' | 'practice' | 'cheatsheet';
}

export interface Task {
  id: string;
  roadmapId: string;
  phaseId: string;
  phaseTitle: string;
  dayNumber: number;
  title: string;
  estimatedMinutes: number;
  conceptSummary: string;
  practicalExercise: string;
  keyTakeaways: string[];
  resources: TaskResource[];
  status: TaskStatus;
  isCompleted: boolean;
  completedAt?: string;
  startedAt?: string;
  orderIndex: number;
  isEssential: boolean;
  isOverdue?: boolean;
  isMilestone?: boolean;
  isFinalProject?: boolean;
  prerequisiteTaskIds?: string[];
  learningObjectives?: string[];
  completionCriteria?: string[];
  practiceQuestions?: PracticeQuestion[];
  rescheduledCount?: number;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  estimatedWeeks: number;
  tasks: Task[];
  orderIndex: number;
}

export interface SkillGap {
  id: string;
  roadmapId: string;
  topicName: string;
  proficiencyScore: number;
  status: 'critical_blocker' | 'needs_review' | 'mastered';
  recommendedAction: string;
  lastEvaluatedAt: string;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface FinalProject {
  title: string;
  description: string;
  deliverables: string[];
  rubric: string[];
}

export interface Roadmap {
  id: string;
  userId: string;
  title: string;
  skillCategory: string;
  targetGoal: string;
  experienceLevel: ExperienceLevel;
  hoursPerDay: number;
  targetWeeks: number;
  paceMode: PaceMode;
  learningStyle: LearningStyle;
  existingKnowledge: string[];
  progressPercentage: number;
  phases: RoadmapPhase[];
  skillGaps: SkillGap[];
  finalProject?: FinalProject;
  isAiGenerated: boolean;
  generationProvider: string;
  streakDays: number;
  totalXp: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRoadmapPayload {
  skill: string;
  targetGoal: string;
  experienceLevel: ExperienceLevel;
  hoursPerDay: number;
  targetWeeks: number;
  paceMode?: PaceMode;
  learningStyle?: LearningStyle;
  existingKnowledge?: string[];
  avatarUrl?: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
  environment: string;
  integrations: {
    ai: {
      provider: string;
      configured: boolean;
      recommendation: string;
    };
    persistence: {
      provider: string;
      configured: boolean;
      recommendation: string;
    };
  };
}

export interface StudySession {
  id: string;
  userId: string;
  roadmapId: string;
  taskId: string;
  taskTitle: string;
  durationMinutes: number;
  startedAt: string;
  completedAt?: string;
  xpEarned: number;
}

export interface WeeklyDayActivity {
  day: string;
  date: string;
  minutes: number;
  isToday: boolean;
}

export interface StudentLevel {
  levelNumber: number;
  title: string;
  currentXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export interface DashboardData {
  greeting: string;
  studentName: string;
  avatarUrl?: string;
  activeGoal: string;
  skillCategory: string;
  experienceLevel: ExperienceLevel;
  overallProgress: number;
  completedTasksCount: number;
  totalTasksCount: number;
  totalHoursStudied: number;
  currentStreak: number;
  totalXp: number;
  level: StudentLevel;
  continueLearningTask: Task | null;
  todayPlan: {
    dayNumber: number;
    tasks: Task[];
    totalEstimatedMinutes: number;
    completedMinutes: number;
    isDayCompleted: boolean;
  };
  weeklyActivity: WeeklyDayActivity[];
  overdueTasks: Task[];
  upcomingTasks: Task[];
  recentlyCompletedTasks: Task[];
  nextMilestone: {
    title: string;
    dayNumber: number;
    phaseTitle: string;
    tasksRemaining: number;
  } | null;
}
