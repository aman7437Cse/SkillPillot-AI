import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { solveStudentDoubt } from '../services/aiService.js';
import type { DoubtActionType } from '../types/index.js';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 40;

  const userRecord = rateLimitMap.get(userId);
  if (!userRecord || now > userRecord.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (userRecord.count >= maxRequests) {
    return false;
  }

  userRecord.count++;
  return true;
}

const solveDoubtSchema = z.object({
  query: z.string().min(1, 'Question query is required').max(2000, 'Query exceeds 2000 characters'),
  topic: z.string().max(150).optional(),
  roadmapId: z.string().optional(),
  lessonTitle: z.string().max(200).optional(),
  lessonContext: z.string().max(2000).optional(),
  actionType: z.enum(['explain_simply', 'give_example', 'give_hint', 'practice_question', 'general']).optional(),
  hintLevel: z.number().int().min(1).max(4).optional(),
});

export async function solveDoubtHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'user-demo-alex';

    if (!checkRateLimit(userId)) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded (40 questions/min). Please pause for a moment.',
      });
    }

    const payload = solveDoubtSchema.parse(req.body);

    const response = await solveStudentDoubt({
      query: payload.query,
      topic: payload.topic,
      roadmapId: payload.roadmapId,
      lessonTitle: payload.lessonTitle,
      lessonContext: payload.lessonContext,
      actionType: payload.actionType as DoubtActionType,
      hintLevel: payload.hintLevel,
    });

    res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
    next(err);
  }
}
