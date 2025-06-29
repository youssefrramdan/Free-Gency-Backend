import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Projects',
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Task',
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderImage: {
      type: String,
    },
    senderRole: {
      type: String,
      required: true,
      enum: ['client', 'teamMember', 'teamLeader'],
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },
    fileUrl: {
      type: String,
    },
    fileName: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
messageSchema.index({ projectId: 1, timestamp: -1 });
messageSchema.index({ taskId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
