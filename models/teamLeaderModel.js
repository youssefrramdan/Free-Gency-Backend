import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const teamLeaderSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
    },
    logo: {
      type: String,
      default: 'default-team-logo.png',
    },
    aboutUs: {
        type: String,
        required: [true, 'About us description is required'],
        minlength: [100, 'About us must be at least 100 characters'],
        maxlength: [2000, 'About us cannot exceed 2000 characters'],
      },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'Rating must be above 0'],
        max: [5, 'Rating cannot be above 5'],
        set: val => Math.round(val * 10) / 10, // Round to 1 decimal place
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    categories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: [true, 'Team must belong to at least one category'],
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
    completedProjects: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        images: [String],
        projectUrl: String,
        technologies: [String],
        completionDate: Date,
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          refPath: 'comments.userModel',
        },
        userModel: {
          type: String,
          enum: ['Client', 'TeamLeader', 'TeamMember'],
        },
        text: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    teamCode: {
      type: String,
      required: [true, 'Team code is required'],
      unique: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    profileImage: String,
    portfolio: [
      {
        title: String,
        description: String,
        imageUrl: String,
        projectUrl: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate random team code before saving if not provided
teamLeaderSchema.pre('save', async function (next) {
  if (!this.teamCode) {
    // Generate random 8 character code
    this.teamCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

// Hash password before saving
teamLeaderSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
teamLeaderSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual populate for completed projects count
teamLeaderSchema.virtual('completedProjectsCount', {
  ref: 'ProjectApplication',
  localField: '_id',
  foreignField: 'teamLeader',
  match: { status: 'completed' },
  count: true,
});

// Virtual populate for team requests
teamLeaderSchema.virtual('teamRequests', {
  ref: 'TeamRequest',
  localField: '_id',
  foreignField: 'team',
  options: { sort: { requestDate: -1 } },
});

// Virtual populate for accepted members
teamLeaderSchema.virtual('teamMembers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'team',
  match: { role: 'team_member' },
});

// Virtual populate for pending requests
teamLeaderSchema.virtual('pendingRequests', {
  ref: 'TeamRequest',
  localField: '_id',
  foreignField: 'team',
  match: { status: 'pending' },
  options: { sort: { requestDate: -1 } },
});

const TeamLeader = mongoose.model('TeamLeader', teamLeaderSchema);
export default TeamLeader;
