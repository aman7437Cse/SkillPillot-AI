import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../services/storageService.js';
import { generateAdaptiveTopicQuiz } from '../services/aiService.js';
import type {
  QuizDifficulty,
  QuizQuestionType,
  QuizSession,
  QuizAttempt,
  QuizQuestionResult,
  SanitizedQuizQuestion,
} from '../types/index.js';

const generateQuizSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(150),
  roadmapId: z.string().optional(),
  skillCategory: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'adaptive']).optional(),
  questionCount: z.number().int().min(2).max(10).optional(),
  questionTypes: z.array(z.enum(['multiple_choice', 'true_false', 'short_answer'])).optional(),
});

const submitQuizSchema = z.object({
  answers: z.record(z.union([z.string(), z.number()])),
});

export async function generateQuizHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'user-demo-alex';
    const payload = generateQuizSchema.parse(req.body);

    const questions = await generateAdaptiveTopicQuiz({
      topic: payload.topic,
      skillCategory: payload.skillCategory,
      difficulty: payload.difficulty,
      questionCount: payload.questionCount,
      questionTypes: payload.questionTypes,
    });

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const session: QuizSession = {
      id: sessionId,
      userId,
      roadmapId: payload.roadmapId,
      topic: payload.topic,
      skillCategory: payload.skillCategory,
      difficulty: payload.difficulty || 'intermediate',
      questionCount: questions.length,
      questionTypes: payload.questionTypes || ['multiple_choice', 'true_false', 'short_answer'],
      questions,
      createdAt: new Date().toISOString(),
    };

    // Save full session with answers on backend
    await storage.saveQuizSession(session);

    // CRITICAL SECURITY: Sanitize quiz questions so client cannot inspect correct answers before submission
    const sanitizedQuestions: SanitizedQuizQuestion[] = questions.map((q) => ({
      id: q.id,
      topic: q.topic,
      question: q.question,
      type: q.type,
      options: q.options,
    }));

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        topic: session.topic,
        difficulty: session.difficulty,
        questionCount: sanitizedQuestions.length,
        questions: sanitizedQuestions,
        createdAt: session.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
    next(err);
  }
}

export async function submitQuizHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'user-demo-alex';
    const sessionId = String(req.params.id);
    const { answers } = submitQuizSchema.parse(req.body);

    const session = await storage.getQuizSession(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Quiz session expired or not found' });
    }

    // Enforce ownership
    const isAlexOrDemo = userId === 'user-demo-alex' || userId === 'user-demo-1';
    if (session.userId !== userId && !(isAlexOrDemo && session.userId === 'user-demo-alex')) {
      return res.status(404).json({ success: false, message: 'Access denied to this quiz session' });
    }

    let correctCount = 0;
    const totalQuestions = session.questions.length;
    const questionResults: QuizQuestionResult[] = [];

    for (const q of session.questions) {
      const rawUserAnswer = answers[q.id];
      let isCorrect = false;
      let formattedCorrectAnswer: string | number = '';
      let formattedUserAnswer: string | number = rawUserAnswer !== undefined ? rawUserAnswer : 'Not answered';

      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        const correctIdx = q.correctOptionIndex ?? 0;
        formattedCorrectAnswer = q.options ? q.options[correctIdx] || String(correctIdx) : String(correctIdx);
        if (typeof rawUserAnswer === 'number') {
          isCorrect = rawUserAnswer === correctIdx;
          if (q.options && q.options[rawUserAnswer]) {
            formattedUserAnswer = q.options[rawUserAnswer];
          }
        }
      } else if (q.type === 'short_answer') {
        const cleanExpected = (q.correctAnswer || '').trim().toLowerCase();
        formattedCorrectAnswer = q.correctAnswer || '';
        if (typeof rawUserAnswer === 'string') {
          const cleanUser = rawUserAnswer.trim().toLowerCase();
          // Flexible semantic matching for short answer
          isCorrect = cleanUser === cleanExpected || cleanUser.includes(cleanExpected) || cleanExpected.includes(cleanUser);
        }
      }

      if (isCorrect) {
        correctCount++;
      }

      questionResults.push({
        questionId: q.id,
        question: q.question,
        type: q.type,
        userAnswer: formattedUserAnswer,
        correctAnswer: formattedCorrectAnswer,
        isCorrect,
        explanation: q.explanation,
      });
    }

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const masteryStatus: 'mastered' | 'needs_review' | 'critical_blocker' =
      scorePercentage >= 80 ? 'mastered' : scorePercentage >= 50 ? 'needs_review' : 'critical_blocker';

    // Server-side legitimate attempt validation and XP rules
    const answeredCount = Object.keys(answers).length;
    let earnedXp = 0;
    if (answeredCount >= Math.ceil(totalQuestions / 2)) {
      if (scorePercentage >= 75) {
        earnedXp = 50;
      } else if (scorePercentage >= 50) {
        earnedXp = 25;
      } else {
        earnedXp = 10;
      }
    }

    // Award XP
    if (earnedXp > 0) {
      await storage.awardQuizXp(userId, session.roadmapId, earnedXp);
    }

    // Update Skill Gap status on active roadmap
    if (session.roadmapId) {
      await storage.updateSkillGapProficiency(session.roadmapId, session.topic, scorePercentage);
    }

    const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const attempt: QuizAttempt = {
      id: attemptId,
      sessionId,
      userId,
      roadmapId: session.roadmapId,
      topic: session.topic,
      difficulty: session.difficulty,
      scorePercentage,
      totalQuestions,
      correctCount,
      earnedXp,
      questionResults,
      masteryStatus,
      createdAt: new Date().toISOString(),
    };

    await storage.recordQuizAttempt(attempt);

    res.json({
      success: true,
      data: attempt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
    next(err);
  }
}

export async function getQuizHistoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'user-demo-alex';
    const topic = req.query.topic as string | undefined;

    const attempts = await storage.listQuizAttempts(userId, topic);
    res.json({ success: true, data: attempts });
  } catch (err) {
    next(err);
  }
}
