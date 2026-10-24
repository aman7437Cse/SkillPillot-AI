import { Router } from 'express';
import {
  generateQuizHandler,
  submitQuizHandler,
  getQuizHistoryHandler,
} from '../controllers/quizController.js';

const router = Router();

router.post('/generate', generateQuizHandler);
router.post('/:id/submit', submitQuizHandler);
router.get('/history', getQuizHistoryHandler);

export default router;
