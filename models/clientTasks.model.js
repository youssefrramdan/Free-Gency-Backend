import mongoose from 'mongoose';
// ClientTasks ----> created by clients for teams to work on
const clientTasksSchema = new mongoose.Schema(
  {
    projectTitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
    },
    requiredSkills: [String],
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'cancelled'],
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
    requirment: [
      {
        fileName: String,
        fileUrl: String,
      },
    ],
    projectFiles: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Project history now reflects the overall project status changes
    projectHistory: [
      {
        status: {
          type: String,
          enum: ['open', 'in-progress', 'completed', 'cancelled'],
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
clientTasksSchema.index({ client: 1, status: 1 });
clientTasksSchema.index({ category: 1 });
clientTasksSchema.index({ assignedTeam: 1 });
clientTasksSchema.index({ 'teamRequests.team': 1, 'teamRequests.status': 1 });

// Pre-save middleware to handle request status changes
clientTasksSchema.pre('save', function (next) {
  // Add project status change to projectHistory when status changes
  if (this.isModified('status')) {
    this.projectHistory.push({
      status: this.status,
      note: `Project status changed to ${this.status}`,
      changedAt: Date.now(),
    });
  }

  next();
});

const ClientTasks = mongoose.model('ClientTasks', clientTasksSchema);
export default ClientTasks;
