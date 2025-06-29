import jwt from 'jsonwebtoken';
import Message from '../models/message.model.js';
import ProjectAccess from '../models/projectAccess.model.js';
import User from '../models/user.model.js';

// Socket.IO authentication middleware
const authenticateSocket = (socket, next) => {
  const token =
    socket.handshake.headers.authorization?.split(' ')[1] ||
    socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }

    try {
      // Get user details
      const user = await User.findById(decoded.userId).select(
        'name profileImage role'
      );
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = decoded.userId;
      socket.userRole = user.role;
      socket.userName = user.name;
      socket.userImage = user.profileImage;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Database error'));
    }
  });
};

// Check if user has access to project
const checkProjectAccess = async (projectId, userId) => {
  try {
    return await ProjectAccess.checkUserAccess(projectId, userId);
  } catch (error) {
    console.error('Error checking project access:', error);
    return false;
  }
};

// Initialize Socket.IO
const initializeSocket = io => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', socket => {
    console.log(`User ${socket.userName} (${socket.userId}) connected`);

    // Join project room
    socket.on('join_project', async data => {
      try {
        const { projectId } = data;

        if (!projectId) {
          socket.emit('error', { message: 'Project ID is required' });
          return;
        }

        // Verify access
        const hasAccess = await checkProjectAccess(projectId, socket.userId);
        if (!hasAccess) {
          socket.emit('error', {
            message: 'Access denied to this project chat',
          });
          return;
        }

        socket.join(projectId);
        socket.currentProject = projectId;

        // Notify others in the room
        socket.to(projectId).emit('user_joined', {
          userId: socket.userId,
          userName: socket.userName,
          userImage: socket.userImage,
        });

        socket.emit('joined_project', { projectId });
        console.log(`User ${socket.userName} joined project ${projectId}`);
      } catch (error) {
        console.error('Error joining project:', error);
        socket.emit('error', { message: 'Failed to join project' });
      }
    });

    // Leave project room
    socket.on('leave_project', data => {
      try {
        const { projectId } = data;
        socket.leave(projectId);

        // Notify others in the room
        socket.to(projectId).emit('user_left', {
          userId: socket.userId,
          userName: socket.userName,
        });

        socket.emit('left_project', { projectId });
        console.log(`User ${socket.userName} left project ${projectId}`);
      } catch (error) {
        console.error('Error leaving project:', error);
        socket.emit('error', { message: 'Failed to leave project' });
      }
    });

    // Handle real-time message sending
    socket.on('send_message', async data => {
      try {
        const {
          projectId,
          taskId,
          text,
          type = 'text',
          fileUrl,
          fileName,
        } = data;

        if (!projectId || !text) {
          socket.emit('error', { message: 'Project ID and text are required' });
          return;
        }

        // Verify access
        const hasAccess = await checkProjectAccess(projectId, socket.userId);
        if (!hasAccess) {
          socket.emit('error', {
            message: 'Access denied to this project chat',
          });
          return;
        }

        // Create and save message
        const message = new Message({
          projectId,
          taskId,
          text,
          type,
          fileUrl,
          fileName,
          senderId: socket.userId,
          senderName: socket.userName,
          senderImage: socket.userImage,
          senderRole: socket.userRole,
        });

        const savedMessage = await message.save();

        // Emit to all users in the project room (including sender for confirmation)
        io.to(projectId).emit('new_message', savedMessage);

        console.log(
          `Message sent in project ${projectId} by ${socket.userName}`
        );
      } catch (error) {
        console.error('Error sending message via socket:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', data => {
      try {
        const { projectId } = data;
        if (projectId && socket.currentProject === projectId) {
          socket.to(projectId).emit('user_typing', {
            userId: socket.userId,
            userName: socket.userName,
            projectId,
          });
        }
      } catch (error) {
        console.error('Error handling typing start:', error);
      }
    });

    socket.on('typing_stop', data => {
      try {
        const { projectId } = data;
        if (projectId && socket.currentProject === projectId) {
          socket.to(projectId).emit('user_stopped_typing', {
            userId: socket.userId,
            userName: socket.userName,
            projectId,
          });
        }
      } catch (error) {
        console.error('Error handling typing stop:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userName} (${socket.userId}) disconnected`);

      // Notify current project room about user leaving
      if (socket.currentProject) {
        socket.to(socket.currentProject).emit('user_left', {
          userId: socket.userId,
          userName: socket.userName,
        });
      }
    });

    // Handle connection errors
    socket.on('error', error => {
      console.error('Socket error:', error);
    });
  });
};

export default initializeSocket;
