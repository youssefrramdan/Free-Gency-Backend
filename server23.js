const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*", // In production, specify your Flutter app's origin
    methods: ["GET", "POST"],
    credentials: true
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/freegency_chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Message Schema
const messageSchema = new mongoose.Schema({
  projectId: { type: String, required: true, index: true },
  text: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderImage: { type: String },
  senderRole: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
  isRead: { type: Boolean, default: false },
  readBy: [{ userId: String, readAt: Date }],
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

// Project Access Schema (for authorization)
const projectAccessSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true },
  clientId: { type: String, required: true },
  teamId: { type: String, required: true },
  teamMembers: [{ type: String }], // Array of team member IDs
  createdAt: { type: Date, default: Date.now }
});

const ProjectAccess = mongoose.model('ProjectAccess', projectAccessSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Socket.IO authentication middleware
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    socket.userName = decoded.name;
    next();
  });
};

// Check if user has access to project
const checkProjectAccess = async (projectId, userId, userRole) => {
  try {
    const projectAccess = await ProjectAccess.findOne({ projectId });

    if (!projectAccess) {
      return false;
    }

    // Check access based on role
    if (userRole === 'client' && projectAccess.clientId === userId) {
      return true;
    }

    if (userRole === 'teamLeader' && projectAccess.teamId === userId) {
      return true;
    }

    if (userRole === 'teamMember' && projectAccess.teamMembers.includes(userId)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking project access:', error);
    return false;
  }
};

// REST API Routes

// Get messages for a project
app.get('/api/v1/messages/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check access
    const hasAccess = await checkProjectAccess(projectId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project chat' });
    }

    const messages = await Message.find({ projectId })
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Message.countDocuments({ projectId })
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message
app.post('/api/v1/messages', authenticateToken, async (req, res) => {
  try {
    const { projectId, text, type = 'text' } = req.body;

    if (!projectId || !text) {
      return res.status(400).json({ error: 'Project ID and text are required' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(projectId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project chat' });
    }

    const message = new Message({
      projectId,
      text,
      type,
      senderId: req.user.id,
      senderName: req.user.name,
      senderImage: req.user.profileImage,
      senderRole: req.user.role,
    });

    const savedMessage = await message.save();

    // Emit to all users in the project room
    io.to(projectId).emit('message', savedMessage);

    res.status(201).json({
      success: true,
      data: savedMessage
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark messages as read
app.patch('/api/v1/messages/:projectId/read', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check access
    const hasAccess = await checkProjectAccess(projectId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project chat' });
    }

    await Message.updateMany(
      {
        projectId,
        senderId: { $ne: req.user.id }, // Don't mark own messages as read
        'readBy.userId': { $ne: req.user.id } // Only if not already marked as read
      },
      {
        $push: {
          readBy: {
            userId: req.user.id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread message count
app.get('/api/v1/messages/:projectId/unread-count', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check access
    const hasAccess = await checkProjectAccess(projectId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project chat' });
    }

    const unreadCount = await Message.countDocuments({
      projectId,
      senderId: { $ne: req.user.id },
      'readBy.userId': { $ne: req.user.id }
    });

    res.json({ success: true, count: unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all chats for a user
app.get('/api/v1/chats/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the user is requesting their own chats or has admin access
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find all projects the user has access to
    const userProjectAccess = await ProjectAccess.find({
      $or: [
        { clientId: userId },
        { teamId: userId },
        { teamMembers: userId }
      ]
    });

    if (userProjectAccess.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const projectIds = userProjectAccess.map(access => access.projectId);

    // Build the chats response
    const chats = await Promise.all(
      userProjectAccess.map(async (projectAccess) => {
        const projectId = projectAccess.projectId;

        // Get latest message for this project
        const latestMessage = await Message.findOne({ projectId })
          .sort({ timestamp: -1 })
          .select('text senderId senderName type timestamp');

        // Get unread count for this user
        const unreadCount = await Message.countDocuments({
          projectId,
          senderId: { $ne: userId },
          'readBy.userId': { $ne: userId }
        });

        // Determine user's role in this project
        let userRole = 'teamMember';
        if (projectAccess.clientId === userId) {
          userRole = 'client';
        } else if (projectAccess.teamId === userId) {
          userRole = 'teamLeader';
        }

        // Get project details (you'll need to adapt this based on your project schema)
        // For now, using placeholder data
        const projectTitle = `Project ${projectId.slice(-6)}`; // You should fetch from your projects collection

        return {
          projectId,
          projectTitle,
          projectDescription: null,
          client: {
            _id: projectAccess.clientId,
            name: 'Client Name', // Fetch from users collection
          },
          teamLeader: {
            _id: projectAccess.teamId,
            name: 'Team Leader Name', // Fetch from users collection
          },
          teamMembers: projectAccess.teamMembers.map(memberId => ({
            _id: memberId,
            name: 'Team Member', // Fetch from users collection
          })),
          userRole,
          latestMessage,
          unreadCount,
          lastActivity: latestMessage ? latestMessage.timestamp : null,
          status: 'active',
        };
      })
    );

    // Sort by latest activity
    chats.sort((a, b) => {
      if (!a.lastActivity && !b.lastActivity) return 0;
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return new Date(b.lastActivity) - new Date(a.lastActivity);
    });

    res.json({
      success: true,
      data: chats,
      total: chats.length,
      totalUnread: chats.reduce((sum, chat) => sum + chat.unreadCount, 0)
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check chat access
app.get('/api/v1/messages/:projectId/access', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const hasAccess = await checkProjectAccess(projectId, req.user.id, req.user.role);

    res.json({ success: true, hasAccess });
  } catch (error) {
    console.error('Error checking access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project access (should be called when a project is created/assigned)
app.post('/api/v1/project-access', authenticateToken, async (req, res) => {
  try {
    const { projectId, clientId, teamId, teamMembers } = req.body;

    const projectAccess = new ProjectAccess({
      projectId,
      clientId,
      teamId,
      teamMembers: teamMembers || []
    });

    await projectAccess.save();

    res.status(201).json({
      success: true,
      data: projectAccess
    });
  } catch (error) {
    console.error('Error creating project access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Socket.IO connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User ${socket.userName} (${socket.userId}) connected`);

  // Join project room
  socket.on('join_project', async (data) => {
    const { projectId } = data;

    // Verify access
    const hasAccess = await checkProjectAccess(projectId, socket.userId, socket.userRole);
    if (!hasAccess) {
      socket.emit('error', 'Access denied to this project chat');
      return;
    }

    socket.join(projectId);
    socket.currentProject = projectId;

    // Notify others in the room
    socket.to(projectId).emit('user_joined', {
      userId: socket.userId,
      userName: socket.userName
    });

    console.log(`User ${socket.userName} joined project ${projectId}`);
  });

  // Leave project room
  socket.on('leave_project', (data) => {
    const { projectId } = data;
    socket.leave(projectId);

    // Notify others in the room
    socket.to(projectId).emit('user_left', {
      userId: socket.userId,
      userName: socket.userName
    });

    console.log(`User ${socket.userName} left project ${projectId}`);
  });

  // Handle real-time message sending
  socket.on('send_message', async (data) => {
    try {
      const { projectId, text, type = 'text' } = data;

      // Verify access
      const hasAccess = await checkProjectAccess(projectId, socket.userId, socket.userRole);
      if (!hasAccess) {
        socket.emit('error', 'Access denied to this project chat');
        return;
      }

      // Create and save message
      const message = new Message({
        projectId,
        text,
        type,
        senderId: socket.userId,
        senderName: socket.userName,
        senderImage: data.senderImage,
        senderRole: socket.userRole,
      });

      const savedMessage = await message.save();

      // Emit to all users in the project room (including sender for confirmation)
      io.to(projectId).emit('message', savedMessage);

      // Also emit to all connected users to update their chats list
      // Find all users who have access to this project
      const projectAccess = await ProjectAccess.findOne({ projectId });
      if (projectAccess) {
        const allUserIds = [
          projectAccess.clientId,
          projectAccess.teamId,
          ...projectAccess.teamMembers
        ].filter(id => id !== socket.userId); // Don't send to sender

        // Emit chat list update to each user
        allUserIds.forEach(userId => {
          io.emit('chat_list_update', {
            userId,
            projectId,
            latestMessage: {
              text: savedMessage.text,
              senderId: savedMessage.senderId,
              senderName: savedMessage.senderName,
              type: savedMessage.type,
              timestamp: savedMessage.timestamp
            }
          });
        });
      }

    } catch (error) {
      console.error('Error sending message via socket:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { projectId } = data;
    socket.to(projectId).emit('typing_start', {
      userId: socket.userId,
      userName: socket.userName,
      projectId
    });
  });

  socket.on('typing_stop', (data) => {
    const { projectId } = data;
    socket.to(projectId).emit('typing_stop', {
      userId: socket.userId,
      projectId
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.userName} (${socket.userId}) disconnected`);

    // Notify current project room about user leaving
    if (socket.currentProject) {
      socket.to(socket.currentProject).emit('user_left', {
        userId: socket.userId,
        userName: socket.userName
      });
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});


module.exports = { app, server, io };
