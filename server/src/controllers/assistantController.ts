import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../services/storageService.js';
import { generateAssistantResponse } from '../services/aiService.js';
import type { ChatMessage } from '../types/index.js';

// Simple in-memory sliding-window rate limiter per user (30 requests / min)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 30;

  const record = rateLimits.get(userId);
  if (!record || now > record.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

const createConversationSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  roadmapId: z.string().optional(),
});

const renameConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
});

const sendMessageSchema = z
  .object({
    message: z.string().min(1).max(4000).optional(),
    prompt: z.string().min(1).max(4000).optional(),
    conversationId: z.string().optional(),
    roadmapId: z.string().optional(),
    currentTopic: z.string().optional(),
    activeGoal: z.string().optional(),
  })
  .refine((data) => Boolean(data.message || data.prompt), {
    message: 'Message cannot be empty',
  });

export async function listConversationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'user-demo-alex';
    const conversations = await storage.listConversations(userId);
    res.json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
}

export async function getConversationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'user-demo-alex';
    const conversationId = String(req.params.id);

    const conversation = await storage.getConversation(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
    }

    res.json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
}

export async function createConversationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'user-demo-alex';
    const { title, roadmapId } = createConversationSchema.parse(req.body);

    const conversation = await storage.createConversation(userId, title, roadmapId);
    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
    next(err);
  }
}

export async function renameConversationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'user-demo-alex';
    const conversationId = String(req.params.id);
    const { title } = renameConversationSchema.parse(req.body);

    const updated = await storage.updateConversationTitle(conversationId, userId, title);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
    next(err);
  }
}

export async function deleteConversationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'user-demo-alex';
    const conversationId = String(req.params.id);

    const deleted = await storage.deleteConversation(conversationId, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
    }

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function sendMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'user-demo-alex';
    const rate = checkRateLimit(userId);
    if (!rate.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded (max 30 messages/min). Please pause for a moment.',
      });
    }

    const parsed = sendMessageSchema.parse(req.body);
    const message = (parsed.message || parsed.prompt)!.trim();
    const { conversationId, roadmapId, currentTopic } = parsed;
    let activeGoal: string | undefined = parsed.activeGoal;

    // 1. Ensure or create conversation
    let convId = conversationId;
    if (!convId) {
      const newConv = await storage.createConversation(userId, undefined, roadmapId);
      convId = newConv.id;
    } else {
      const existing = await storage.getConversation(convId, userId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
      }
    }

    // 2. Persist user message
    const userMessage = await storage.addMessage(convId, userId, 'user', message);
    if (!userMessage) {
      return res.status(500).json({ success: false, message: 'Failed to record user message' });
    }

    // 3. Fetch conversation history for multi-turn context
    const fullConv = await storage.getConversation(convId, userId);
    const history = (fullConv?.messages || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 4. Fetch roadmap context if available
    let skillCategory: string | undefined;
    let experienceLevel: string | undefined;
    if (roadmapId) {
      const r = await storage.getRoadmapById(roadmapId);
      if (r) {
        activeGoal = r.targetGoal || activeGoal;
        skillCategory = r.skillCategory;
        experienceLevel = r.experienceLevel;
      }
    }

    // 5. Generate AI Response
    const aiResult = await generateAssistantResponse({
      messages: history,
      activeGoal,
      currentTopic,
      skillCategory,
      experienceLevel,
    });

    // 6. Persist assistant message
    const assistantMessage = await storage.addMessage(
      convId,
      userId,
      'assistant',
      aiResult.reply,
      aiResult.provider,
      aiResult.isAiGenerated
    );

    res.json({
      success: true,
      data: {
        conversationId: convId,
        userMessage,
        assistantMessage,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
    next(err);
  }
}

export async function streamMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'user-demo-alex';
    const rate = checkRateLimit(userId);
    if (!rate.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded (max 30 messages/min). Please pause for a moment.',
      });
    }

    const parsed = sendMessageSchema.parse(req.body);
    const message = (parsed.message || parsed.prompt)!.trim();
    const { conversationId, roadmapId, currentTopic } = parsed;
    let activeGoal: string | undefined = parsed.activeGoal;

    // 1. Ensure or create conversation
    let convId = conversationId;
    if (!convId) {
      const newConv = await storage.createConversation(userId, undefined, roadmapId);
      convId = newConv.id;
    } else {
      const existing = await storage.getConversation(convId, userId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
      }
    }

    // 2. Persist user message
    const userMessage = await storage.addMessage(convId, userId, 'user', message);
    if (!userMessage) {
      return res.status(500).json({ success: false, message: 'Failed to record user message' });
    }

    // 3. Set SSE response headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial metadata event
    res.write(`data: ${JSON.stringify({ type: 'start', conversationId: convId, userMessage })}\n\n`);

    // Abort controller for client disconnect
    const abortController = new AbortController();
    req.on('close', () => {
      abortController.abort();
    });

    // 4. Fetch context and history
    const fullConv = await storage.getConversation(convId, userId);
    const history = (fullConv?.messages || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let skillCategory: string | undefined;
    let experienceLevel: string | undefined;
    if (roadmapId) {
      const r = await storage.getRoadmapById(roadmapId);
      if (r) {
        activeGoal = r.targetGoal || activeGoal;
        skillCategory = r.skillCategory;
        experienceLevel = r.experienceLevel;
      }
    }

    // 5. Generate and stream AI Response
    const aiResult = await generateAssistantResponse({
      messages: history,
      activeGoal,
      currentTopic,
      skillCategory,
      experienceLevel,
      signal: abortController.signal,
      onChunk: (chunk: string) => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`);
        }
      },
    });

    // 6. Persist assistant message
    const assistantMessage = await storage.addMessage(
      convId,
      userId,
      'assistant',
      aiResult.reply,
      aiResult.provider,
      aiResult.isAiGenerated
    );

    // Send final completion event
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMessage, provider: aiResult.provider })}\n\n`);
      res.end();
    }
  } catch (err: any) {
    if (!res.headersSent) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: err.errors });
      }
      next(err);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Stream generation failed' })}\n\n`);
      res.end();
    }
  }
}
