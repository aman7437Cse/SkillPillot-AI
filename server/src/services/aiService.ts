import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import type { GenerateRoadmapInput, RoadmapPhase, Task, SkillGap, QuizQuestion } from '../types/index.js';

let geminiClient: GoogleGenAI | null = null;
if (config.hasGeminiKey) {
  try {
    geminiClient = new GoogleGenAI({ apiKey: config.geminiApiKey });
  } catch (error) {
    console.warn('Failed to initialize Gemini AI client, falling back to deterministic generator:', error);
  }
}

/**
 * Deterministic Curriculum Generator for offline / fallback execution
 * Guarantees that SkillPilot AI works 100% reliably out of the box even without API keys!
 */
function generateCurriculumFallback(input: GenerateRoadmapInput, roadmapId: string): { phases: RoadmapPhase[]; skillGaps: SkillGap[] } {
  const skill = input.skill.trim();
  const weeks = Math.max(2, Math.min(16, input.targetWeeks || 6));
  const dailyMins = Math.round((input.hoursPerDay || 1.5) * 60);
  const taskMins = Math.min(45, Math.max(20, Math.round(dailyMins * 0.5)));

  // Generate 3 or 4 progressive phases based on target weeks
  const phase1Weeks = Math.max(1, Math.floor(weeks * 0.25));
  const phase2Weeks = Math.max(1, Math.floor(weeks * 0.35));
  const phase3Weeks = Math.max(1, Math.floor(weeks * 0.25));
  const phase4Weeks = Math.max(1, weeks - (phase1Weeks + phase2Weeks + phase3Weeks));

  const phaseConfigs = [
    {
      title: `Phase 1: Foundations & Core Architecture of ${skill}`,
      desc: `Master the essential syntax, mental models, environment setup, and primitive building blocks without cognitive overload.`,
      weeks: phase1Weeks,
      subtopics: [
        'Core Syntax & Primitive Types',
        'Mental Models & Control Flow',
        'Functions, Scope & Memory Semantics',
        'Developer Tooling & Debugging Workflows',
        'First Hands-On Micro Project'
      ]
    },
    {
      title: `Phase 2: Applied Patterns & Real-World Mechanics`,
      desc: `Level up from theoretical syntax into practical composition, error handling, asynchronous patterns, and data pipelines.`,
      weeks: phase2Weeks,
      subtopics: [
        'Data Structures & Collection Handling',
        'Asynchronous Workflows & Event Processing',
        'Modular Architecture & Code Organization',
        'API Communication & State Management',
        'End-to-End Feature Implementation'
      ]
    },
    {
      title: `Phase 3: Production Polish, Testing & Optimization`,
      desc: `Refactor for performance, write reliable test suites, harden security, and build enterprise-ready resilience.`,
      weeks: phase3Weeks,
      subtopics: [
        'Automated Unit & Integration Testing',
        'Performance Profiling & Bottleneck Diagnosis',
        'Edge-Case Hardening & Error Boundaries',
        'Caching, Network & Resource Optimization',
        'Production Deployment & CI/CD Pipelines'
      ]
    },
    {
      title: `Phase 4: Capstone Mastery & Portfolio Readiness`,
      desc: `Synthesize all concepts into a complete portfolio-ready project demonstrating industry-standard standards.`,
      weeks: phase4Weeks,
      subtopics: [
        'Capstone Architecture Planning & System Design',
        'Core Engine & Database Integration',
        'User Experience & Accessibility Polish',
        'Documentation & Technical Walkthrough Writing',
        'Final Code Review & Milestone Showcase'
      ]
    }
  ];

  let currentDay = 1;
  let taskOrder = 1;

  const phases: RoadmapPhase[] = phaseConfigs.map((cfg, pIdx) => {
    const phaseId = `phase-${pIdx + 1}`;
    const tasks: Task[] = cfg.subtopics.map((topic, tIdx) => {
      const taskId = `task-${pIdx + 1}-${tIdx + 1}`;
      const day = currentDay++;
      
      const task: Task = {
        id: taskId,
        roadmapId,
        phaseId,
        phaseTitle: cfg.title,
        dayNumber: day,
        title: `${topic}: ${skill} Practical Mastery`,
        estimatedMinutes: taskMins,
        conceptSummary: `Deep-dive into ${topic} within ${skill}. Focus on how it connects to real-world software architecture and production reliability. Keep concepts digestible: understand the "why", the "how", and common pitfalls to avoid.`,
        practicalExercise: `Implement a minimal working example of ${topic}. Write tests or assertions verifying correct behavior, and document three edge cases that could fail in production.`,
        keyTakeaways: [
          `Clear conceptual understanding of ${topic}`,
          `Practical implementation pattern for ${skill}`,
          `Ability to diagnose and debug common edge-case failures`
        ],
        resources: [
          {
            title: `Official ${skill} Guide on ${topic}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' ' + topic + ' documentation')}`,
            type: 'doc'
          },
          {
            title: `Interactive Code Sandbox for ${topic}`,
            url: `https://github.com/topics/${encodeURIComponent(skill.toLowerCase().replace(/[^a-z0-9]/g, '-'))}`,
            type: 'practice'
          }
        ],
        isCompleted: false,
        orderIndex: taskOrder++,
        isEssential: tIdx !== 3, // 4th item is an elective deep-dive
        isOverdue: false
      };
      return task;
    });

    return {
      id: phaseId,
      title: cfg.title,
      description: cfg.desc,
      estimatedWeeks: cfg.weeks,
      tasks
    };
  });

  const skillGaps: SkillGap[] = [
    {
      id: `gap-${roadmapId}-1`,
      roadmapId,
      topicName: `${skill} Core Mental Model`,
      proficiencyScore: input.experienceLevel === 'beginner' ? 40 : 65,
      status: input.experienceLevel === 'beginner' ? 'needs_review' : 'mastered',
      recommendedAction: `Complete Phase 1 micro-exercises to solidify foundation fundamentals before moving forward.`,
      lastEvaluatedAt: new Date().toISOString()
    },
    {
      id: `gap-${roadmapId}-2`,
      roadmapId,
      topicName: `Asynchronous Execution & Error Recovery`,
      proficiencyScore: 45,
      status: 'needs_review',
      recommendedAction: `Spend 20 minutes reviewing non-blocking patterns and error propagation.`,
      lastEvaluatedAt: new Date().toISOString()
    },
    {
      id: `gap-${roadmapId}-3`,
      roadmapId,
      topicName: `Production Architecture & Testing`,
      proficiencyScore: 30,
      status: 'critical_blocker',
      recommendedAction: `Focus on writing assertions in Phase 3 before starting the final capstone project.`,
      lastEvaluatedAt: new Date().toISOString()
    }
  ];

  return { phases, skillGaps };
}

/**
 * AI Service to generate personalized roadmap
 */
export async function generateAiRoadmap(input: GenerateRoadmapInput, roadmapId: string): Promise<{ phases: RoadmapPhase[]; skillGaps: SkillGap[] }> {
  if (!geminiClient) {
    return generateCurriculumFallback(input, roadmapId);
  }

  try {
    const prompt = `You are the lead learning architect of SkillPilot AI.
Create a personalized, bite-sized, anti-overwhelm learning curriculum for a student with the following profile:
- Target Skill: ${input.skill}
- Target Goal / Role: ${input.targetGoal}
- Current Level: ${input.experienceLevel}
- Dedicated Time: ${input.hoursPerDay} hours/day
- Target Timeline: ${input.targetWeeks} weeks
- Pace Mode: ${input.paceMode || 'balanced'}

ANTI-OVERWHELM PRINCIPLES:
1. Divide the journey into 3 or 4 progressive phases.
2. Each phase contains daily micro-tasks that take 25 to 45 minutes each.
3. Every task must have a concrete, actionable title (e.g. "Build a Type-Safe Fetcher"), a concise concept summary (no fluff), a practical hands-on exercise, 3 bullet key takeaways, and 2 helpful resource URLs.
4. Flag at least 1 non-essential elective task per phase with isEssential: false so it can be deferred if schedule falls behind.
5. Provide 3 initial skill gap diagnostic areas with proficiencyScore (0-100), status ("critical_blocker", "needs_review", or "mastered"), and recommendedAction.

OUTPUT STRICTLY VALID JSON matching this format with no markdown formatting:
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
          "estimatedMinutes": 35,
          "conceptSummary": "Clear concise summary",
          "practicalExercise": "Clear hands-on coding or exercise prompt",
          "keyTakeaways": ["point 1", "point 2", "point 3"],
          "resources": [
            { "title": "Doc name", "url": "https://example.com", "type": "doc" }
          ],
          "isEssential": true
        }
      ]
    }
  ],
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
        temperature: 0.2,
      }
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(text);
    if (!parsed.phases || !Array.isArray(parsed.phases)) {
      throw new Error('Invalid JSON structure returned by Gemini API');
    }

    // Enhance tasks with roadmapId, dayNumber, orderIndex, and defaults
    let dayCount = 1;
    let orderCount = 1;
    const formattedPhases: RoadmapPhase[] = parsed.phases.map((phase: any, pIdx: number) => {
      const phaseId = phase.id || `phase-${pIdx + 1}`;
      return {
        id: phaseId,
        title: phase.title || `Phase ${pIdx + 1}`,
        description: phase.description || '',
        estimatedWeeks: Number(phase.estimatedWeeks) || 2,
        tasks: (phase.tasks || []).map((t: any, tIdx: number) => ({
          id: t.id || `task-${pIdx + 1}-${tIdx + 1}`,
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
          isCompleted: false,
          orderIndex: orderCount++,
          isEssential: t.isEssential !== false,
          isOverdue: false
        }))
      };
    });

    const formattedGaps: SkillGap[] = (parsed.skillGaps || []).map((g: any, gIdx: number) => ({
      id: g.id || `gap-${roadmapId}-${gIdx + 1}`,
      roadmapId,
      topicName: g.topicName || 'General Proficiency',
      proficiencyScore: Number(g.proficiencyScore) || 50,
      status: g.status === 'critical_blocker' || g.status === 'mastered' ? g.status : 'needs_review',
      recommendedAction: g.recommendedAction || 'Continue completing recommended daily exercises.',
      lastEvaluatedAt: new Date().toISOString()
    }));

    return { phases: formattedPhases, skillGaps: formattedGaps };
  } catch (err) {
    console.warn('Gemini AI generation failed, falling back to deterministic curriculum generator:', err);
    return generateCurriculumFallback(input, roadmapId);
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
