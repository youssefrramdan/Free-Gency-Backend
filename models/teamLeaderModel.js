import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const teamLeaderSchema = new mongoose.Schema(
  {
    teamLeaderName: {
      type: String,
      trim: true,
    },
    teamName: {
      type: String,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      //   required: [true, 'Password is required'],
      minlength: 8,
    },
    teamCode: {
      type: String,
      //   required: [true, 'Team code is required'],
      unique: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      //   required: [true, 'Team must belong to category'],
    },
    rating: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    phoneNumber: {
      type: String,
      unique: true,
    },
    logo: {
      // endpoint to update
      type: String,
    },
    aboutUs: {
      type: String,
      minlength: [100, 'About us must be at least 100 characters'],
      maxlength: [2000, 'About us cannot exceed 2000 characters'],
    },
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
    verified: {
      type: Boolean,
      default: false,
    },
    passwordResetExpires: Date,
    passwordResetCode: String,
    passwordResetVerified: Boolean,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash password before saving
teamLeaderSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Virtual populate for completed projects count
teamLeaderSchema.virtual('completedProjectsCount', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'assignedTeam',
  match: { status: 'completed' },
  count: true,
});

// Virtual populate for accepted members
teamLeaderSchema.virtual('teamMembers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'team',
  match: { role: 'team_member' },
});

const TeamLeader = mongoose.model('TeamLeader', teamLeaderSchema);
export default TeamLeader;
