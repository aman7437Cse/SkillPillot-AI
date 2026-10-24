import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../services/storageService.js';
import { generateAiRoadmap, generateTopicQuiz } from '../services/aiService.js';
import type { Roadmap } from '../types/index.js';

const generateRoadmapSchema = z.object({
  skill: z.string().min(2, 'Skill name must be at least 2 characters'),
  targetGoal: z.string().min(3, 'Target goal must be at least 3 characters'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  hoursPerDay: z.number().min(0.5).max(12).default(1.5),
  targetWeeks: z.number().min(1).max(52).default(6),
  paceMode: z.enum(['relaxed', 'balanced', 'intensive']).default('balanced'),
  learningPreferences: z.array(z.string()).optional()
});

const toggleTaskSchema = z.object({
  isCompleted: z.boolean()
});

const paceRecoverySchema = z.object({
  strategy: z.enum(['redistribute', 'sprint', 'core_essentials'])
});

const submitQuizSchema = z.object({
  gapId: z.string(),
  score: z.number().min(0).max(100)
});

export async function getRoadmapsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const roadmaps = await storage.getAllRoadmaps();
    res.json({ success: true, count: roadmaps.length, data: roadmaps });
  } catch (err) {
    next(err);
  }
}

export async function getRoadmapByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const roadmap = await storage.getRoadmapById(id);
    if (!roadmap) {
      return res.status(404).json({ success: false, message: `Roadmap with ID '${id}' not found` });
    }
    res.json({ success: true, data: roadmap });
  } catch (err) {
    next(err);
  }
}

export async function generateRoadmapHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedInput = generateRoadmapSchema.parse(req.body);
    const roadmapId = `roadmap-${Date.now()}`;

    // Call AI / Deterministic generator
    const { phases, skillGaps } = await generateAiRoadmap(validatedInput, roadmapId);

    const newRoadmap: Roadmap = {
      id: roadmapId,
      userId: req.user?.id || (req.headers['x-user-id'] as string) || 'user-demo-1',
      title: `${validatedInput.skill} Mastery (${validatedInput.targetWeeks} Weeks)`,
      skillCategory: validatedInput.skill,
      targetGoal: validatedInput.targetGoal,
      experienceLevel: validatedInput.experienceLevel,
      hoursPerDay: validatedInput.hoursPerDay,
      targetWeeks: validatedInput.targetWeeks,
      paceMode: validatedInput.paceMode,
      progressPercentage: 0,
      streakDays: 1,
      totalXp: 100, // starter XP
      isActive: true,
      phases,
      skillGaps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await storage.saveRoadmap(newRoadmap);
    res.status(201).json({
      success: true,
      message: 'Roadmap generated successfully',
      data: saved
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
    next(err);
  }
}

export async function toggleTaskCompletionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const roadmapId = String(req.params.roadmapId);
    const taskId = String(req.params.taskId);
    const { isCompleted } = toggleTaskSchema.parse(req.body);

    const result = await storage.updateTask(roadmapId, taskId, isCompleted);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Roadmap or Task not found' });
    }

    res.json({
      success: true,
      message: isCompleted ? 'Task marked as completed! +50 XP' : 'Task marked as incomplete',
      data: {
        task: result.updatedTask,
        roadmap: result.roadmap
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
    next(err);
  }
}

export async function recoverPaceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { strategy } = paceRecoverySchema.parse(req.body);

    const updatedRoadmap = await storage.recoverPace({ roadmapId: id, strategy });
    if (!updatedRoadmap) {
      return res.status(404).json({ success: false, message: `Roadmap with ID '${id}' not found` });
    }

    res.json({
      success: true,
      message: `Schedule recalibrated successfully using the '${strategy}' strategy!`,
      data: updatedRoadmap
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
    next(err);
  }
}

export async function getTopicQuizHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { topic } = req.query;
    const skill = (req.query.skill as string) || 'Computer Science';
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ success: false, message: 'Query parameter `topic` is required' });
    }

    const quiz = await generateTopicQuiz(topic, skill);
    res.json({ success: true, topic, data: quiz });
  } catch (err) {
    next(err);
  }
}

export async function submitQuizScoreHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { gapId, score } = submitQuizSchema.parse(req.body);

    const updatedGap = await storage.updateGapScore(id, gapId, score);
    if (!updatedGap) {
      return res.status(404).json({ success: false, message: 'Roadmap or Skill Gap not found' });
    }

    res.json({
      success: true,
      message: score >= 75 ? 'Skill gap mastered! Excellent work.' : 'Score recorded. Keep practicing!',
      data: updatedGap
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
    next(err);
  }
}
