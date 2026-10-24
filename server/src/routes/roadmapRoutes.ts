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
  submitQuizScoreHandler,
  getDashboardHandler,
  recordSessionHandler,
  updateTaskStatusHandler,
  rescheduleTaskHandler,
} from '../controllers/roadmapController.js';

const router = Router();

// Roadmap listing and creation
router.get('/', getRoadmapsHandler);
router.post('/generate', generateRoadmapHandler);
router.get('/:id', getRoadmapByIdHandler);
router.get('/:id/dashboard', getDashboardHandler);
router.put('/:id/regenerate', regenerateRoadmapHandler);
router.delete('/:id', deleteRoadmapHandler);

// Task status updates & execution
router.patch('/:roadmapId/tasks/:taskId', toggleTaskCompletionHandler);
router.patch('/:roadmapId/tasks/:taskId/toggle', toggleTaskCompletionHandler);
router.patch('/:roadmapId/tasks/:taskId/status', updateTaskStatusHandler);
router.patch('/:roadmapId/tasks/:taskId/reschedule', rescheduleTaskHandler);
router.post('/:roadmapId/tasks/:taskId/session', recordSessionHandler);

// Anti-overwhelm pace recovery
router.post('/:id/recover-pace', recoverPaceHandler);

// Skill gap diagnostics & quizzes
router.get('/diagnostic/quiz', getTopicQuizHandler);
router.post('/:id/diagnostic/submit', submitQuizScoreHandler);

export default router;
