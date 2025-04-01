import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    teamLeader: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Team must have a leader'],
    },
    name: {
      type: String,
      trim: true,
    },
    teamCode: {
      type: String,
      unique: true,
      uppercase: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
    },
    members: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['teamMember', 'teamLeader'],
          default: 'teamMember',
        },
        job: String,
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    aboutUs: {
      type: String,
      minlength: [100, 'About us must be at least 100 characters'],
      maxlength: [2000, 'About us cannot exceed 2000 characters'],
    },
    // طلبات الانضمام
    joinRequests: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
          required: [true, 'User is required'],
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending',
        },
      },
    ],

    projects: [
      {
        project: {
          type: mongoose.Schema.ObjectId,
          ref: 'Project',
        },
        status: {
          type: String,
          enum: ['active', 'completed'],
          default: 'active',
        },
        completionDate: Date,
      },
    ],
    lastedProjects: [
      {
        title: {
          type: String,
          required: true,
        },
        budget: String,
        description: String,
        images: [String],
        projectUrl: String,
        technologies: [String],
        completionDate: Date,
      },
    ],
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'recruiting'],
      default: 'active',
    },
    contactInfo: {
      email: String,
      phone: String,
      website: String,
    },
    logo: String,

    foundedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes للأداء الأفضل
teamSchema.index({ teamLeader: 1 });
teamSchema.index({ category: 1 });
teamSchema.index({ status: 1 });

// Add methods for team member operations
teamSchema.methods.addMember = async function (userId, job) {
  this.members.push({
    user: userId,
    role: 'teamMember',
    job,
    joinedAt: Date.now(),
  });
  await this.save();
};

const Team = mongoose.model('Team', teamSchema);
export default Team;
