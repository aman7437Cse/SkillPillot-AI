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

export interface GenerateRoadmapInput {
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

export interface PaceRecoveryInput {
  roadmapId: string;
  strategy: 'redistribute' | 'sprint' | 'core_essentials';
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

// AI Assistant & Conversation Types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  provider?: string;
  isAiGenerated?: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  roadmapId?: string;
  createdAt: string;
  updatedAt: string;
  messagesCount?: number;
  lastMessageSnippet?: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}

export interface SendMessagePayload {
  message: string;
  conversationId?: string;
  roadmapId?: string;
  currentTopic?: string;
  stream?: boolean;
}

export interface AssistantStreamEvent {
  type: 'chunk' | 'done' | 'error';
  chunk?: string;
  message?: ChatMessage;
  error?: string;
  provider?: string;
}

// Adaptive Topic Quiz Generator Types
export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'short_answer';
export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'adaptive';

export interface QuizQuestionItem {
  id: string;
  topic: string;
  question: string;
  type: QuizQuestionType;
  options?: string[];
  correctOptionIndex?: number;
  correctAnswer?: string;
  explanation: string;
  hint?: string;
}

export interface SanitizedQuizQuestion {
  id: string;
  topic: string;
  question: string;
  type: QuizQuestionType;
  options?: string[];
}

export interface QuizSession {
  id: string;
  userId: string;
  roadmapId?: string;
  topic: string;
  skillCategory?: string;
  difficulty: QuizDifficulty;
  questionCount: number;
  questionTypes: QuizQuestionType[];
  questions: QuizQuestionItem[];
  createdAt: string;
}

export interface QuizQuestionResult {
  questionId: string;
  question: string;
  type: QuizQuestionType;
  userAnswer: string | number;
  correctAnswer: string | number;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  sessionId: string;
  userId: string;
  roadmapId?: string;
  topic: string;
  difficulty: QuizDifficulty;
  scorePercentage: number;
  totalQuestions: number;
  correctCount: number;
  earnedXp: number;
  questionResults: QuizQuestionResult[];
  masteryStatus: 'mastered' | 'needs_review' | 'critical_blocker';
  createdAt: string;
}

export interface GenerateQuizPayload {
  topic: string;
  roadmapId?: string;
  skillCategory?: string;
  difficulty?: QuizDifficulty;
  questionCount?: number;
  questionTypes?: QuizQuestionType[];
}

export interface SubmitQuizPayload {
  answers: Record<string, string | number>;
}

// AI Doubt Solver Types
export type DoubtActionType = 'explain_simply' | 'give_example' | 'give_hint' | 'practice_question' | 'general';

export interface DoubtSolverPayload {
  query: string;
  topic?: string;
  roadmapId?: string;
  lessonTitle?: string;
  lessonContext?: string;
  actionType?: DoubtActionType;
  hintLevel?: number;
}

export interface DoubtSolverResponse {
  answer: string;
  actionType: DoubtActionType;
  hintLevel?: number;
  totalHints?: number;
  hasMoreHints?: boolean;
  followUpSuggestions: string[];
  provider: string;
  requiresVerification: boolean;
  verificationNote?: string;
}


