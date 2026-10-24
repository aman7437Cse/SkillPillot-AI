export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type PaceMode = 'relaxed' | 'balanced' | 'intensive';

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
  isCompleted: boolean;
  completedAt?: string;
  orderIndex: number;
  isEssential: boolean;
  isOverdue?: boolean;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  estimatedWeeks: number;
  tasks: Task[];
}

export interface SkillGap {
  id: string;
  roadmapId: string;
  topicName: string;
  proficiencyScore: number; // 0 - 100
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
  progressPercentage: number;
  phases: RoadmapPhase[];
  skillGaps: SkillGap[];
  streakDays: number;
  totalXp: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRoadmapInput {
  skill: string;
  targetGoal: string;
  experienceLevel: ExperienceLevel;
  hoursPerDay: number;
  targetWeeks: number;
  paceMode?: PaceMode;
  learningPreferences?: string[];
}

export interface PaceRecoveryInput {
  roadmapId: string;
  strategy: 'redistribute' | 'sprint' | 'core_essentials';
}
