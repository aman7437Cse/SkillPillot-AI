import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import type {
  Roadmap,
  Task,
  SkillGap,
  PaceRecoveryInput,
  TaskStatus,
  StudySession,
  DashboardData,
  StudentLevel,
  WeeklyDayActivity,
} from '../types/index.js';

function calculateLevel(xp: number): StudentLevel {
  const levels = [
    { level: 1, title: 'Curious Apprentice', minXp: 0, nextXp: 200 },
    { level: 2, title: 'Diligent Builder', minXp: 200, nextXp: 500 },
    { level: 3, title: 'Code Crafter', minXp: 500, nextXp: 900 },
    { level: 4, title: 'System Architect', minXp: 900, nextXp: 1400 },
    { level: 5, title: 'Principal Engineer', minXp: 1400, nextXp: 2000 },
  ];
  for (const lvl of levels) {
    if (xp < lvl.nextXp) {
      const range = lvl.nextXp - lvl.minXp;
      const currentInRange = xp - lvl.minXp;
      return {
        levelNumber: lvl.level,
        title: lvl.title,
        currentXp: xp,
        nextLevelXp: lvl.nextXp,
        progressPercent: Math.min(100, Math.max(0, Math.round((currentInRange / range) * 100))),
      };
    }
  }
  return {
    levelNumber: 6,
    title: 'Master Architect',
    currentXp: xp,
    nextLevelXp: xp + 500,
    progressPercent: 100,
  };
}

let supabase: SupabaseClient | null = null;
if (config.hasSupabase) {
  try {
    const key = config.supabaseServiceRoleKey || config.supabaseAnonKey;
    supabase = createClient(config.supabaseUrl, key);
  } catch (err) {
    console.warn('Could not initialize Supabase client, using local store:', err);
  }
}

/**
 * High-fidelity in-memory local data store
 * Provides persistent operations for immediate development without external setup
 */
class LocalDataStore {
  private roadmaps: Map<string, Roadmap> = new Map();
  private studySessions: Map<string, StudySession[]> = new Map();

  constructor() {
    this.seedDefaultRoadmap();
  }

  private seedDefaultRoadmap() {
    const defaultRoadmapId = 'roadmap-demo-fullstack';
    const sampleRoadmap: Roadmap = {
      id: defaultRoadmapId,
      userId: 'user-demo-alex',
      title: 'Full-Stack Web Mastery (React, Node.js & TypeScript)',
      skillCategory: 'Full-Stack Development',
      targetGoal: 'Junior to Mid Full-Stack Software Engineer',
      experienceLevel: 'intermediate',
      hoursPerDay: 1.5,
      targetWeeks: 6,
      paceMode: 'balanced',
      learningStyle: 'hands_on',
      existingKnowledge: ['HTML Basics', 'CSS Flexbox'],
      progressPercentage: 33,
      streakDays: 4,
      totalXp: 350,
      isActive: true,
      isAiGenerated: false,
      generationProvider: 'Deterministic Curated Catalog (Demo Mode)',
      finalProject: {
        title: 'Full-Stack Real-Time Collaboration Workspace',
        description: 'Complete production web application with PostgreSQL persistence, authentication, and live updates.',
        deliverables: ['Responsive React UI', 'Express & Zod API', 'Database Migrations', 'Test Suite'],
        rubric: ['Zero memory leaks', 'Type safety', 'Sub-100ms response latency']
      },
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      phases: [
        {
          id: 'phase-1',
          title: 'Phase 1: Modern TypeScript & Component Architecture',
          description: 'Establish rock-solid static typing, predictable state transitions, and component contracts.',
          estimatedWeeks: 2,
          orderIndex: 1,
          tasks: [
            {
              id: 'task-1-1',
              roadmapId: defaultRoadmapId,
              phaseId: 'phase-1',
              phaseTitle: 'Phase 1: Modern TypeScript & Component Architecture',
              dayNumber: 1,
              title: 'TypeScript Generics & Utility Types in Practice',
              estimatedMinutes: 30,
              conceptSummary: 'Understand how Pick, Omit, Partial, and custom generics eliminate runtime bugs and duplicate types.',
              practicalExercise: 'Create a reusable type-safe ApiResponse<T> wrapper and refactor an untyped fetcher function.',
              keyTakeaways: [
                'Avoid `any` like a compiler poison',
                'Leverage Utility types to adhere to DRY principles',
                'Write generic constraints with `extends`'
              ],
              learningObjectives: [
                'Master TypeScript Generics syntax and constraints',
                'Differentiate Pick, Omit, and Partial in application models',
                'Write type-safe API wrappers with generic response signatures'
              ],
              completionCriteria: [
                'Refactor ApiResponse<T> to compile without type errors',
                'Demonstrate usage of generic constraints with extends'
              ],
              practiceQuestions: [
                {
                  question: 'Why is using `unknown` with type narrowing safer than using `any`?',
                  answerHint: '`unknown` forces explicit type checks before properties can be accessed, whereas `any` turns off compiler verification.'
                }
              ],
              resources: [
                { title: 'TypeScript Handbook: Generics', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html', type: 'doc' },
                { title: 'Interactive Generics Sandbox', url: 'https://www.typescriptlang.org/play', type: 'practice' }
              ],
              status: 'completed',
              isCompleted: true,
              completedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
              orderIndex: 1,
              isEssential: true,
              isOverdue: false,
              isMilestone: false,
              prerequisiteTaskIds: []
            },
            {
              id: 'task-1-2',
              roadmapId: defaultRoadmapId,
              phaseId: 'phase-1',
              phaseTitle: 'Phase 1: Modern TypeScript & Component Architecture',
              dayNumber: 2,
              title: 'Custom React Hooks for Network & Local Storage',
              estimatedMinutes: 35,
              conceptSummary: 'Encapsulate side-effects cleanly with custom hooks using useEffect, useCallback, and abort controllers.',
              practicalExercise: 'Implement a `useLocalStorage<T>` hook with cross-tab event synchronization.',
              keyTakeaways: [
                'Keep hooks focused on a single responsibility',
                'Always include cleanup functions for browser listeners',
                'Ensure dependency arrays avoid stale closures'
              ],
              learningObjectives: [
                'Isolate side-effects with dedicated custom React hooks',
                'Synchronize browser storage safely using window storage events',
                'Prevent stale closures with optimal dependency arrays'
              ],
              completionCriteria: [
                'Test useLocalStorage with string, object, and number state',
                'Verify cross-tab state updates via storage event listener'
              ],
              practiceQuestions: [
                {
                  question: 'What memory leak occurs if an event listener inside useEffect is not cleaned up in the return callback?',
                  answerHint: 'The callback remains subscribed to the global window, holding references to unmounted components.'
                }
              ],
              resources: [
                { title: 'React Hooks Documentation', url: 'https://react.dev/reference/react', type: 'doc' }
              ],
              status: 'completed',
              isCompleted: true,
              completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
              orderIndex: 2,
              isEssential: true,
              isOverdue: false,
              isMilestone: false,
              prerequisiteTaskIds: ['task-1-1']
            },
            {
              id: 'task-1-3',
              roadmapId: defaultRoadmapId,
              phaseId: 'phase-1',
              phaseTitle: 'Phase 1: Modern TypeScript & Component Architecture',
              dayNumber: 3,
              title: 'Compound Components Pattern in React',
              estimatedMinutes: 40,
              conceptSummary: 'Build flexible UI primitives (e.g. Accordion, Modal) where parent and child coordinate implicitly via Context.',
              practicalExercise: 'Build a compound `<Tabs>` component with `<Tabs.List>`, `<Tabs.Trigger>`, and `<Tabs.Content>`.',
              keyTakeaways: [
                'Provides consumer flexibility without prop drilling',
                'Enhances readability of complex UI elements',
                'Follows modern component library design systems'
              ],
              learningObjectives: [
                'Design cohesive compound component contracts with React Context',
                'Coordinate sub-components implicitly without prop drilling',
                'Implement accessible keyboard tab navigation'
              ],
              completionCriteria: [
                'Render compound <Tabs> with active state highlighting',
                'Ensure clicking a tab switch panel visibility correctly'
              ],
              practiceQuestions: [
                {
                  question: 'How does React Context in compound components prevent consumer prop drilling?',
                  answerHint: 'The parent provider shares state implicitly with child elements like Tab.Trigger through context consumer hooks.'
                }
              ],
              resources: [
                { title: 'Compound Component Patterns in React', url: 'https://react.dev', type: 'doc' }
              ],
              status: 'current',
              isCompleted: false,
              orderIndex: 3,
              isEssential: true,
              isOverdue: false,
              isMilestone: false,
              prerequisiteTaskIds: ['task-1-2']
            },
            {
              id: 'task-1-4',
              roadmapId: defaultRoadmapId,
              phaseId: 'phase-1',
              phaseTitle: 'Phase 1: Modern TypeScript & Component Architecture',
              dayNumber: 4,
              title: 'Phase Milestone: Component Library Showcase',
              estimatedMinutes: 45,
              conceptSummary: 'Integrate the compound component pattern with design system tokens into an interactive documentation story.',
              practicalExercise: 'Publish a functional component showcase displaying tabs, badges, and modal dialogs.',
              keyTakeaways: ['Write storybook-style examples', 'Verify keyboard accessibility'],
              learningObjectives: [
                'Publish accessible UI primitives for reusable design systems',
                'Validate keyboard navigation and ARIA roles across interactive elements'
              ],
              completionCriteria: [
                'Showcase compound tabs and modal dialogs in interactive preview',
                'Confirm ARIA roles pass accessibility tree check'
              ],
              practiceQuestions: [
                {
                  question: 'Which ARIA attribute connects a tab trigger to its corresponding tab panel?',
                  answerHint: 'aria-controls linked to the panel id, combined with aria-labelledby on the panel.'
                }
              ],
              resources: [
                { title: 'Design System Accessibility Guidelines', url: 'https://www.w3.org/WAI/ARIA/apg/', type: 'doc' }
              ],
              status: 'locked',
              isCompleted: false,
              orderIndex: 4,
              isEssential: true,
              isOverdue: false,
              isMilestone: true,
              prerequisiteTaskIds: ['task-1-3']
            }
          ]
        },
        {
          id: 'phase-2',
          title: 'Phase 2: Express, REST API Design & PostgreSQL Schema',
          description: 'Construct resilient backend architectures with Zod schema validation and relational models.',
          estimatedWeeks: 2,
          orderIndex: 2,
          tasks: [
            {
              id: 'task-2-1',
              roadmapId: defaultRoadmapId,
              phaseId: 'phase-2',
              phaseTitle: 'Phase 2: Express, REST API Design & PostgreSQL Schema',
              dayNumber: 5,
              title: 'Request Validation with Zod & Express Middleware',
              estimatedMinutes: 30,
              conceptSummary: 'Safeguard API endpoints from malformed payloads with typed runtime schema verification.',
              practicalExercise: 'Write an Express middleware that validates request params, query, and body using a generic Zod schema.',
              keyTakeaways: ['Never trust incoming user payloads', 'Return structured 400 errors with exact field path descriptions'],
              learningObjectives: [
                'Enforce schema validation at HTTP controller boundary with Zod',
                'Return structured 400 error payloads detailing exact violation paths'
              ],
              completionCriteria: [
                'Intercept invalid bodies and return 400 Bad Request',
                'Pass valid payloads through to the request handler'
              ],
              practiceQuestions: [
                {
                  question: 'What is the main benefit of parsing requests with Zod in TypeScript Express apps?',
                  answerHint: 'Zod provides both runtime validation and static TypeScript type inference in a single declaration.'
                }
              ],
              resources: [
                { title: 'Zod Official Docs', url: 'https://zod.dev', type: 'doc' }
              ],
              status: 'locked',
              isCompleted: false,
              orderIndex: 5,
              isEssential: true,
              isOverdue: false,
              isMilestone: false,
              prerequisiteTaskIds: ['task-1-4']
            },
            {
              id: 'task-2-2',
              roadmapId: defaultRoadmapId,
              phaseId: 'phase-2',
              phaseTitle: 'Phase 2: Express, REST API Design & PostgreSQL Schema',
              dayNumber: 6,
              title: 'Final Capstone Project: End-to-End Workspace SaaS',
              estimatedMinutes: 60,
              conceptSummary: 'Assemble frontend client and backend server into a production-ready application.',
              practicalExercise: 'Connect the database models and test complete user authentication and project state.',
              keyTakeaways: ['Coordinate full-stack state', 'Prepare deployment configurations'],
              learningObjectives: [
                'Architect end-to-end full-stack web application with relational database',
                'Implement authentication and persistent task state'
              ],
              completionCriteria: [
                'Working database migrations and seed data',
                'Verified zero runtime crashes across user workflows'
              ],
              practiceQuestions: [
                {
                  question: 'Why are database indexes crucial on foreign key columns like user_id and roadmap_id?',
                  answerHint: 'They prevent full-table sequential scans when filtering rows for authenticated user queries.'
                }
              ],
              resources: [
                { title: 'Full Stack Deployment Guide', url: 'https://expressjs.com', type: 'doc' }
              ],
              status: 'locked',
              isCompleted: false,
              orderIndex: 6,
              isEssential: true,
              isOverdue: false,
              isMilestone: true,
              isFinalProject: true,
              prerequisiteTaskIds: ['task-2-1']
            }
          ]
        }
      ],
      skillGaps: [
        {
          id: 'gap-demo-1',
          roadmapId: defaultRoadmapId,
          topicName: 'TypeScript Generics & Utility Types',
          proficiencyScore: 85,
          status: 'mastered',
          recommendedAction: 'Well done! Ready for advanced conditional types.',
          lastEvaluatedAt: new Date().toISOString()
        },
        {
          id: 'gap-demo-2',
          roadmapId: defaultRoadmapId,
          topicName: 'Compound Component Architecture',
          proficiencyScore: 50,
          status: 'needs_review',
          recommendedAction: 'Complete Day 3 practical exercise to solidify context coordination.',
          lastEvaluatedAt: new Date().toISOString()
        },
        {
          id: 'gap-demo-3',
          roadmapId: defaultRoadmapId,
          topicName: 'PostgreSQL Relational Design & Indexing',
          proficiencyScore: 30,
          status: 'critical_blocker',
          recommendedAction: 'Review composite indexes and foreign key cascading rules in Phase 2.',
          lastEvaluatedAt: new Date().toISOString()
        }
      ]
    };

    this.roadmaps.set(defaultRoadmapId, sampleRoadmap);

    // Seed realistic study sessions for the demo user
    const now = Date.now();
    const demoSessions: StudySession[] = [
      {
        id: 'session-demo-1',
        userId: 'user-demo-alex',
        roadmapId: defaultRoadmapId,
        taskId: 'task-1-1',
        taskTitle: 'TypeScript Generics & Utility Types in Practice',
        durationMinutes: 30,
        startedAt: new Date(now - 3 * 86400000).toISOString(),
        completedAt: new Date(now - 3 * 86400000 + 30 * 60000).toISOString(),
        xpEarned: 50,
      },
      {
        id: 'session-demo-2',
        userId: 'user-demo-alex',
        roadmapId: defaultRoadmapId,
        taskId: 'task-1-2',
        taskTitle: 'Custom React Hooks for Network & Local Storage',
        durationMinutes: 35,
        startedAt: new Date(now - 2 * 86400000).toISOString(),
        completedAt: new Date(now - 2 * 86400000 + 35 * 60000).toISOString(),
        xpEarned: 50,
      },
      {
        id: 'session-demo-3',
        userId: 'user-demo-alex',
        roadmapId: defaultRoadmapId,
        taskId: 'task-1-3',
        taskTitle: 'Compound Components Pattern in React',
        durationMinutes: 20,
        startedAt: new Date(now - 1 * 86400000).toISOString(),
        completedAt: new Date(now - 1 * 86400000 + 20 * 60000).toISOString(),
        xpEarned: 25,
      },
      {
        id: 'session-demo-4',
        userId: 'user-demo-alex',
        roadmapId: defaultRoadmapId,
        taskId: 'task-1-3',
        taskTitle: 'Compound Components Pattern in React',
        durationMinutes: 25,
        startedAt: new Date(now - 3600000).toISOString(),
        completedAt: new Date(now - 3600000 + 25 * 60000).toISOString(),
        xpEarned: 35,
      },
    ];
    this.studySessions.set(defaultRoadmapId, demoSessions);
  }

  public async getAllRoadmaps(userId?: string): Promise<Roadmap[]> {
    const list = Array.from(this.roadmaps.values());
    if (!userId) return list;

    // Filter by specific user; if demo user and no roadmaps yet, return default demo roadmap
    const userRoadmaps = list.filter((r) => r.userId === userId);
    if (userRoadmaps.length === 0 && (userId === 'user-demo-alex' || userId === 'user-demo-1')) {
      const demo = this.roadmaps.get('roadmap-demo-fullstack');
      if (demo) return [demo];
    }
    return userRoadmaps;
  }

  public async getRoadmapById(id: string, userId?: string): Promise<Roadmap | null> {
    const roadmap = this.roadmaps.get(id);
    if (!roadmap) return null;
    if (userId && roadmap.userId !== userId && roadmap.userId !== 'user-demo-alex' && roadmap.userId !== 'user-demo-1') {
      return null;
    }
    return roadmap;
  }

  public async saveRoadmap(roadmap: Roadmap): Promise<Roadmap> {
    this.roadmaps.set(roadmap.id, roadmap);
    return roadmap;
  }

  public async deleteRoadmap(id: string, userId?: string): Promise<boolean> {
    const roadmap = this.roadmaps.get(id);
    if (!roadmap) return false;
    if (userId && roadmap.userId !== userId) return false;
    this.roadmaps.delete(id);
    this.studySessions.delete(id);
    return true;
  }

  /**
   * Recalculates dynamic task statuses (completed, in_progress, current, locked, upcoming, overdue)
   * based on task completion, prerequisite chain, and scheduled day
   */
  private updateTaskStatuses(roadmap: Roadmap) {
    let hasFoundCurrent = false;

    // Find current active day number
    const pendingTasks = roadmap.phases.flatMap((p) => p.tasks).filter((t) => !t.isCompleted);
    const activeDayNumber = pendingTasks.length > 0 ? pendingTasks[0].dayNumber : 999;

    for (const phase of roadmap.phases) {
      for (const task of phase.tasks) {
        if (task.isCompleted) {
          task.status = 'completed';
          task.isOverdue = false;
        } else {
          // Check if prerequisites are completed
          const prereqsMet =
            !task.prerequisiteTaskIds ||
            task.prerequisiteTaskIds.length === 0 ||
            task.prerequisiteTaskIds.every((prereqId) => {
              const prereqTask = roadmap.phases.flatMap((p) => p.tasks).find((t) => t.id === prereqId);
              return prereqTask ? prereqTask.isCompleted : true;
            });

          if (prereqsMet) {
            if (task.status === 'in_progress') {
              hasFoundCurrent = true;
            } else if (!hasFoundCurrent) {
              task.status = 'current';
              hasFoundCurrent = true;
            } else if (task.dayNumber < activeDayNumber) {
              task.status = 'overdue';
              task.isOverdue = true;
            } else {
              task.status = 'upcoming';
              task.isOverdue = false;
            }
          } else {
            task.status = 'locked';
          }
        }
      }
    }
  }

  public async updateTask(roadmapId: string, taskId: string, isCompleted: boolean): Promise<{ roadmap: Roadmap; updatedTask: Task } | null> {
    const roadmap = this.roadmaps.get(roadmapId);
    if (!roadmap) return null;

    let foundTask: Task | null = null;
    let totalTasks = 0;
    let completedTasks = 0;

    for (const phase of roadmap.phases) {
      for (const task of phase.tasks) {
        totalTasks++;
        if (task.id === taskId) {
          task.isCompleted = isCompleted;
          task.completedAt = isCompleted ? new Date().toISOString() : undefined;
          if (isCompleted) {
            task.status = 'completed';
            task.isOverdue = false;
          }
          foundTask = task;
        }
        if (task.isCompleted) completedTasks++;
      }
    }

    if (!foundTask) return null;

    // Recalculate dynamic statuses across the dependency chain
    this.updateTaskStatuses(roadmap);

    // Recalculate progress percentage and XP
    roadmap.progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    if (isCompleted) {
      roadmap.totalXp = (roadmap.totalXp || 0) + 50;
      roadmap.streakDays = Math.max(1, (roadmap.streakDays || 0) + 1);
    }
    roadmap.updatedAt = new Date().toISOString();

    return { roadmap, updatedTask: foundTask };
  }

  public async updateTaskExecutionStatus(
    roadmapId: string,
    taskId: string,
    status: TaskStatus
  ): Promise<{ roadmap: Roadmap; updatedTask: Task } | null> {
    const roadmap = this.roadmaps.get(roadmapId);
    if (!roadmap) return null;

    let foundTask: Task | null = null;
    for (const phase of roadmap.phases) {
      for (const task of phase.tasks) {
        if (task.id === taskId) {
          task.status = status;
          if (status === 'in_progress') {
            task.startedAt = task.startedAt || new Date().toISOString();
          } else if (status === 'completed') {
            task.isCompleted = true;
            task.completedAt = new Date().toISOString();
          }
          foundTask = task;
          break;
        }
      }
    }

    if (!foundTask) return null;
    this.updateTaskStatuses(roadmap);
    roadmap.updatedAt = new Date().toISOString();
    return { roadmap, updatedTask: foundTask };
  }

  public async rescheduleTask(
    roadmapId: string,
    taskId: string,
    newDayNumber: number
  ): Promise<{ roadmap: Roadmap; updatedTask: Task } | null> {
    const roadmap = this.roadmaps.get(roadmapId);
    if (!roadmap) return null;

    let foundTask: Task | null = null;
    for (const phase of roadmap.phases) {
      for (const task of phase.tasks) {
        if (task.id === taskId) {
          task.dayNumber = Math.max(1, newDayNumber);
          task.isOverdue = false;
          task.rescheduledCount = (task.rescheduledCount || 0) + 1;
          foundTask = task;
          break;
        }
      }
    }

    if (!foundTask) return null;
    this.updateTaskStatuses(roadmap);
    roadmap.updatedAt = new Date().toISOString();
    return { roadmap, updatedTask: foundTask };
  }

  public async recordStudySession(
    userId: string,
    roadmapId: string,
    taskId: string,
    durationMinutes: number,
    xpEarned: number = 25
  ): Promise<StudySession> {
    const roadmap = this.roadmaps.get(roadmapId);
    let taskTitle = 'Guided Study Session';
    if (roadmap) {
      const task = roadmap.phases.flatMap((p) => p.tasks).find((t) => t.id === taskId);
      if (task) taskTitle = task.title;
      roadmap.totalXp = (roadmap.totalXp || 0) + xpEarned;
      roadmap.updatedAt = new Date().toISOString();
    }

    const session: StudySession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId,
      roadmapId,
      taskId,
      taskTitle,
      durationMinutes: Math.max(1, durationMinutes),
      startedAt: new Date(Date.now() - durationMinutes * 60000).toISOString(),
      completedAt: new Date().toISOString(),
      xpEarned,
    };

    const existing = this.studySessions.get(roadmapId) || [];
    existing.push(session);
    this.studySessions.set(roadmapId, existing);

    return session;
  }

  public async getStudySessions(roadmapId: string): Promise<StudySession[]> {
    return this.studySessions.get(roadmapId) || [];
  }

  public async getDashboardData(userId: string, roadmapId: string, studentName?: string): Promise<DashboardData | null> {
    const roadmap = await this.getRoadmapById(roadmapId, userId);
    if (!roadmap) return null;

    const allTasks = roadmap.phases.flatMap((p) => p.tasks);
    const completedTasks = allTasks.filter((t) => t.isCompleted);
    const completedTasksCount = completedTasks.length;
    const totalTasksCount = allTasks.length;
    const overallProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    // Determine the exact next actionable task
    const continueLearningTask =
      allTasks.find((t) => t.status === 'in_progress') ||
      allTasks.find((t) => t.status === 'current') ||
      allTasks.find((t) => !t.isCompleted) ||
      null;

    const activeDayNumber = continueLearningTask ? continueLearningTask.dayNumber : 1;

    // Today's learning plan
    const todayTasks = allTasks.filter((t) => t.dayNumber === activeDayNumber);
    const totalEstimatedMinutes = todayTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
    const completedMinutes = todayTasks.filter((t) => t.isCompleted).reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
    const isDayCompleted = todayTasks.length > 0 && todayTasks.every((t) => t.isCompleted);

    // Overdue tasks: uncompleted tasks scheduled before activeDayNumber or flagged isOverdue
    const overdueTasks = allTasks.filter((t) => !t.isCompleted && (t.dayNumber < activeDayNumber || t.isOverdue === true));

    // Upcoming tasks: scheduled after activeDayNumber
    const upcomingTasks = allTasks.filter((t) => !t.isCompleted && t.dayNumber > activeDayNumber);

    // Recently completed topics
    const recentlyCompletedTasks = allTasks
      .filter((t) => t.isCompleted)
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
      .slice(0, 5);

    // Next milestone
    const nextMilestoneTask = allTasks.find((t) => !t.isCompleted && (t.isMilestone || t.isFinalProject));
    let nextMilestone = null;
    if (nextMilestoneTask) {
      const tasksRemaining = allTasks.filter((t) => !t.isCompleted && t.orderIndex <= nextMilestoneTask.orderIndex).length;
      nextMilestone = {
        title: nextMilestoneTask.title,
        dayNumber: nextMilestoneTask.dayNumber,
        phaseTitle: nextMilestoneTask.phaseTitle,
        tasksRemaining,
      };
    }

    // Weekly activity computation (7 days)
    const sessions = this.studySessions.get(roadmapId) || [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity: WeeklyDayActivity[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = daysOfWeek[d.getDay()];
      const isToday = i === 0;

      const sessionMins = sessions
        .filter((s) => s.startedAt.startsWith(dateStr))
        .reduce((acc, s) => acc + s.durationMinutes, 0);

      const taskMins = allTasks
        .filter((t) => t.isCompleted && t.completedAt && t.completedAt.startsWith(dateStr))
        .reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);

      const totalDayMinutes = Math.max(sessionMins, taskMins) || (sessionMins > 0 ? sessionMins : taskMins);

      weeklyActivity.push({
        day: dayName,
        date: dateStr,
        minutes: totalDayMinutes,
        isToday,
      });
    }

    // Total hours studied
    const totalSessionMins = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalTaskMins = completedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
    const totalHoursStudied = Number(((Math.max(totalSessionMins, totalTaskMins) + Math.min(totalSessionMins, totalTaskMins) * 0.5) / 60).toFixed(1)) || 0;

    // Greeting
    const hour = now.getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const name = studentName || 'Student';
    const greeting = `${timeGreeting}, ${name}! ${hour < 12 ? '☀️' : hour < 17 ? '🚀' : '✨'}`;

    return {
      greeting,
      studentName: name,
      activeGoal: roadmap.targetGoal,
      skillCategory: roadmap.skillCategory,
      experienceLevel: roadmap.experienceLevel,
      overallProgress,
      completedTasksCount,
      totalTasksCount,
      totalHoursStudied,
      currentStreak: roadmap.streakDays || 1,
      totalXp: roadmap.totalXp || 100,
      level: calculateLevel(roadmap.totalXp || 100),
      continueLearningTask,
      todayPlan: {
        dayNumber: activeDayNumber,
        tasks: todayTasks,
        totalEstimatedMinutes,
        completedMinutes,
        isDayCompleted,
      },
      weeklyActivity,
      overdueTasks,
      upcomingTasks,
      recentlyCompletedTasks,
      nextMilestone,
    };
  }

  public async recoverPace(input: PaceRecoveryInput): Promise<Roadmap | null> {
    const roadmap = this.roadmaps.get(input.roadmapId);
    if (!roadmap) return null;

    let currentDay = 1;
    for (const phase of roadmap.phases) {
      for (const task of phase.tasks) {
        if (!task.isCompleted) {
          if (input.strategy === 'core_essentials' && !task.isEssential) {
            task.estimatedMinutes = Math.round(task.estimatedMinutes * 0.5);
          } else if (input.strategy === 'sprint') {
            task.dayNumber = currentDay;
            if (task.orderIndex % 2 === 0) currentDay++;
          } else {
            task.dayNumber = currentDay++;
          }
          task.isOverdue = false;
        }
      }
    }

    this.updateTaskStatuses(roadmap);
    roadmap.updatedAt = new Date().toISOString();
    return roadmap;
  }

  public async updateGapScore(roadmapId: string, gapId: string, score: number): Promise<SkillGap | null> {
    const roadmap = this.roadmaps.get(roadmapId);
    if (!roadmap) return null;

    const gap = roadmap.skillGaps.find((g) => g.id === gapId);
    if (!gap) return null;

    gap.proficiencyScore = Math.min(100, Math.max(0, score));
    gap.status = score >= 75 ? 'mastered' : score >= 50 ? 'needs_review' : 'critical_blocker';
    gap.lastEvaluatedAt = new Date().toISOString();
    roadmap.updatedAt = new Date().toISOString();

    return gap;
  }
}

export const storage = new LocalDataStore();
