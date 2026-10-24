import { Router } from 'express';
import {
  listConversationsHandler,
  getConversationHandler,
  createConversationHandler,
  renameConversationHandler,
  deleteConversationHandler,
  sendMessageHandler,
  streamMessageHandler,
} from '../controllers/assistantController.js';

const router = Router();

// Conversation management
router.get('/conversations', listConversationsHandler);
router.post('/conversations', createConversationHandler);
router.get('/conversations/:id', getConversationHandler);
router.patch('/conversations/:id', renameConversationHandler);
router.delete('/conversations/:id', deleteConversationHandler);

// Chat & Streaming
router.post('/chat', sendMessageHandler);
router.post('/chat/stream', streamMessageHandler);

export default router;
