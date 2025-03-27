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
    service: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service',
      required: [true, 'Project service is required'],
    },
    budget: {
      type: Number,
      required: [true, 'Project budget is required'],
    },
    requiredSkills: {
      type: [String],
      required: [true, 'Required skills are required'],
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
      enum: ['open', 'in-progress', 'completed', 'cancelled'],
      default: 'open',
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
    projectFiles: [
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
    milestones: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
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

// Indexes
projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ assignedTeam: 1 });
projectSchema.index({ 'teamRequests.team': 1, 'teamRequests.status': 1 });


// Pre-save middleware to handle request status changes
projectSchema.pre('save', function (next) {
  // Check if any team request status has changed
  this.teamRequests.forEach(request => {
    if (request.isModified && request.isModified('status')) {
      request.responseDate = Date.now();
    }
  });

  // If project has an assigned team, ensure it's set correctly
  if (this.status === 'in-progress' && !this.assignedTeam) {
    throw new Error('Project cannot be in progress without an assigned team');
  }

  // When project is completed, set completion date for milestones if not already set
  if (this.isModified('status') && this.status === 'completed') {
    const now = Date.now();
    this.milestones.forEach(milestone => {
      if (milestone.status !== 'completed') {
        milestone.status = 'completed';
        milestone.completedAt = now;
      }
    });
  }

  next();
});

// Method to assign team to project
projectSchema.methods.assignTeam = function (teamId) {
  // Find team request
  const teamRequest = this.teamRequests.find(
    request => request.team.equals(teamId) && request.status === 'pending'
  );

  if (!teamRequest) {
    throw new Error('Team has not requested to work on this project');
  }

  // Update request status
  teamRequest.status = 'accepted';
  teamRequest.responseDate = Date.now();

  // Assign team
  this.assignedTeam = teamId;
  this.status = 'in-progress';

  // Reject all other requests
  this.teamRequests.forEach(request => {
    if (!request.team.equals(teamId) && request.status === 'pending') {
      request.status = 'rejected';
      request.responseDate = Date.now();
    }
  });

  return this.save();
};

// Static method to get projects by team
projectSchema.statics.getTeamProjects = function (teamId) {
  return this.find({ assignedTeam: teamId })
    .populate('category service client')
    .sort({ createdAt: -1 });
};

// Static method to check for duplicate projects with same client and title
projectSchema.statics.isDuplicateProject = async function (clientId, title) {
  const existingProject = await this.findOne({ client: clientId, title });
  return !!existingProject;
};

const Project = mongoose.model('Project', projectSchema);
export default Project;

// auth --->
// team join requsets --->

// (join to team , get my requests , cancel requset) ---> team member
// (team leader )---> get all requests for my team ,update request status

// Category ,
// services ---> routes , nested routes ---> Admin
// ----> add category , update category , delete category , get all categories
// ----> add services , update services , delete services , get all services
// ----->categories/679cd051b3d57c82419965e1/services-----> create service on category
// ------>/categories/6797aae437c53affcd567ec3/subcategories ----> Get list of services for specific category
// project
// post project , update project , delete project
// view requests for project (applies)---> client
//
