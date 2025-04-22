import mongoose from 'mongoose';
// project ----> create or team leader add to profile
const projectSchema = new mongoose.Schema(
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
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
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
      enum: ['open', 'in-progress', 'completed', 'cancelled'],
      default: 'open',
    },
    client: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    assignedTeam: {
      type: mongoose.Schema.ObjectId,
      ref: 'Team',
    },
    requirment: [
      {
        fileName: String,
        fileUrl:String,
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
projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ assignedTeam: 1 });
projectSchema.index({ 'teamRequests.team': 1, 'teamRequests.status': 1 });

// Pre-save middleware to handle request status changes
projectSchema.pre('save', function (next) {
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



const Project = mongoose.model('Project', projectSchema);
export default Project;
