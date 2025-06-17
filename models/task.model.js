import mongoose from 'mongoose';
// ClientTasks ----> created by clients for teams to work on
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    isFixedPrice: {
      type: Boolean,
      default: false,
    },
    budget: {
      type: Number,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service',
    },

    requiredSkills: [String],
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed'],
      default: 'open',
    },
    client: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Client is required'],
    },
    assignedTeam: {
      type: mongoose.Schema.ObjectId,
      ref: 'Team',
    },
    teamRequests: [
      {
        team: {
          type: mongoose.Schema.ObjectId,
          ref: 'Team',
          required: true,
        },
        note: {
          type: String,
          required: true,
        },
        proposal: [
          {
            fileName: String,
            fileUrl: String,
          },
        ],
        budget: {
          type: Number,
        },
        similarProjectUrl: {
          type: String,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending',
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        responseAt: {
          type: Date,
        },
        responseBy: {
          type: mongoose.Schema.ObjectId,
          ref: 'User', // Team Leader or Admin
        },
      },
    ],
    assignedMembers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    fileName: String,
    fileUrl: String,
    taskFiles: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // task History now reflects the overall project status changes
    taskHistory: [
      {
        status: {
          type: String,
          enum: ['open', 'in-progress', 'completed'],
          default: 'open',
        },
        note: String, // Optional note about the change in status
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
taskSchema.index({ client: 1, status: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ assignedTeam: 1 });

// Pre-save middleware to handle request status changes
taskSchema.pre('save', function (next) {
  // Add task status change to taskHistory when status changes
  if (this.isModified('status')) {
    this.taskHistory.push({
      status: this.status,
      note: `task status changed to ${this.status}`,
      changedAt: Date.now(),
    });
  }

  next();
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
