import { Request, Response } from 'express';
import { config } from '../config/env.js';

export function getHealthStatus(req: Request, res: Response) {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SkillPilot AI Backend Service',
    environment: config.nodeEnv,
    integrations: {
      ai: {
        provider: config.hasGeminiKey ? 'Google Gemini API' : 'Deterministic Curriculum Engine (Active Local Fallback)',
        configured: config.hasGeminiKey,
        recommendation: config.hasGeminiKey ? 'Connected' : 'Provide GEMINI_API_KEY in server/.env for live generative models'
      },
      persistence: {
        provider: config.hasSupabase ? 'Supabase PostgreSQL' : 'Resilient In-Memory Local Store (Active)',
        configured: config.hasSupabase,
        recommendation: config.hasSupabase ? 'Connected' : 'Provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env for cloud persistence'
      }
    }
  });
}
