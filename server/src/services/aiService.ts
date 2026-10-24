import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import type {
  GenerateRoadmapInput,
  RoadmapPhase,
  Task,
  SkillGap,
  QuizQuestion,
  FinalProject,
  TaskStatus,
  LearningStyle,
  QuizQuestionItem,
  QuizQuestionType,
  QuizDifficulty,
  DoubtSolverPayload,
  DoubtSolverResponse
} from '../types/index.js';

let geminiClient: GoogleGenAI | null = null;
if (config.hasGeminiKey) {
  try {
    geminiClient = new GoogleGenAI({ apiKey: config.geminiApiKey });
  } catch (error) {
    console.warn('Failed to initialize Gemini AI client, falling back to deterministic generator:', error);
  }
}

/**
 * Specialized Curated Curriculums for Popular Student Learning Goals
 */
const CURRICULUM_CATALOG: Record<string, {
  phases: Array<{ title: string; desc: string; topics: Array<{ title: string; exercise: string; summary: string }> }>;
  finalProject: FinalProject;
}> = {
  'c++': {
    phases: [
      {
        title: 'Phase 1: Modern C++ Syntax, Memory Model & Pointers',
        desc: 'Master stack vs heap allocations, raw pointers, references, value categories, and memory layout.',
        topics: [
          {
            title: 'Primitive Types, Scopes, and Compilers (Clang/GCC)',
            summary: 'Understand compilation units, header inclusion guards, and basic type representations.',
            exercise: 'Configure a CMake build and verify memory sizes of fundamental types.'
          },
          {
            title: 'Pointers, References & Pointer Arithmetic',
            summary: 'Deconstruct memory addresses, dereferencing, and the hazards of dangling pointers.',
            exercise: 'Implement a dynamic array resizing routine using raw pointers and delete[].'
          },
          {
            title: 'Object-Oriented C++ & Virtual Function Tables',
            summary: 'Explore encapsulation, virtual destructors, and runtime polymorphism vtables.',
            exercise: 'Create a polymorphic shape hierarchy with runtime dispatch.'
          },
          {
            title: 'RAII & Smart Pointers (std::unique_ptr, std::shared_ptr)',
            summary: 'Prevent memory leaks using modern automatic resource management idiom.',
            exercise: 'Refactor a raw-pointer memory pool to use std::unique_ptr and custom deleters.'
          }
        ]
      },
      {
        title: 'Phase 2: Standard Template Library (STL) & Modern Algorithms',
        desc: 'Leverage zero-cost abstractions, containers, iterators, and lambdas for idiomatic C++.',
        topics: [
          {
            title: 'Sequential & Associative Containers (vector, unordered_map)',
            summary: 'Analyze Big-O performance, rehashing, and contiguous cache locality.',
            exercise: 'Implement a LRU cache container backed by std::list and std::unordered_map.'
          },
          {
            title: 'Iterators, Functors & Generic std::algorithms',
            summary: 'Decouple algorithms from data representations using iterator traits.',
            exercise: 'Write custom predicates with generic lambda expressions for complex sorting.'
          },
          {
            title: 'Template Metaprogramming & Type Traits Basics',
            summary: 'Explore compile-time code generation, SFINAE, and concepts in C++20.',
            exercise: 'Write a template function that only accepts arithmetic types via compile-time traits.'
          }
        ]
      },
      {
        title: 'Phase 3: Concurrency, Systems Programming & Capstone',
        desc: 'Build multi-threaded performance routines with atomic operations and condition variables.',
        topics: [
          {
            title: 'Multi-threading, Mutexes & Race Conditions',
            summary: 'Synchronize concurrent thread execution and avoid deadlocks.',
            exercise: 'Build a thread-safe producer-consumer queue using std::condition_variable.'
          },
          {
            title: 'C++ Move Semantics & Rvalue References (std::move)',
            summary: 'Eliminate expensive deep copies by transferring resource ownership.',
            exercise: 'Implement a Move-Constructible and Move-Assignable buffer class.'
          }
        ]
      }
    ],
    finalProject: {
      title: 'High-Performance In-Memory Key-Value Store with Thread Pool',
      description: 'Design and build a multithreaded Redis-like key-value storage engine supporting GET/SET commands, atomic expiration, and disk persistence.',
      deliverables: ['Custom Memory Pool Allocator', 'Lock-Free or Fine-Grained Thread Pool', 'Persistence WAL (Write-Ahead-Log)', 'Benchmarking Suite'],
      rubric: ['Zero memory leaks verified by Valgrind / AddressSanitizer', 'Thread safety under concurrent load', 'Clean modern C++20 RAII idioms']
    }
  },
  'dsa': {
    phases: [
      {
        title: 'Phase 1: Complexity Analysis, Linear Structures & Two-Pointers',
        desc: 'Build intuition for asymptotic efficiency, memory constraints, and pointer traversal mechanics.',
        topics: [
          {
            title: 'Asymptotic Analysis & Big-O Master Theorem',
            summary: 'Calculate time and space complexity with recursive call stack footprints.',
            exercise: 'Analyze complexity for 5 iterative and recursive algorithms and document recurrence relations.'
          },
          {
            title: 'Arrays, Strings & Two-Pointer / Sliding Window Techniques',
            summary: 'Optimize sub-array searches from O(N^2) down to linear O(N) time.',
            exercise: 'Solve 3 classic problems: Longest Substring Without Repeating Characters and Trapping Rain Water.'
          },
          {
            title: 'Linked Lists & Fast/Slow Pointer Floyd Cycle Detection',
            summary: 'Manipulate pointer chains without creating auxiliary arrays.',
            exercise: 'Implement singly and doubly linked lists with in-place reversal and loop detection.'
          },
          {
            title: 'Stacks, Queues & Monotonic Stack Patterns',
            summary: 'Maintain ordered elements to solve next greater element queries in single pass.',
            exercise: 'Implement a Daily Temperatures solver using a monotonic decreasing stack.'
          }
        ]
      },
      {
        title: 'Phase 2: Trees, Graphs, Search & Traversal Strategies',
        desc: 'Master hierarchical data representation, recursion, BFS, DFS, and topological sorting.',
        topics: [
          {
            title: 'Binary Search Trees & Tree Traversal (Inorder, Preorder, Postorder)',
            summary: 'Traverse and balance hierarchical trees with recursive and iterative stacks.',
            exercise: 'Build BST insertion, deletion, and lowest common ancestor (LCA) algorithms.'
          },
          {
            title: 'Graph Representations (Adjacency Matrix vs List) & BFS/DFS',
            summary: 'Explore graph connectivity, shortest paths in unweighted graphs, and cycles.',
            exercise: 'Solve Number of Islands and Clone Graph problems with clean recursive DFS.'
          },
          {
            title: 'Topological Sort & Disjoint Set Union (DSU / Kruskal)',
            summary: 'Resolve prerequisite dependencies and cycle detection in undirected graphs.',
            exercise: 'Implement Course Schedule dependency resolution with Kahn’s BFS algorithm.'
          }
        ]
      },
      {
        title: 'Phase 3: Dynamic Programming, Greedy & Advanced Algorithms',
        desc: 'Formulate state transitions, memoization tables, and optimal substructure equations.',
        topics: [
          {
            title: 'Dynamic Programming: 1D Memoization & Tabulation',
            summary: 'Break overlapping subproblems into subproblem state recurrence relations.',
            exercise: 'Solve House Robber and Coin Change using 1D space-optimized tabulation.'
          },
          {
            title: 'Dynamic Programming: 2D Grid & String Subsequences',
            summary: 'Formulate 2D state matrices for editing distances and matching.',
            exercise: 'Implement Longest Common Subsequence and Edit Distance with state transitions.'
          }
        ]
      }
    ],
    finalProject: {
      title: 'Algorithmic Route Navigation & Shortest Path Engine',
      description: 'Implement a production-grade pathfinding engine using Dijkstra, A* heuristic search, and topological routing for urban navigation.',
      deliverables: ['Custom Min-Heap Priority Queue', 'Graph Serialization Parser', 'A* Search with Euclidean Heuristics', 'Interactive Visualizer'],
      rubric: ['Accurate shortest path computation', 'Efficient priority queue time complexity', 'Clean modular design and test coverage']
    }
  },
  'web development': {
    phases: [
      {
        title: 'Phase 1: Modern JavaScript/TypeScript & Component Architecture',
        desc: 'Master semantic web primitives, static type checking, and reactive component lifecycles.',
        topics: [
          {
            title: 'TypeScript Type System & Component Contracts',
            summary: 'Eliminate runtime null bugs with discriminated unions, generics, and strict types.',
            exercise: 'Build a type-safe form validator with runtime schema inference.'
          },
          {
            title: 'React Hooks, State Management & Custom Hooks',
            summary: 'Decouple business logic from UI rendering with clean hooks.',
            exercise: 'Write a `useDebouncedSearch` hook with automatic cancellation.'
          },
          {
            title: 'Tailwind CSS & Accessible Component Primitives',
            summary: 'Construct responsive, keyboard-accessible design system components.',
            exercise: 'Build an accessible compound Modal dialog with focus trap.'
          }
        ]
      },
      {
        title: 'Phase 2: Resilient REST APIs, Express & PostgreSQL',
        desc: 'Design scalable server architectures with schema validation and relational models.',
        topics: [
          {
            title: 'RESTful API Architecture & Zod Schema Validation',
            summary: 'Safeguard endpoints against malicious or malformed request payloads.',
            exercise: 'Implement Express middleware providing structured validation errors.'
          },
          {
            title: 'PostgreSQL Relational Design & Indexing Strategies',
            summary: 'Model normalized relational data with foreign key cascades and composite indexes.',
            exercise: 'Write SQL migrations with B-Tree indexes and verify with EXPLAIN ANALYZE.'
          },
          {
            title: 'Authentication & Session Security (JWT & Cookies)',
            summary: 'Implement secure user authorization with HTTP-only tokens and CSRF protection.',
            exercise: 'Build authentication middleware with token refresh rotation.'
          }
        ]
      },
      {
        title: 'Phase 3: Full-Stack Integration, Testing & Deployment',
        desc: 'Connect frontend to backend with caching, error boundaries, and CI/CD pipelines.',
        topics: [
          {
            title: 'Optimistic UI Updates & Query Invalidation',
            summary: 'Deliver instant perceived latency using client-side cache updates.',
            exercise: 'Implement optimistic task toggling with automatic rollback on server error.'
          },
          {
            title: 'Production Dockerization & Cloud Deployment',
            summary: 'Containerize multi-stage builds and configure environment secrets securely.',
            exercise: 'Write a multi-stage Dockerfile and deploy to cloud hosting.'
          }
        ]
      }
    ],
    finalProject: {
      title: 'Production Full-Stack Collaborative Workspace Platform',
      description: 'Build a complete real-time productivity SaaS application featuring user authentication, project workspaces, drag-and-drop boards, and PostgreSQL persistence.',
      deliverables: ['Type-safe React Frontend', 'Express REST API', 'PostgreSQL Schema with RLS', 'End-to-End Test Suite'],
      rubric: ['Zero credential leakage', 'Fast sub-100ms API response latency', 'Mobile and tablet responsiveness']
    }
  }
};

/**
 * Match a requested skill to standard curriculum or create dynamic fallback
 */
function getCurriculumPlan(skill: string) {
  const normalized = skill.toLowerCase().trim();
  for (const [key, plan] of Object.entries(CURRICULUM_CATALOG)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return plan;
    }
  }

  // Generic dynamic fallback template
  return {
    phases: [
      {
        title: `Phase 1: Foundations & Core Architecture of ${skill}`,
        desc: `Master the essential syntax, mental models, environment setup, and primitive building blocks without cognitive overload.`,
        topics: [
          {
            title: `Core Syntax & Primitive Types in ${skill}`,
            summary: `Establish the foundational building blocks and basic program structure.`,
            exercise: `Write and execute a set of elementary scripts demonstrating primitive data handling.`
          },
          {
            title: `Functions, Control Flow & Scope Semantics`,
            summary: `Understand how execution flow is routed and how variables are scoped.`,
            exercise: `Build a modular calculation utility covering conditional branches and loops.`
          },
          {
            title: `Developer Tooling, Linting & Debugging Workflows`,
            summary: `Equip yourself with industry-standard debugging and inspection tools.`,
            exercise: `Configure a linter, inspect stack traces, and set up breakpoints.`
          }
        ]
      },
      {
        title: `Phase 2: Applied Patterns & Real-World Mechanics`,
        desc: `Level up from theoretical syntax into practical composition, error handling, and asynchronous data pipelines.`,
        topics: [
          {
            title: `Data Structures & Collection Handling in ${skill}`,
            summary: `Learn how collections are stored and manipulated efficiently.`,
            exercise: `Implement a search and filter pipeline over structured collections.`
          },
          {
            title: `Modular Architecture & Error Handling Boundaries`,
            summary: `Structure clean modules and isolate unexpected failures gracefully.`,
            exercise: `Refactor monolithic code into decoupled packages with custom exception handling.`
          },
          {
            title: `API Communication & External Integrations`,
            summary: `Connect your application to external services and manage asynchronous I/O.`,
            exercise: `Build a client that queries a public API and handles network retry logic.`
          }
        ]
      },
      {
        title: `Phase 3: Production Hardening, Testing & Capstone`,
        desc: `Refactor for performance, write automated assertions, harden security, and build enterprise-grade resilience.`,
        topics: [
          {
            title: `Automated Unit Testing & Continuous Integration`,
            summary: `Verify code contracts with automated test runners and assertions.`,
            exercise: `Write a suite of unit and integration tests with mock fixtures.`
          },
          {
            title: `Performance Profiling & Bottleneck Diagnosis`,
            summary: `Profile CPU and memory consumption to eliminate latency spikes.`,
            exercise: `Profile an algorithm, identify hot paths, and optimize execution by 50%.`
          }
        ]
      }
    ],
    finalProject: {
      title: `${skill} Production Capstone Application`,
      description: `Synthesize all concepts learned across the curriculum into a complete, portfolio-ready project demonstrating industry standards.`,
      deliverables: ['Core Domain Engine', 'Automated Test Suite', 'Technical Architecture Documentation', 'Production Deployment Guide'],
      rubric: ['Clean modular architecture', 'Comprehensive error boundaries', 'Proven functionality under edge cases']
    }
  };
}

/**
 * Deterministic Curated Curriculum Generator
 * Clearly labeled as Deterministic / Demo fallback without pretending to be LLM-generated
 */
function generateDeterministicRoadmap(input: GenerateRoadmapInput, roadmapId: string): {
  phases: RoadmapPhase[];
  skillGaps: SkillGap[];
  finalProject: FinalProject;
  isAiGenerated: boolean;
  generationProvider: string;
} {
  const plan = getCurriculumPlan(input.skill);
  const existingLower = (input.existingKnowledge || []).map((t) => t.toLowerCase().trim());
  const dailyMins = Math.round((input.hoursPerDay || 1.5) * 60);
  const taskMins = Math.min(45, Math.max(25, Math.round(dailyMins * 0.5)));

  let dayCount = 1;
  let orderCount = 1;
  let allCreatedTaskIds: string[] = [];

  const phases: RoadmapPhase[] = plan.phases.map((pCfg, pIdx) => {
    const phaseId = `phase-${pIdx + 1}`;

    // Filter out topics already known by the student if specified
    const filteredTopics = pCfg.topics.filter(
      (topic) => !existingLower.some((known) => topic.title.toLowerCase().includes(known))
    );

    // Ensure at least 2 topics remain
    const topicsToUse = filteredTopics.length >= 2 ? filteredTopics : pCfg.topics;

    const tasks: Task[] = topicsToUse.map((topic, tIdx) => {
      const taskId = `task-${pIdx + 1}-${tIdx + 1}`;
      const isFirstTask = pIdx === 0 && tIdx === 0;
      const isPhaseMilestone = tIdx === topicsToUse.length - 1;
      const isFinalPhaseTask = pIdx === plan.phases.length - 1 && isPhaseMilestone;

      // Status logic: first task is current, others locked or upcoming
      let status: TaskStatus = 'locked';
      if (isFirstTask) {
        status = 'current';
      }

      // Assign prerequisites (previous task in chain)
      const prevTaskId = allCreatedTaskIds.length > 0 ? allCreatedTaskIds[allCreatedTaskIds.length - 1] : undefined;
      allCreatedTaskIds.push(taskId);

      const task: Task = {
        id: taskId,
        roadmapId,
        phaseId,
        phaseTitle: pCfg.title,
        dayNumber: dayCount++,
        title: `${topic.title}`,
        estimatedMinutes: taskMins,
        conceptSummary: topic.summary,
        practicalExercise: topic.exercise,
        keyTakeaways: [
          `Solid conceptual understanding of ${topic.title}`,
          `Practical implementation mechanics in ${input.skill}`,
          `Ability to diagnose edge-case failures and write assertions`
        ],
        resources: [
          {
            title: `Official Documentation: ${topic.title}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(input.skill + ' ' + topic.title + ' documentation')}`,
            type: 'doc'
          },
          {
            title: `Interactive Code Sandbox for ${topic.title}`,
            url: `https://github.com/topics/${encodeURIComponent(input.skill.toLowerCase().replace(/[^a-z0-9]/g, '-'))}`,
            type: 'practice'
          }
        ],
        status,
        isCompleted: false,
        orderIndex: orderCount++,
        isEssential: true,
        isOverdue: false,
        isMilestone: isPhaseMilestone,
        isFinalProject: isFinalPhaseTask,
        prerequisiteTaskIds: prevTaskId ? [prevTaskId] : [],
        learningObjectives: [
          `Understand core concepts of ${topic.title} in ${input.skill}`,
          `Implement practical code solutions without unhandled exceptions`,
          `Analyze trade-offs and performance implications`
        ],
        completionCriteria: [
          `Review the bite-sized concept summary and key takeaways`,
          `Complete today's practical mission: ${topic.exercise.slice(0, 80)}...`,
          `Reflect on key learnings or record study notes`
        ],
        practiceQuestions: [
          {
            question: `In modern ${input.skill}, what is the main problem solved by ${topic.title}?`,
            answerHint: `Focus on clarity, maintainability, and resource safety in production.`
          }
        ],
        rescheduledCount: 0
      };

      return task;
    });

    return {
      id: phaseId,
      title: pCfg.title,
      description: pCfg.desc,
      estimatedWeeks: Math.max(1, Math.round((input.targetWeeks || 6) / plan.phases.length)),
      orderIndex: pIdx + 1,
      tasks
    };
  });

  const skillGaps: SkillGap[] = [
    {
      id: `gap-${roadmapId}-1`,
      roadmapId,
      topicName: `${input.skill} Core Mental Model`,
      proficiencyScore: input.experienceLevel === 'beginner' ? 35 : 60,
      status: input.experienceLevel === 'beginner' ? 'needs_review' : 'mastered',
      recommendedAction: `Complete Phase 1 practical exercises to establish rock-solid foundation.`,
      lastEvaluatedAt: new Date().toISOString()
    },
    {
      id: `gap-${roadmapId}-2`,
      roadmapId,
      topicName: `Applied Composition & Error Handling`,
      proficiencyScore: 45,
      status: 'needs_review',
      recommendedAction: `Focus on writing assertions and handling edge-case validation.`,
      lastEvaluatedAt: new Date().toISOString()
    },
    {
      id: `gap-${roadmapId}-3`,
      roadmapId,
      topicName: `Production Architecture & Testing`,
      proficiencyScore: 25,
      status: 'critical_blocker',
      recommendedAction: `Complete Phase 3 automated testing tasks before tackling the final capstone project.`,
      lastEvaluatedAt: new Date().toISOString()
    }
  ];

  return {
    phases,
    skillGaps,
    finalProject: plan.finalProject,
    isAiGenerated: false,
    generationProvider: 'Deterministic Curated Engine (Curriculum Catalog)'
  };
}

/**
 * AI Service to generate personalized roadmap using Google Gemini or Deterministic Engine
 */
export async function generateAiRoadmap(input: GenerateRoadmapInput, roadmapId: string): Promise<{
  phases: RoadmapPhase[];
  skillGaps: SkillGap[];
  finalProject: FinalProject;
  isAiGenerated: boolean;
  generationProvider: string;
}> {
  if (!geminiClient) {
    return generateDeterministicRoadmap(input, roadmapId);
  }

  try {
    const existingStr = input.existingKnowledge && input.existingKnowledge.length > 0
      ? `Student already knows: ${input.existingKnowledge.join(', ')}. DO NOT duplicate these topics; build on top of them.`
      : 'Student is starting fresh.';

    const learningStyle = input.learningStyle || 'hands_on';

    const prompt = `You are the lead curriculum architect of SkillPilot AI.
Create a personalized, anti-overwhelm learning roadmap for a student with the following profile:
- Target Skill: ${input.skill}
- Target Goal / Role: ${input.targetGoal}
- Current Level: ${input.experienceLevel}
- Dedicated Time: ${input.hoursPerDay} hours/day
- Target Timeline: ${input.targetWeeks} weeks
- Pace Mode: ${input.paceMode || 'balanced'}
- Preferred Learning Style: ${learningStyle}
- Prior Knowledge: ${existingStr}

ANTI-OVERWHELM PRINCIPLES:
1. Divide into 3 or 4 progressive phases.
2. Each task must take 25 to 45 minutes, with a concrete, actionable title, a concise concept summary (avoid jargon overload), practical hands-on exercises tailored to ${learningStyle}, 3 key takeaways, and 2 helpful documentation links.
3. Mark milestones at phase ends, and include a final capstone project in the last phase.
4. Avoid duplicate topics. Ensure realistic pacing without cognitive burnout.
5. Provide 3 initial skill gap diagnostic areas.

OUTPUT STRICTLY VALID JSON MATCHING THIS SCHEMA:
{
  "phases": [
    {
      "id": "phase-1",
      "title": "Phase 1: Title",
      "description": "Phase description",
      "estimatedWeeks": 2,
      "tasks": [
        {
          "id": "task-1-1",
          "title": "Actionable task title",
          "estimatedMinutes": 30,
          "conceptSummary": "Concise summary",
          "practicalExercise": "Hands-on challenge",
          "keyTakeaways": ["Point 1", "Point 2", "Point 3"],
          "resources": [
            { "title": "Doc name", "url": "https://example.com", "type": "doc" }
          ],
          "isEssential": true,
          "isMilestone": false
        }
      ]
    }
  ],
  "finalProject": {
    "title": "Capstone Title",
    "description": "Capstone project description",
    "deliverables": ["Deliverable 1", "Deliverable 2"],
    "rubric": ["Rubric item 1", "Rubric item 2"]
  },
  "skillGaps": [
    {
      "id": "gap-1",
      "topicName": "Topic name",
      "proficiencyScore": 45,
      "status": "needs_review",
      "recommendedAction": "Action advice"
    }
  ]
}`;

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(text);
    if (!parsed.phases || !Array.isArray(parsed.phases)) {
      throw new Error('Invalid JSON structure returned by Gemini');
    }

    let dayCount = 1;
    let orderCount = 1;
    let allTaskIds: string[] = [];

    const formattedPhases: RoadmapPhase[] = parsed.phases.map((phase: any, pIdx: number) => {
      const phaseId = phase.id || `phase-${pIdx + 1}`;
      return {
        id: phaseId,
        title: phase.title || `Phase ${pIdx + 1}`,
        description: phase.description || '',
        estimatedWeeks: Number(phase.estimatedWeeks) || 2,
        orderIndex: pIdx + 1,
        tasks: (phase.tasks || []).map((t: any, tIdx: number) => {
          const taskId = t.id || `task-${pIdx + 1}-${tIdx + 1}`;
          const isFirst = pIdx === 0 && tIdx === 0;
          const prevId = allTaskIds.length > 0 ? allTaskIds[allTaskIds.length - 1] : undefined;
          allTaskIds.push(taskId);

          return {
            id: taskId,
            roadmapId,
            phaseId,
            phaseTitle: phase.title || `Phase ${pIdx + 1}`,
            dayNumber: dayCount++,
            title: t.title || 'Mastery Task',
            estimatedMinutes: Number(t.estimatedMinutes) || 30,
            conceptSummary: t.conceptSummary || '',
            practicalExercise: t.practicalExercise || '',
            keyTakeaways: Array.isArray(t.keyTakeaways) ? t.keyTakeaways : ['Master core concepts'],
            resources: Array.isArray(t.resources) ? t.resources : [],
            status: isFirst ? ('current' as TaskStatus) : ('locked' as TaskStatus),
            isCompleted: false,
            orderIndex: orderCount++,
            isEssential: t.isEssential !== false,
            isOverdue: false,
            isMilestone: Boolean(t.isMilestone),
            isFinalProject: Boolean(t.isFinalProject),
            prerequisiteTaskIds: prevId ? [prevId] : [],
            learningObjectives: Array.isArray(t.learningObjectives) ? t.learningObjectives : [
              `Master the essential principles of ${t.title || 'today lesson'}`,
              `Apply concepts in code without regressions`,
              `Build muscle memory with hands-on practice`
            ],
            completionCriteria: Array.isArray(t.completionCriteria) ? t.completionCriteria : [
              `Review the concept summary and key takeaways`,
              `Complete the hands-on practical exercise`,
              `Demonstrate understanding of the key concepts`
            ],
            practiceQuestions: Array.isArray(t.practiceQuestions) ? t.practiceQuestions : [
              {
                question: `What is the primary practical value of ${t.title || 'this topic'}?`,
                answerHint: `Focus on architectural clarity, reliability, and maintainability.`
              }
            ],
            rescheduledCount: 0
          };
        })
      };
    });

    const formattedGaps: SkillGap[] = (parsed.skillGaps || []).map((g: any, gIdx: number) => ({
      id: g.id || `gap-${roadmapId}-${gIdx + 1}`,
      roadmapId,
      topicName: g.topicName || 'Core Concept',
      proficiencyScore: Number(g.proficiencyScore) || 50,
      status: g.status === 'critical_blocker' || g.status === 'mastered' ? g.status : 'needs_review',
      recommendedAction: g.recommendedAction || 'Complete recommended practice exercises.',
      lastEvaluatedAt: new Date().toISOString()
    }));

    const finalProject: FinalProject = parsed.finalProject || {
      title: `${input.skill} Capstone Portfolio Application`,
      description: `Synthesize all concepts learned across the curriculum into a complete, portfolio-ready project demonstrating industry standards.`,
      deliverables: ['Working codebase', 'Technical design document', 'Test suite'],
      rubric: ['Clean architecture', 'Robust error handling', 'Working features']
    };

    return {
      phases: formattedPhases,
      skillGaps: formattedGaps,
      finalProject,
      isAiGenerated: true,
      generationProvider: 'Google Gemini 2.5 Flash'
    };
  } catch (err) {
    console.warn('Gemini AI generation failed, falling back to deterministic curriculum generator:', err);
    return generateDeterministicRoadmap(input, roadmapId);
  }
}

/**
 * Diagnostic Quiz Generator for Revision & Gap Remediation
 */
export async function generateTopicQuiz(topic: string, skill: string): Promise<QuizQuestion[]> {
  const fallbackQuestions: QuizQuestion[] = [
    {
      id: `q-1`,
      topic,
      question: `In modern ${skill}, what is the primary architectural advantage of understanding ${topic}?`,
      options: [
        `It minimizes unpredictable runtime errors and clarifies data flow.`,
        `It eliminates the need for unit testing entirely.`,
        `It bypasses compilation steps for faster deployment.`,
        `It prevents code from using asynchronous threads.`
      ],
      correctOptionIndex: 0,
      explanation: `Understanding ${topic} establishes solid mental models, preventing regressions and making state transitions explicit.`
    },
    {
      id: `q-2`,
      topic,
      question: `When handling edge cases related to ${topic}, which practice represents best-in-class industry standard?`,
      options: [
        `Silently ignoring unexpected data inputs to avoid user notifications.`,
        `Explicitly validating invariants and handling failure states with fallback boundaries.`,
        `Overwriting global state variables on every mutation.`,
        `Relying purely on console.log messages in production.`
      ],
      correctOptionIndex: 1,
      explanation: `Explicit validation and boundary handling ensure that failures remain isolated and predictable.`
    },
    {
      id: `q-3`,
      topic,
      question: `How does mastering ${topic} contribute directly to code maintainability?`,
      options: [
        `It locks external library versions to prevent security patches.`,
        `It increases cyclomatic complexity so competitors cannot read it.`,
        `It promotes modular decoupling and easier refactoring as the codebase grows.`,
        `It forces all logic to reside inside a single monolithic file.`
      ],
      correctOptionIndex: 2,
      explanation: `Modularity and decoupled components allow systems to evolve predictably without cascading side-effects.`
    }
  ];

  if (!geminiClient) {
    return fallbackQuestions;
  }

  try {
    const prompt = `Generate a 3-question multiple choice diagnostic quiz for the topic "${topic}" in "${skill}".
Questions must test real practical understanding and common student misconceptions.
Return STRICT JSON:
[
  {
    "id": "q-1",
    "topic": "${topic}",
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "explanation": "Why Option A is correct and why other choices fail."
  }
]`;

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.2 }
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    if (Array.isArray(parsed) && parsed.length >= 2) {
      return parsed;
    }
    return fallbackQuestions;
  } catch (err) {
    return fallbackQuestions;
  }
}

/**
 * Adaptive Multi-Format Topic Quiz Generator
 * Generates multiple-choice, true/false, and short-answer questions with difficulty adaptation.
 */
export async function generateAdaptiveTopicQuiz(options: {
  topic: string;
  skillCategory?: string;
  difficulty?: QuizDifficulty;
  questionCount?: number;
  questionTypes?: QuizQuestionType[];
}): Promise<QuizQuestionItem[]> {
  const {
    topic,
    skillCategory = 'Software Engineering',
    difficulty = 'intermediate',
    questionCount = 5,
    questionTypes = ['multiple_choice', 'true_false', 'short_answer'],
  } = options;

  const count = Math.min(10, Math.max(2, questionCount));
  const types = questionTypes.length > 0 ? questionTypes : (['multiple_choice', 'true_false', 'short_answer'] as QuizQuestionType[]);

  // 1. High-fidelity dynamic fallback generator
  const generateFallbackQuiz = (): QuizQuestionItem[] => {
    const questions: QuizQuestionItem[] = [];

    // Helper templates
    const templates = [
      {
        type: 'multiple_choice' as QuizQuestionType,
        question: `In modern ${skillCategory}, what is the primary purpose and invariant of ${topic}?`,
        options: [
          `It enforces predictable data flow and isolates runtime failure domains.`,
          `It completely bypasses error checking for higher throughput.`,
          `It is purely a syntax decoration that compilers discard.`,
          `It forces all operations to execute on the main CPU thread synchronously.`,
        ],
        correctOptionIndex: 0,
        explanation: `${topic} is fundamentally designed to provide deterministic behavior, maintain system invariants, and prevent side-effects.`,
        hint: `Think about system predictability and how state transitions are managed under failure.`,
      },
      {
        type: 'true_false' as QuizQuestionType,
        question: `True or False: When working with ${topic}, mutating shared references concurrently without synchronization can lead to non-deterministic race conditions.`,
        options: ['True', 'False'],
        correctOptionIndex: 0,
        explanation: `True. Shared mutable state across concurrent execution contexts is the textbook definition of race conditions, leading to data corruption unless guarded.`,
        hint: `Consider what happens when two independent routines attempt to write to the same memory or state simultaneously.`,
      },
      {
        type: 'short_answer' as QuizQuestionType,
        question: `In computational analysis of ${topic}, what is the standard worst-case time complexity of an unoptimized linear scan (express in standard Big-O notation)?`,
        correctAnswer: 'O(n)',
        explanation: `A linear scan over n elements requires inspecting each item sequentially once, resulting in O(n) worst-case time complexity.`,
        hint: `Consider how the number of operations scales directly proportional to the input size n.`,
      },
      {
        type: 'multiple_choice' as QuizQuestionType,
        question: `Which architectural anti-pattern is most frequently encountered when improperly implementing ${topic}?`,
        options: [
          `Tight coupling where consumer components depend on internal implementation details.`,
          `Employing static typing and unit test coverage.`,
          `Writing self-documenting function names.`,
          `Splitting complex procedures into single-responsibility helpers.`,
        ],
        correctOptionIndex: 0,
        explanation: `Tight coupling breaks encapsulation, making refactoring brittle and cascading failures across unrelated modules.`,
        hint: `Look for the choice that violates modular design and clean architecture principles.`,
      },
      {
        type: 'true_false' as QuizQuestionType,
        question: `True or False: In ${difficulty} level architectures, ${topic} should always be implemented as a monolithic singleton to maximize global accessibility.`,
        options: ['True', 'False'],
        correctOptionIndex: 1,
        explanation: `False. Global singletons introduce hidden dependencies, hinder testability, and create synchronization bottlenecks. Dependency injection or modular scoping is favored.`,
        hint: `Remember that global state makes testing and decoupling significantly harder.`,
      },
      {
        type: 'short_answer' as QuizQuestionType,
        question: `What fundamental programming paradigm emphasizes declaring 'what' should be computed rather than 'how' (step-by-step mutations) when dealing with ${topic}?`,
        correctAnswer: 'Declarative',
        explanation: `Declarative programming abstracts away explicit control flow and state mutations in favor of expressing desired outcomes.`,
        hint: `The opposite of 'Imperative' programming.`,
      },
      {
        type: 'multiple_choice' as QuizQuestionType,
        question: `When optimizing ${topic} for production environments, what metric provides the most accurate measure of user-perceived performance?`,
        options: [
          `Latency percentiles (e.g. p95 and p99 response times) under peak load.`,
          `The total number of lines of code in the repository.`,
          `How quickly the dev server restarts locally.`,
          `The raw number of git branches created per sprint.`,
        ],
        correctOptionIndex: 0,
        explanation: `Tail latencies (p95, p99) represent real user experience at the extremes and expose architectural bottlenecks far better than averages.`,
        hint: `Focus on metrics that reflect the slowest 1% to 5% of actual user requests.`,
      },
    ];

    // Filter templates matching requested questionTypes if specified
    const matchingTemplates = templates.filter((t) => types.includes(t.type));
    const pool = matchingTemplates.length > 0 ? matchingTemplates : templates;

    for (let i = 0; i < count; i++) {
      const template = pool[i % pool.length];
      questions.push({
        id: `q-${difficulty}-${i + 1}-${Date.now().toString(36)}`,
        topic,
        question: template.question,
        type: template.type,
        options: template.options,
        correctOptionIndex: template.correctOptionIndex,
        correctAnswer: template.correctAnswer,
        explanation: template.explanation,
        hint: template.hint,
      });
    }

    return questions;
  };

  // If Gemini is not configured, return high-fidelity fallback immediately
  if (!geminiClient) {
    return generateFallbackQuiz();
  }

  // 2. Query Gemini 2.5 Flash for live tailored questions
  try {
    const prompt = `You are a Principal Software Engineering Instructor creating an adaptive diagnostic quiz.
Generate a ${count}-question quiz for the topic: "${topic}" (Skill Category: "${skillCategory}", Target Difficulty: "${difficulty}").
Allowed Question Types: ${types.join(', ')}.

Requirements:
1. Provide practical, challenging questions that test real comprehension, edge cases, and common student pitfalls.
2. Support question types:
   - "multiple_choice": exactly 4 distinct, plausible options. "correctOptionIndex" must be 0, 1, 2, or 3.
   - "true_false": options must be ["True", "False"]. "correctOptionIndex" must be 0 or 1.
   - "short_answer": no options array. "correctAnswer" must be a concise, definitive string (1-3 words, acronym, or exact notation like "O(n)").
3. Include an "explanation" detailing why the answer is correct and why other choices fail.
4. Include an incremental "hint" providing a helpful conceptual clue without spoiling the direct answer.

Return STRICT JSON ARRAY matching this schema:
[
  {
    "id": "q-1",
    "topic": "${topic}",
    "question": "Question text",
    "type": "multiple_choice",
    "options": ["A", "B", "C", "D"],
    "correctOptionIndex": 0,
    "explanation": "Why A is correct and why B, C, D fail.",
    "hint": "Conceptual hint without spoiling the answer."
  }
]`;

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    if (Array.isArray(parsed) && parsed.length >= 2) {
      // Validate and clean each question item
      const validated: QuizQuestionItem[] = parsed.slice(0, count).map((item, idx) => ({
        id: item.id || `q-${idx + 1}-${Date.now().toString(36)}`,
        topic: item.topic || topic,
        question: String(item.question || `Question about ${topic}`),
        type: (item.type === 'true_false' || item.type === 'short_answer' ? item.type : 'multiple_choice') as QuizQuestionType,
        options: Array.isArray(item.options) ? item.options.map(String) : undefined,
        correctOptionIndex: typeof item.correctOptionIndex === 'number' ? item.correctOptionIndex : undefined,
        correctAnswer: typeof item.correctAnswer === 'string' ? item.correctAnswer : undefined,
        explanation: String(item.explanation || 'Review the core documentation for this concept.'),
        hint: typeof item.hint === 'string' ? item.hint : undefined,
      }));
      return validated;
    }

    return generateFallbackQuiz();
  } catch (err) {
    console.warn('Gemini adaptive quiz generation failed, using educational fallback:', err);
    return generateFallbackQuiz();
  }
}

export interface AssistantChatOptions {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  activeGoal?: string;
  currentTopic?: string;
  skillCategory?: string;
  experienceLevel?: string;
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

export interface AssistantReplyResult {
  reply: string;
  provider: string;
  isAiGenerated: boolean;
}

function generateFallbackAssistantResponse(
  userQuery: string,
  options: { activeGoal?: string; currentTopic?: string; skillCategory?: string }
): string {
  const query = userQuery.toLowerCase();
  const topic = options.currentTopic || 'Full-Stack Development';
  const goal = options.activeGoal || 'Software Engineering';

  // Debugging / error analysis query
  if (query.includes('debug') || query.includes('error') || query.includes('fix') || query.includes('issue') || query.includes('not working') || query.includes('infinite')) {
    return `### 🐞 Root-Cause Debugging Analysis

I analyzed your issue regarding **${options.currentTopic || 'your code snippet'}**.

#### 1. Why this happens
The most frequent cause in this pattern is **state synchronization mismatch** or **stale closures**. In modern frontend/backend architectures, when state setters trigger re-renders that re-execute effect dependencies, an infinite loop or unexpected mutation occurs.

#### 2. The Solution & Corrected Code
\`\`\`typescript
// ✅ Corrected Implementation: Pure function with safe dependencies
import { useEffect, useRef } from 'react';

export function useSafeAsyncOperation<T>(fetcher: () => Promise<T>, dependencies: any[]) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let isCancelled = false;

    async function execute() {
      try {
        const result = await fetcher();
        if (!isCancelled && isMountedRef.current) {
          // Safe state update
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Handled operation error:', err);
        }
      }
    }

    execute();

    return () => {
      isCancelled = true;
      isMountedRef.current = false;
    };
  }, dependencies); // Explicit, memoized dependencies
}
\`\`\`

#### 3. Best Practice Checklist
- **Cleanup Handlers**: Always return an abort/cleanup function from asynchronous effects.
- **Reference Equality**: Memoize callback handlers passed into hooks using \`useCallback\`.
- **Defensive Error Handling**: Catch and report errors to avoid unhandled promise rejections.`;
  }

  // Practice / Interview questions query
  if (query.includes('practice') || query.includes('drill') || query.includes('question') || query.includes('quiz') || query.includes('problem') || query.includes('interview')) {
    return `### 🎯 Targeted Practice Drills for **${topic}**

Here are 3 progressive technical drill challenges tailored to your goal (*${goal}*):

---

#### Challenge 1: Core Mechanics (Beginner)
**Problem**: Write a function that safely accesses a deeply nested property in an object without throwing a \`TypeError\` if intermediate keys are undefined, using native modern syntax.
- **Input**: \`obj = { user: { profile: { name: "Alex" } } }\`, path: \`user.profile.name\`
- **Expected Output**: \`"Alex"\`
- **Hint**: *Consider optional chaining (\`?.\`) combined with the nullish coalescing operator (\`??\`).*

---

#### Challenge 2: Edge-Case Handling (Intermediate)
**Problem**: Given a stream of incoming asynchronous tasks, implement a throttle function that ensures a callback is executed at most once every \`intervalMs\` milliseconds, firing on both the leading and trailing edges.
- **Key Edge Case**: Multiple calls within the delay window must queue the latest arguments for execution once the window elapses.

---

#### Challenge 3: Real-World Architecture (Advanced)
**Problem**: Design a resilient client-side caching wrapper for API calls that:
1. Returns cached data immediately if less than 60 seconds old.
2. Background-revalidates stale data and notifies subscribers (Stale-While-Revalidate pattern).
3. Dedupes identical in-flight network requests.

*Would you like me to walk through the complete code implementation of Challenge 1, 2, or 3?*`;
  }

  // Concept Explanation query
  if (query.includes('explain') || query.includes('what is') || query.includes('how does') || query.includes('difference') || query.includes('why')) {
    return `### 💡 Deep Dive: Understanding **${userQuery.replace(/^(explain|what is|how does)\s+/i, '').trim() || topic}**

Let's break this down into intuitive mental models, followed by production-grade code.

#### 1. The Real-World Analogy
Think of this architecture like an **airport baggage handling system**. Instead of passengers individually walking down onto the tarmac to load their bags onto the plane (tight coupling), passengers drop their luggage at a standardized counter with a barcode tag (inversion of control). The internal conveyor systems handle routing and security checks without passengers needing to know baggage cart mechanics.

#### 2. Architecture & Code Example
\`\`\`typescript
// Decoupled, modular pattern tailored for ${goal}
export interface ConfigOptions {
  timeoutMs: number;
  retryCount: number;
  enableTelemetry?: boolean;
}

export class StandardServiceHub {
  private config: ConfigOptions;

  constructor(config: ConfigOptions) {
    this.config = Object.freeze({ ...config });
  }

  public async executeTask<T>(taskName: string, action: () => Promise<T>): Promise<T> {
    let attempts = 0;
    while (attempts <= this.config.retryCount) {
      try {
        return await action();
      } catch (error) {
        attempts++;
        if (attempts > this.config.retryCount) throw error;
        await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 100)); // Exponential backoff
      }
    }
    throw new Error(\`Failed to execute \${taskName}\`);
  }
}
\`\`\`

#### 3. Key Takeaways
- **Separation of Concerns**: High-level modules should not depend on low-level implementation details.
- **Resilience**: Incorporate exponential backoff and timeout thresholds at connection boundaries.
- **Predictability**: Immutable options objects prevent unexpected mutation side effects across async flows.

*Feel free to ask for a line-by-line breakdown or how this applies directly to your current lesson!*`;
  }

  // General educational query
  return `### 🚀 Learning Guidance on **${topic}**

Here is a focused, actionable breakdown to support your progress towards **${goal}**:

#### 1. Core Principles
When working in this domain, top engineers prioritize **readability, idempotency, and clean boundary encapsulation**.

\`\`\`typescript
// Production Best Practice Pattern
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

export function isLoaded<T>(state: AsyncState<T>): state is { status: 'success'; data: T } {
  return state.status === 'success';
}
\`\`\`

#### 2. Practical Application for Your Active Roadmap
1. **Model Explicit States**: Avoid separate boolean flags like \`isLoading\`, \`isError\`, \`data\` that can enter impossible states (\`isLoading=true\` AND \`isError=true\`). Use discriminated unions instead.
2. **Optimize Velocity**: Focus on bite-sized iterations rather than attempting massive rewrites in a single session.
3. **Validate at the Boundary**: Ensure all external data (API responses, user inputs) is validated with runtime schemas before entering your business logic.

*What specific aspect of this would you like to explore next? I can provide code examples, write a custom drill, or help you debug a file!*`;
}

export async function generateAssistantResponse(options: AssistantChatOptions): Promise<AssistantReplyResult> {
  const { messages, activeGoal, currentTopic, skillCategory, experienceLevel, onChunk, signal } = options;
  const latestUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  const systemPrompt = `You are "SkillPilot AI Tutor", a world-class AI academic mentor and software engineering coach.
Your mission is to help students master challenging concepts, understand code deeply, debug errors systematically, and practice effectively without feeling overwhelmed.

Tone & Style Guidelines:
- Beginner-friendly yet technically precise: Use clear analogies for difficult concepts before diving into technical details.
- Line-by-Line Code Explanations: When explaining code, break it down clearly with line references and highlight the "why", not just the "what".
- Debugging Specialist: When analyzing errors, identify the root cause immediately, show the corrected snippet, explain what went wrong, and recommend a preventative best practice.
- Educational Practice: When generating problems or questions, provide realistic test cases, progressive difficulty hints, and concise solution explanations.
- Markdown Formatting: Structure your answers with clean headers, bullet points, callout takeaways, and fenced code blocks with the exact language identifier (e.g. \`\`\`typescript, \`\`\`python, \`\`\`cpp, \`\`\`sql).
- Contextual Awareness:
  ${activeGoal ? `- Student Target Goal: ${activeGoal}` : ''}
  ${skillCategory ? `- Skill Domain: ${skillCategory}` : ''}
  ${currentTopic ? `- Current Focus Lesson: ${currentTopic}` : ''}
  ${experienceLevel ? `- Student Experience Level: ${experienceLevel}` : ''}
`;

  // 1. Try Live Gemini if configured
  if (geminiClient) {
    try {
      const contents = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      if (onChunk) {
        const responseStream = await geminiClient.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });

        let fullText = '';
        for await (const chunk of responseStream) {
          if (signal?.aborted) break;
          const chunkText = chunk.text;
          if (chunkText) {
            fullText += chunkText;
            onChunk(chunkText);
          }
        }

        if (fullText.trim()) {
          return {
            reply: fullText,
            provider: 'Google Gemini 2.5 Live',
            isAiGenerated: true,
          };
        }
      } else {
        const response = await geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });

        const text = response.text?.trim();
        if (text) {
          return {
            reply: text,
            provider: 'Google Gemini 2.5 Live',
            isAiGenerated: true,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini live call encountered an error, using intelligent educational fallback:', err);
    }
  }

  // 2. Intelligent Educational Fallback Tutor (Local Demo Engine)
  const fallbackReply = generateFallbackAssistantResponse(latestUserMsg, {
    activeGoal,
    currentTopic,
    skillCategory,
  });

  // If streaming is requested, emit chunks with small pauses
  if (onChunk) {
    const words = fallbackReply.split(/(\s+)/);
    let accumulated = '';
    for (let i = 0; i < words.length; i += 4) {
      if (signal?.aborted) break;
      const slice = words.slice(i, i + 4).join('');
      accumulated += slice;
      onChunk(slice);
      await new Promise((r) => setTimeout(r, 20));
    }
    return {
      reply: accumulated || fallbackReply,
      provider: 'Deterministic Educational Engine (Local Demo)',
      isAiGenerated: false,
    };
  }

  return {
    reply: fallbackReply,
    provider: 'Deterministic Educational Engine (Local Demo)',
    isAiGenerated: false,
  };
}

/**
 * AI Doubt Solver Service
 * Provides beginner-friendly explanations, progressive hints, code examples, and practice questions.
 */
export async function solveStudentDoubt(payload: DoubtSolverPayload): Promise<DoubtSolverResponse> {
  const {
    query,
    topic = 'Software Engineering',
    lessonTitle,
    lessonContext,
    actionType = 'general',
    hintLevel = 1,
  } = payload;

  const effectiveHintLevel = Math.max(1, Math.min(4, hintLevel));
  const totalHints = 3;
  const hasMoreHints = effectiveHintLevel < totalHints;

  // 1. Fallback deterministic generator
  const generateFallbackDoubtReply = (): DoubtSolverResponse => {
    let answer = '';
    const followUps = [
      `Can you show me a tricky edge case for ${topic}?`,
      `How does this perform under high scale or large inputs?`,
      `What is the most common anti-pattern students write here?`,
    ];

    if (actionType === 'explain_simply') {
      answer = `### 🐣 Plain-English Breakdown: **${topic}**

Imagine you are running a **busy restaurant kitchen**:
- When orders arrive, if every chef yelled across the room to write in the same notebook without rules, orders would get lost, overwritten, or delayed (**unmanaged state and race conditions**).
- Instead, the head chef sets up an **organized ticket rack** where each order has a unique ticket number, moves step-by-step from prep to cooking to plating, and only one station updates it at a time (**clean state transitions and isolation**).

That is exactly what **${topic}** does in your code!
1. **Clear Ownership**: Every piece of data has a single designated owner so nobody steps on each other's toes.
2. **Predictable Flow**: Changes happen through explicit actions rather than random silent mutations.
3. **Fail-Fast Safety**: If an ingredient or parameter is missing, the system catches it immediately rather than serving a broken dish to the user.

> **Key Rule of Thumb**: Keep functions small, names explicit, and avoid global variables.`;
    } else if (actionType === 'give_example') {
      answer = `### 💡 Practical Step-by-Step Example: **${topic}**

Here is a minimal, self-contained demonstration solving the core problem:

\`\`\`typescript
// Practical demonstration of ${topic}
interface OperationResult<T> {
  success: boolean;
  data?: T;
  errorMessage?: string;
}

// 1. Define invariant verification boundary
function executeCleanOperation<T>(inputData: T): OperationResult<T> {
  // Step 1: Guard clause to catch invalid edge cases early
  if (!inputData) {
    return {
      success: false,
      errorMessage: "Invalid payload: Input cannot be null or undefined",
    };
  }

  // Step 2: Perform deterministic transformation
  console.log("Processing payload safely with invariant checks...");
  return {
    success: true,
    data: inputData,
  };
}

// 2. Demonstration usage
const result = executeCleanOperation({ topic: "${topic}", verified: true });
console.log("Operation Status:", result.success ? "✓ OK" : "✗ Failed");
\`\`\`

#### Step-by-Step Execution Trace:
1. **Guard Check**: The function checks input invariants before performing any heavy work.
2. **Explicit Result Contract**: Notice how we return an explicit \`OperationResult\` object rather than throwing unhandled exceptions.
3. **Predictable Call Site**: The caller easily checks \`result.success\` without guessing.`;
    } else if (actionType === 'give_hint') {
      if (effectiveHintLevel === 1) {
        answer = `### 🔍 Guided Hint (Step 1 of 3): **Conceptual Direction**

> *"Don't rush to write code just yet—let's clarify the mental model first."*

1. Look closely at the **inputs and outputs** of the problem:
   - What invariant must be true before the operation starts?
   - What condition guarantees that the task has completed successfully?
2. **Clue**: Think about whether you need to **track previously seen items** in constant time, or if ordering matters.
3. Ask yourself: *"If you had to solve this manually on a whiteboard for just 3 items, what is the very first comparison you would make?"*

*Ready for a structural hint? Click **"Next Hint (2/3)"** when you're ready!*`;
      } else if (effectiveHintLevel === 2) {
        answer = `### ⚡ Guided Hint (Step 2 of 3): **Structural & Algorithmic Clue**

> *"Here is how to structure your algorithm without giving away the full code."*

1. **Data Structure Choice**: A standard Array will require **O(n)** lookup time for each item. Could an auxiliary **Set** or **Map** give you **O(1)** instant lookups?
2. **Loop Structure**:
   - Initialize your tracker or boundary pointer outside the loop.
   - Iterate through the elements one by one.
   - For each element, check your condition against the tracker.
3. **Edge Case**: What happens if the input is completely empty \`[]\`, or contains duplicates? Ensure your loop handles 0 or 1 element gracefully.

*Need the exact code pattern? Click **"Reveal Solution"** to see the complete implementation.*`;
      } else if (effectiveHintLevel === 3) {
        answer = `### 🛠️ Guided Hint (Step 3 of 3): **Code Blueprint & Edge-Case Guard**

> *"Almost there! Here is the skeleton of the solution to guide your hands on the keyboard."*

\`\`\`typescript
function solveProblem(input: any[]) {
  // 1. Guard against empty input
  if (!input || input.length === 0) return null;

  // 2. Initialize lookup tracker
  const seen = new Set();

  for (const item of input) {
    // 3. Invariant check: Did we meet our completion condition?
    if (seen.has(item.key)) {
      return item; // Found the match!
    }
    seen.add(item.key);
  }

  // 4. Fallback if no match was discovered
  return null;
}
\`\`\`

*Review how this blueprint maps to your current lesson task, then run your tests!*`;
      } else {
        answer = `### 🏆 Complete Solution & Walkthrough: **${topic}**

Here is the complete, production-grade solution with full error handling and complexity analysis:

\`\`\`typescript
/**
 * Complete reference implementation for ${topic}
 * Time Complexity: O(n) linear scan
 * Space Complexity: O(n) auxiliary memory
 */
export function solveTopicExercise<T extends { id: string | number }>(
  items: T[],
  predicate?: (item: T) => boolean
): { matched: T[]; count: number } {
  // Input validation
  if (!Array.isArray(items)) {
    throw new TypeError("Expected items to be an array");
  }

  const seenIds = new Set<string | number>();
  const matched: T[] = [];

  for (const item of items) {
    if (!item || seenIds.has(item.id)) {
      continue; // Skip invalid entries or duplicates
    }

    seenIds.add(item.id);

    if (!predicate || predicate(item)) {
      matched.push(item);
    }
  }

  return {
    matched,
    count: matched.length,
  };
}
\`\`\`

#### Why this works:
- **Zero Crashes**: Defensively validates input parameters.
- **Deduplication**: Uses a Set to ensure every item is processed at most once.
- **Fast**: Operates in single-pass linear time.`;
      }
    } else if (actionType === 'practice_question') {
      answer = `### 🎯 Targeted Practice Challenge: **${topic}**

Let's verify that you've got this concept down cold with a quick scenario:

**Problem Statement:**
> You have a service that receives stream payloads for **${topic}**. Some payloads arrive out of order, and some are duplicate retries from the client.
>
> 1. Which data structure should you use to reject duplicates in **O(1)** average time?
> 2. How should you handle a payload that arrives before its prerequisite has been acknowledged?

<details>
<summary>👀 Click to reveal answer and self-check</summary>

1. **Data Structure**: A **HashSet** (or Javascript \`Set\` / Hash Map) storing unique transaction IDs allows constant time O(1) duplicate checks.
2. **Out-of-Order Handling**: Buffer out-of-order payloads into a staging priority queue or state map until the prerequisite message is acknowledged, then replay them sequentially.
</details>`;
    } else {
      // General question
      answer = `### 💡 Concept Guide: **${topic}**

${lessonTitle ? `*Context: Current Lesson — **${lessonTitle}***\n\n` : ''}Regarding your question: *"**${query}**"*

Here is what you need to know:
1. **Core Mechanism**: **${topic}** establishes clean boundaries so that changes in one module do not cascade into unexpected bugs elsewhere.
2. **Best Practice**:
   - Always validate parameters at the boundary.
   - Use descriptive names rather than obscure abbreviations.
   - Prefer pure functions without hidden side effects.
3. **Common Pitfall**: Trying to optimize prematurely before the architecture and data structures are correct. Write clean, working code first, then measure before refactoring.

Use the quick action buttons below if you want an **example**, an **ELI5 explanation**, or a **progressive hint**!`;
    }

    return {
      answer,
      actionType,
      hintLevel: effectiveHintLevel,
      totalHints,
      hasMoreHints,
      followUpSuggestions: followUps,
      provider: 'Deterministic Educational Engine (Local Demo)',
      requiresVerification: true,
      verificationNote: 'AI-generated tutor guidance • Verify language-specific nuances or compiler flags with primary documentation.',
    };
  };

  if (!geminiClient) {
    return generateFallbackDoubtReply();
  }

  // 2. Query Gemini 2.5 Flash
  try {
    const prompt = `You are an empathetic, world-class Senior Engineering Tutor for SkillPilot AI.
Student Question: "${query}"
Context Topic: "${topic}"
${lessonTitle ? `Active Lesson: "${lessonTitle}"` : ''}
${lessonContext ? `Lesson Context Summary: "${lessonContext}"` : ''}
Requested Mode / Action: "${actionType}"
Hint Level: ${effectiveHintLevel} (out of 3)

Guidelines based on Action Mode:
- If actionType is "explain_simply": Explain in beginner-friendly, plain English using a memorable real-life analogy (no intimidating jargon).
- If actionType is "give_example": Provide clean, minimal, syntactically correct code with inline comments and execution trace.
- If actionType is "give_hint":
  * Level 1: Conceptual nudge only (no code, no spoiler).
  * Level 2: Structural/algorithmic pattern clue.
  * Level 3: Code blueprint and edge case warning.
  * Level 4: Full solution with detailed reasoning.
- If actionType is "practice_question": Generate a targeted self-check problem with a brief hidden answer key.
- If actionType is "general": Provide direct, friendly, step-by-step guidance.

Format your response in beautiful markdown with readable code blocks.
At the very end of your response, output a JSON block wrapped in \`\`\`json containing exactly:
{
  "followUpSuggestions": ["Question 1?", "Question 2?", "Question 3?"]
}
`;

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.35,
      },
    });

    const fullText = response.text || '';
    let cleanAnswer = fullText;
    let followUps = [
      `Can you show me a tricky edge case for ${topic}?`,
      `How does this perform under high scale?`,
      `What is the most common bug students write here?`,
    ];

    // Extract JSON block if present
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsedJson = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsedJson.followUpSuggestions)) {
          followUps = parsedJson.followUpSuggestions.slice(0, 3);
        }
        cleanAnswer = fullText.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
      } catch (e) {
        // ignore parse error
      }
    }

    return {
      answer: cleanAnswer || generateFallbackDoubtReply().answer,
      actionType,
      hintLevel: effectiveHintLevel,
      totalHints,
      hasMoreHints,
      followUpSuggestions: followUps,
      provider: 'Google Gemini 2.5 Live',
      requiresVerification: true,
      verificationNote: 'AI-generated tutor guidance • Verify language-specific nuances or compiler flags with primary documentation.',
    };
  } catch (err) {
    console.warn('Gemini doubt solving failed, falling back to local engine:', err);
    return generateFallbackDoubtReply();
  }
}


