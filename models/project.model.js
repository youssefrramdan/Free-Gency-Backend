import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service',
    },
    budget: {
      type: Number,
    },
    requiredSkills: [String],
    deadline: {
      type: Date,
    },
    client: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'cancelled'],
      default: 'open',
    },
    assignedTeam: {
      type: mongoose.Schema.ObjectId,
      ref: 'Team',
    },
    // Requests from teams to join the project
    teamRequests: [
      {
        team: {
          type: mongoose.Schema.ObjectId,
          ref: 'Team',
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
    projectDetails: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        description: String,
      },
    ],
    projectHistory: [
      {
        note: String,
        dueDate: Date,
        status: {
          type: String,
          enum: ['pending', 'in-progress', 'completed'],
          default: 'pending',
        },
        completedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ assignedTeam: 1 });
projectSchema.index({ 'teamRequests.team': 1, 'teamRequests.status': 1 });

// Pre-save middleware to handle request status changes
projectSchema.pre('save', function (next) {
  // Update response date when request status changes
  this.teamRequests.forEach(request => {
    if (request.isModified && request.isModified('status')) {
      request.responseDate = Date.now();
    }
  });

  // Ensure assigned team is set if project is in progress
  if (this.status === 'in-progress' && !this.assignedTeam) {
    throw new Error('Project cannot be in progress without an assigned team');
  }

  // If project is completed, update project history
  if (this.isModified('status') && this.status === 'completed') {
    const now = Date.now();
    this.projectHistory.forEach(history => {
      if (history.status !== 'completed') {
        history.status = 'completed';
        history.completedAt = now;
      }
    });
  }

  next();
});

// Method to assign a team to a project
projectSchema.methods.assignTeam = async function (teamId) {
  // Check if the team has requested to join the project
  const teamRequest = this.teamRequests.find(
    request => request.team.equals(teamId) && request.status === 'pending'
  );

  if (!teamRequest) {
    throw new Error('Team has not requested to work on this project');
  }

  // Accept the team request and assign the team to the project
  teamRequest.status = 'accepted';
  teamRequest.responseDate = Date.now();
  this.assignedTeam = teamId;
  this.status = 'in-progress';
  
  // Reject all other pending requests
  this.teamRequests.forEach(request => {
    if (!request.team.equals(teamId) && request.status === 'pending') {
      request.status = 'rejected';
      request.responseDate = Date.now();
    }
  });

  return this.save();
};

// Method to reject a team request
projectSchema.methods.rejectTeamRequest = async function (teamId) {
  const teamRequest = this.teamRequests.find(
    request => request.team.equals(teamId) && request.status === 'pending'
  );

  if (!teamRequest) {
    throw new Error('Team has not requested to work on this project');
  }

  // Reject the team request
  teamRequest.status = 'rejected';
  teamRequest.responseDate = Date.now();

  return this.save();
};

// Method to get all projects by a team
projectSchema.statics.getProjectsByTeam = function (teamId) {
  return this.find({ 'teamRequests.team': teamId });
};

const Project = mongoose.model('Project', projectSchema);
export default Project;
