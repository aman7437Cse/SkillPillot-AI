import { Router } from 'express';
import {
  getRoadmapsHandler,
  getRoadmapByIdHandler,
  generateRoadmapHandler,
  regenerateRoadmapHandler,
  deleteRoadmapHandler,
  toggleTaskCompletionHandler,
  recoverPaceHandler,
  getTopicQuizHandler,
  submitQuizScoreHandler
} from '../controllers/roadmapController.js';

const router = Router();

// Roadmap listing and creation
router.get('/', getRoadmapsHandler);
router.post('/generate', generateRoadmapHandler);
router.get('/:id', getRoadmapByIdHandler);
router.put('/:id/regenerate', regenerateRoadmapHandler);
router.delete('/:id', deleteRoadmapHandler);

// Task status updates
router.patch('/:roadmapId/tasks/:taskId/toggle', toggleTaskCompletionHandler);

// Anti-overwhelm pace recovery
router.post('/:id/recover-pace', recoverPaceHandler);

// Skill gap diagnostics & quizzes
router.get('/diagnostic/quiz', getTopicQuizHandler);
router.post('/:id/diagnostic/submit', submitQuizScoreHandler);

export default router;
