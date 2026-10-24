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
  LearningStyle
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
        prerequisiteTaskIds: prevTaskId ? [prevTaskId] : []
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
            prerequisiteTaskIds: prevId ? [prevId] : []
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
