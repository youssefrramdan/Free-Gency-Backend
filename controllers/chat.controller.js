import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import Message from '../models/message.model.js';
import ProjectAccess from '../models/projectAccess.model.js';
import User from '../models/user.model.js';
import Projects from '../models/projects.model.js';
import Task from '../models/task.model.js';
import Team from '../models/team.model.js';

// Helper function to check project access
const checkProjectAccess = async (projectId, userId) => {
  try {
    return await ProjectAccess.checkUserAccess(projectId, userId);
  } catch (error) {
    console.error('Error checking project access:', error);
    return false;
  }
};

/**
 * @desc    Get messages for a project
 * @route   GET /api/v1/chat/project/:projectId/messages
 * @access  Private
 */
const getProjectMessages = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // Check access
  const hasAccess = await ProjectAccess.checkUserAccess(
    projectId,
    req.user._id
  );
  if (!hasAccess) {
    return next(new ApiError('Access denied to this project chat', 403));
  }

  const messages = await Message.find({ projectId })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit, 10))
    .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
    .exec();

  const totalMessages = await Message.countDocuments({ projectId });

  res.status(200).json({
    status: 'success',
    data: {
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: totalMessages,
        pages: Math.ceil(totalMessages / parseInt(limit, 10)),
      },
    },
  });
});

/**
 * @desc    Send a message
 * @route   POST /api/v1/chat/project/:projectId/send
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { text, type = 'text', fileUrl, fileName } = req.body;

  if (!text) {
    return next(new ApiError('Message text is required', 400));
  }

  // Check access
  const hasAccess = await ProjectAccess.checkUserAccess(
    projectId,
    req.user._id
  );
  if (!hasAccess) {
    return next(new ApiError('Access denied to this project chat', 403));
  }

  const message = new Message({
    projectId,
    taskId: projectId, // Since projectId is the same as taskId
    text,
    type,
    fileUrl,
    fileName,
    senderId: req.user._id,
    senderName: req.user.name,
    senderImage: req.user.profileImage,
    senderRole: req.user.role,
  });

  const savedMessage = await message.save();

  // Emit real-time message via Socket.IO if available
  const io = req.app.get('io');
  if (io) {
    io.to(projectId).emit('new_message', savedMessage);
  }

  res.status(201).json({
    status: 'success',
    data: savedMessage,
  });
});

/**
 * @desc    Get all chats for a user
 * @route   GET /api/v1/chat/my-chats
 * @access  Private
 */
const getUserChats = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // Find all project access records for this user
  const userProjectAccess = await ProjectAccess.find({
    status: 'active',
    $or: [
      { clientId: userId }, // User is client
      { teamLeaderId: userId }, // User is team leader
      { assignedMembers: userId }, // User is assigned to subtask
    ],
  });

  if (userProjectAccess.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: [],
    });
  }

  // Build the chats response
  const chats = await Promise.all(
    userProjectAccess.map(async projectAccess => {
      const { projectId } = projectAccess;

      // Get task details
      const task = await Task.findById(projectId).select('title description');
      if (!task) return null;

      // Get latest message for this project
      const latestMessage = await Message.findOne({ projectId })
        .sort({ timestamp: -1 })
        .select('text senderName timestamp');

      // Get participants
      const participants = [];

      // Add client
      if (projectAccess.clientId) {
        participants.push({
          id: projectAccess.clientId,
          role: 'client',
        });
      }

      // Add team leader
      if (projectAccess.teamLeaderId) {
        participants.push({
          id: projectAccess.teamLeaderId,
          role: 'teamLeader',
        });
      }

      // Add assigned members
      projectAccess.assignedMembers?.forEach(memberId => {
        participants.push({
          id: memberId,
          role: 'teamMember',
        });
      });

      return {
        projectId: projectId.toString(),
        projectTitle: task.title,
        lastMessage: latestMessage
          ? {
              text: latestMessage.text,
              senderName: latestMessage.senderName,
              timestamp: latestMessage.timestamp,
            }
          : null,
        participants,
      };
    })
  );

  // Filter out null results
  const validChats = chats.filter(chat => chat !== null);

  res.status(200).json({
    status: 'success',
    data: validChats,
  });
});

/**
 * @desc    Check chat access
 * @route   GET /api/v1/chat/project/:projectId/access
 * @access  Private
 */
const checkChatAccess = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  const hasAccess = await ProjectAccess.checkUserAccess(
    projectId,
    req.user._id
  );

  res.status(200).json({
    status: 'success',
    hasAccess,
  });
});

export { getProjectMessages, sendMessage, getUserChats, checkChatAccess };
