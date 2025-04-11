import mongoose from 'mongoose';

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
    milestones: [
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
        dueDate: {
          type: Date,
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'in-progress', 'completed'],
          default: 'pending',
        },
        completedAt: {
          type: Date,
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


// Method to add a new milestone
projectSchema.methods.addMilestone = async function (milestoneData, userId) {
  if (!this.isProjectClient(userId)) {
    throw new Error('Only the project client can add milestones');
  }

  this.milestones.push({
    title: milestoneData.title,
    description: milestoneData.description,
    dueDate: milestoneData.dueDate,
    status: 'pending',
  });
  return this.save();
};

// Method to update milestone status
projectSchema.methods.updateMilestoneStatus = async function (
  milestoneId,
  newStatus,
  userId
) {
  const isClient = this.isProjectClient(userId);
  const isLeader = await this.isTeamLeader(userId);

  if (!isClient && !isLeader) {
    throw new Error(
      'Only the project client or team leader can update milestones'
    );
  }

  const milestone = this.milestones.id(milestoneId);
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  // Only client can mark as pending
  if (newStatus === 'pending' && !isClient) {
    throw new Error('Only the project client can mark milestones as pending');
  }

  // Only team leader can mark as completed
  if (newStatus === 'completed' && !isLeader) {
    throw new Error('Only the team leader can mark milestones as completed');
  }

  milestone.status = newStatus;
  if (newStatus === 'completed') {
    milestone.completedAt = Date.now();
  }

  return this.save();
};

// Method to delete a milestone
projectSchema.methods.deleteMilestone = async function (milestoneId, userId) {
  if (!this.isProjectClient(userId)) {
    throw new Error('Only the project client can delete milestones');
  }

  this.milestones = this.milestones.filter(
    m => m._id.toString() !== milestoneId
  );
  return this.save();
};

// // Method to assign a team to a project
// projectSchema.methods.assignTeam = async function (teamId) {
//   // Check if the team has requested to join the project
//   const teamRequest = this.teamRequests.find(
//     request => request.team.equals(teamId) && request.status === 'pending'
//   );

//   if (!teamRequest) {
//     throw new Error('Team has not requested to work on this project');
//   }

//   // Accept the team request and assign the team to the project
//   teamRequest.status = 'accepted';
//   teamRequest.responseDate = Date.now();
//   this.assignedTeam = teamId;
//   this.status = 'in-progress';

//   // Reject all other pending requests
//   this.teamRequests.forEach(request => {
//     if (!request.team.equals(teamId) && request.status === 'pending') {
//       request.status = 'rejected';
//       request.responseDate = Date.now();
//     }
//   });

//   return this.save();
// };

// // Method to reject a team request
// projectSchema.methods.rejectTeamRequest = async function (teamId) {
//   const teamRequest = this.teamRequests.find(
//     request => request.team.equals(teamId) && request.status === 'pending'
//   );

//   if (!teamRequest) {
//     throw new Error('Team has not requested to work on this project');
//   }

//   // Reject the team request
//   teamRequest.status = 'rejected';
//   teamRequest.responseDate = Date.now();

//   return this.save();
// };

const Project = mongoose.model('Project', projectSchema);
export default Project;
