import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import { getHealthStatus } from './controllers/healthController.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// Base health check
app.get('/api/health', getHealthStatus);

// Core API routes
app.use('/api/roadmaps', roadmapRoutes);

// Fallback handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 SkillPilot AI backend listening on http://localhost:${config.port}`);
  console.log(`📡 AI Provider: ${config.hasGeminiKey ? 'Gemini 2.5 Flash' : 'Deterministic Fallback Generator'}`);
  console.log(`💾 Persistence: ${config.hasSupabase ? 'Supabase' : 'Resilient In-Memory Local Store'}`);
});
