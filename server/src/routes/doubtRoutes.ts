import { Router } from 'express';
import { solveDoubtHandler } from '../controllers/doubtController.js';

const router = Router();

router.post('/solve', solveDoubtHandler);

export default router;
