import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Project category is required'],
    },
    budget: {
      type: Number,
      required: [true, 'Project budget is required'],
    },
    requiredSkills: {
      type: String,
      required: [true, 'Required skills are required'],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Project deadline is required'],
    },
    client: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Project must belong to a client'],
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed'],
      default: 'open',
    },
    assignedTeam: {
      type: mongoose.Schema.ObjectId,
      ref: 'TeamLeader',
    },
    teamRequests: [
      {
        team: {
          type: mongoose.Schema.ObjectId,
          ref: 'TeamLeader',
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending',
        },
        requestDate: {
          type: Date,
          default: Date.now,
        },
        responseDate: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ category: 1 });

// Pre-save middleware to handle request status changes
projectSchema.pre('save', function (next) {
  // Check if any team request status has changed
  this.teamRequests.forEach(request => {
    if (request.isModified('status')) {
      request.responseDate = Date.now();
    }
  });

  // If project has an assigned team, ensure it's set correctly
  if (this.status === 'in-progress' && !this.assignedTeam) {
    throw new Error('Project cannot be in progress without an assigned team');
  }
  next();
});

// // Static method to check for duplicate projects with same client and title
// projectSchema.statics.isDuplicateProject = async function (clientId, title) {
//   const existingProject = await this.findOne({ client: clientId, title });
//   return !!existingProject;
// };

const Project = mongoose.model('Project', projectSchema);
export default Project;
