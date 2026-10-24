import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

let supabaseClient: any = null;
if (config.hasSupabase) {
  const key = config.supabaseServiceRoleKey || config.supabaseAnonKey;
  supabaseClient = createClient(config.supabaseUrl, key);
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  fullName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticateRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const customUserId = req.headers['x-user-id'] as string;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      if (supabaseClient) {
        const { data, error } = await supabaseClient.auth.getUser(token);
        if (!error && data?.user) {
          req.user = {
            id: data.user.id,
            email: data.user.email,
          };
          return next();
        }
      }

      // If token is simulated or custom
      if (customUserId) {
        req.user = { id: customUserId };
        return next();
      }
    }

    // Fallback for development/local sessions
    req.user = {
      id: customUserId || 'user-demo-1',
      email: 'alex@skillpilot.ai',
    };

    next();
  } catch (err) {
    next(err);
  }
}
