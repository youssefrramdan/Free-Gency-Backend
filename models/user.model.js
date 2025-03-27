import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// TTL duration in days
const REJECTED_REQUEST_TTL_DAYS = 30;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
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
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    profileImage: {
      type: String,
      default: 'default-avatar.png',
    },
    role: {
      type: String,
      enum: ['client', 'team_member', 'team_leader'],
      default: 'client',
    },
    teamsInfo: [
      {
        team: {
          type: mongoose.Schema.ObjectId,
          ref: 'Team',
          required: true,
        },
        role: {
          type: String,
          enum: ['member', 'leader', 'admin'],
          default: 'member',
        },
        status: {
          type: String,
          enum: ['active', 'pending', 'invited', 'rejected'],
          default: 'pending',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        rejectedAt: {
          type: Date,
        },
        tasks: [
          {
            type: mongoose.Schema.ObjectId,
            ref: 'Task',
          },
        ],
      },
    ],
    profile: {
      skills: [String],
      interests: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'Category',
        },
      ],
      bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
      },
    },
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

// Hash password middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for active teams
userSchema.virtual('activeTeams').get(function () {
  return this.teamMemberships
    .filter(membership => membership.status === 'active')
    .map(membership => membership.team);
});

// Method to join a team
userSchema.methods.joinTeam = function (teamId, role = 'member') {
  // Check for existing membership
  const existingMembership = this.teamMemberships.find(membership =>
    membership.team.equals(teamId)
  );

  if (!existingMembership) {
    this.teamMemberships.push({
      team: teamId,
      role,
      status: 'pending',
      requestedAt: new Date(),
    });
  }

  return this;
};

// Method to check team membership
userSchema.methods.isInTeam = function (teamId) {
  return this.teamMemberships.some(
    membership =>
      membership.team.equals(teamId) && membership.status === 'active'
  );
};

// Method to get active teams count
userSchema.methods.getActiveTeamsCount = function () {
  return this.teamMemberships.filter(
    membership => membership.status === 'active'
  ).length;
};

// Method to get pending team requests
userSchema.methods.getPendingTeamRequests = function () {
  return this.teamMemberships.filter(
    membership => membership.status === 'pending'
  );
};

// Method to handle team request response
userSchema.methods.handleTeamRequest = function (teamId, action) {
  const membershipIndex = this.teamMemberships.findIndex(membership =>
    membership.team.equals(teamId)
  );

  if (membershipIndex !== -1) {
    switch (action) {
      case 'approve':
        this.teamMemberships[membershipIndex].status = 'active';
        this.teamMemberships[membershipIndex].joinedAt = Date.now();
        break;
      case 'reject':
        this.teamMemberships[membershipIndex].status = 'rejected';
        this.teamMemberships[membershipIndex].rejectedAt = Date.now();
        break;
      default:
        throw new Error('Invalid action. Use "approve" or "reject".');
    }
  }

  return this;
};

// Cleanup middleware to remove expired rejected requests
userSchema.pre('save', async function (next) {
  if (this.isModified('teamMemberships')) {
    const now = new Date();
    const ttlThreshold = new Date(
      now.setDate(now.getDate() - REJECTED_REQUEST_TTL_DAYS)
    );

    // Filter out rejected requests older than TTL
    this.teamMemberships = this.teamMemberships.filter(membership => {
      if (membership.status === 'rejected' && membership.rejectedAt) {
        return membership.rejectedAt > ttlThreshold;
      }
      return true;
    });
  }
  next();
});

// Schedule to periodically clean up rejected requests
userSchema.statics.cleanupRejectedRequests = async function () {
  const now = new Date();
  const ttlThreshold = new Date(
    now.setDate(now.getDate() - REJECTED_REQUEST_TTL_DAYS)
  );

  const usersToUpdate = await this.find({
    'teamMemberships.status': 'rejected',
    'teamMemberships.rejectedAt': { $lt: ttlThreshold },
  });

  await Promise.all(
    usersToUpdate.map(user => {
      user.teamMemberships = user.teamMemberships.filter(membership => {
        if (membership.status === 'rejected' && membership.rejectedAt) {
          return membership.rejectedAt > ttlThreshold;
        }
        return true;
      });
      return user.save();
    })
  );

  console.log(
    `Cleaned up rejected team requests for ${usersToUpdate.length} users`
  );
};

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ 'teamMemberships.team': 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
