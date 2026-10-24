import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import type { Roadmap, Task, SkillGap, PaceRecoveryInput } from '../types/index.js';

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

  constructor() {
    this.seedDefaultRoadmap();
  }

  private seedDefaultRoadmap() {
    const defaultRoadmapId = 'roadmap-demo-fullstack';
    const sampleRoadmap: Roadmap = {
      id: defaultRoadmapId,
      userId: 'user-demo-1',
      title: 'Full-Stack Web Mastery (React, Node.js & TypeScript)',
      skillCategory: 'Full-Stack Development',
      targetGoal: 'Junior to Mid Full-Stack Software Engineer',
      experienceLevel: 'intermediate',
      hoursPerDay: 1.5,
      targetWeeks: 6,
      paceMode: 'balanced',
      progressPercentage: 25,
      streakDays: 4,
      totalXp: 350,
      isActive: true,
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      phases: [
        {
          id: 'phase-1',
          title: 'Phase 1: Modern TypeScript & Component Architecture',
          description: 'Establish rock-solid static typing, predictable state transitions, and component contracts.',
          estimatedWeeks: 2,
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
              resources: [
                { title: 'TypeScript Handbook: Generics', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html', type: 'doc' },
                { title: 'Interactive Generics Sandbox', url: 'https://www.typescriptlang.org/play', type: 'practice' }
              ],
              isCompleted: true,
              completedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
              orderIndex: 1,
              isEssential: true,
              isOverdue: false
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
              resources: [
                { title: 'React Hooks Documentation', url: 'https://react.dev/reference/react', type: 'doc' }
              ],
              isCompleted: true,
              completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
              orderIndex: 2,
              isEssential: true,
              isOverdue: false
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
              resources: [
                { title: 'Compound Component Patterns in React', url: 'https://react.dev', type: 'doc' }
              ],
              isCompleted: false,
              orderIndex: 3,
              isEssential: true,
              isOverdue: false
            },
            {
              id: 'task-1-4',
              roadmapId: defaultRoadmapId,
              phaseId: 'phase-1',
              phaseTitle: 'Phase 1: Modern TypeScript & Component Architecture',
              dayNumber: 4,
              title: 'Elective Deep Dive: Micro-animations with CSS & Transitions',
              estimatedMinutes: 25,
              conceptSummary: 'Elevate visual polish using cubic-bezier curves, hardware-accelerated transforms, and keyframes.',
              practicalExercise: 'Add subtle entrance and hover animations to card items.',
              keyTakeaways: ['Use transforms instead of width/height transitions for 60fps performance'],
              resources: [
                { title: 'MDN CSS Transitions', url: 'https://developer.mozilla.org', type: 'doc' }
              ],
              isCompleted: false,
              orderIndex: 4,
              isEssential: false,
              isOverdue: false
            }
          ]
        },
        {
          id: 'phase-2',
          title: 'Phase 2: Express, REST API Design & PostgreSQL Schema',
          description: 'Construct resilient backend architectures with Zod schema validation and relational models.',
          estimatedWeeks: 2,
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
              resources: [
                { title: 'Zod Official Docs', url: 'https://zod.dev', type: 'doc' }
              ],
              isCompleted: false,
              orderIndex: 5,
              isEssential: true,
              isOverdue: false
            },
            {
              id: 'task-2-2',
              roadmapId: defaultRoadmapId,
              phaseId: 'phase-2',
              phaseTitle: 'Phase 2: Express, REST API Design & PostgreSQL Schema',
              dayNumber: 6,
              title: 'Relational Database Modeling & Indexing in PostgreSQL',
              estimatedMinutes: 40,
              conceptSummary: 'Design normalized tables with foreign key cascades, unique constraints, and B-tree indexing strategies.',
              practicalExercise: 'Write an SQL migration adding composite indexes to accelerate queries on active user roadmaps.',
              keyTakeaways: ['Use B-tree indexes on foreign keys and frequently filtered columns', 'Model relations with explicit deletion cascades'],
              resources: [
                { title: 'PostgreSQL Indexing Tutorial', url: 'https://www.postgresql.org/docs/', type: 'doc' }
              ],
              isCompleted: false,
              orderIndex: 6,
              isEssential: true,
              isOverdue: false
            }
          ]
        }
      ],
      skillGaps: [
        {
          id: 'gap-demo-1',
          roadmapId: defaultRoadmapId,
          topicName: 'TypeScript Generics & Utility Types',
          proficiencyScore: 82,
          status: 'mastered',
          recommendedAction: 'Well done! Ready for advanced conditional types.',
          lastEvaluatedAt: new Date().toISOString()
        },
        {
          id: 'gap-demo-2',
          roadmapId: defaultRoadmapId,
          topicName: 'PostgreSQL Indexing & Query Plans',
          proficiencyScore: 42,
          status: 'needs_review',
          recommendedAction: 'Review EXPLAIN ANALYZE concepts and index selectivity before building high-scale queries.',
          lastEvaluatedAt: new Date().toISOString()
        },
        {
          id: 'gap-demo-3',
          roadmapId: defaultRoadmapId,
          topicName: 'Compound Component Architecture',
          proficiencyScore: 35,
          status: 'critical_blocker',
          recommendedAction: 'Complete Day 3 practical exercise to unblock advanced UI state patterns.',
          lastEvaluatedAt: new Date().toISOString()
        }
      ]
    };

    this.roadmaps.set(defaultRoadmapId, sampleRoadmap);
  }

  public async getAllRoadmaps(): Promise<Roadmap[]> {
    return Array.from(this.roadmaps.values());
  }

  public async getRoadmapById(id: string): Promise<Roadmap | null> {
    return this.roadmaps.get(id) || null;
  }

  public async saveRoadmap(roadmap: Roadmap): Promise<Roadmap> {
    this.roadmaps.set(roadmap.id, roadmap);
    return roadmap;
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
          foundTask = task;
        }
        if (task.isCompleted) completedTasks++;
      }
    }

    if (!foundTask) return null;

    // Recalculate progress percentage and XP
    roadmap.progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    if (isCompleted) {
      roadmap.totalXp = (roadmap.totalXp || 0) + 50;
      roadmap.streakDays = Math.max(1, (roadmap.streakDays || 0) + 1);
    }
    roadmap.updatedAt = new Date().toISOString();

    return { roadmap, updatedTask: foundTask };
  }

  public async recoverPace(input: PaceRecoveryInput): Promise<Roadmap | null> {
    const roadmap = this.roadmaps.get(input.roadmapId);
    if (!roadmap) return null;

    let currentDay = 1;
    for (const phase of roadmap.phases) {
      for (const task of phase.tasks) {
        if (!task.isCompleted) {
          if (input.strategy === 'core_essentials' && !task.isEssential) {
            // Defer or reduce non-essentials
            task.estimatedMinutes = Math.round(task.estimatedMinutes * 0.5);
          } else if (input.strategy === 'sprint') {
            // Compressed timeline
            task.dayNumber = currentDay;
            if (task.orderIndex % 2 === 0) currentDay++;
          } else {
            // Even redistribution
            task.dayNumber = currentDay++;
          }
          task.isOverdue = false;
        }
      }
    }

    roadmap.updatedAt = new Date().toISOString();
    return roadmap;
  }

  public async updateGapScore(roadmapId: string, gapId: string, score: number): Promise<SkillGap | null> {
    const roadmap = this.roadmaps.get(roadmapId);
    if (!roadmap) return null;

    const gap = roadmap.skillGaps.find(g => g.id === gapId);
    if (!gap) return null;

    gap.proficiencyScore = Math.min(100, Math.max(0, score));
    gap.status = score >= 75 ? 'mastered' : score >= 50 ? 'needs_review' : 'critical_blocker';
    gap.lastEvaluatedAt = new Date().toISOString();
    roadmap.updatedAt = new Date().toISOString();

    return gap;
  }
}

export const storage = new LocalDataStore();
