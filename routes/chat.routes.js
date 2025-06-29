import express from 'express';
import {
  getProjectMessages,
  sendMessage,
  getUserChats,
  checkChatAccess,
} from '../controllers/chat.controller.js';
import { protectedRoutes } from '../controllers/auth.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protectedRoutes);

// User chats
router.route('/my-chats').get(getUserChats);

// Project messages
router.route('/project/:projectId/messages').get(getProjectMessages);

// Send message
router.route('/project/:projectId/send').post(sendMessage);

// Check access
router.route('/project/:projectId/access').get(checkChatAccess);

export default router;
