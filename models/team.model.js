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
          enum: ['member', 'Team_leader'],
          default: 'member',
        },
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// Middleware للتحقق من صحة كود الفريق
teamSchema.pre('save', function (next) {
  if (this.teamCode) {
    this.teamCode = this.teamCode.toUpperCase().replace(/\s/g, '');
  }
  next();
});

// Virtual للمشاريع النشطة
teamSchema.virtual('activeProjects', {
  ref: 'Project',
  localField: 'projects',
  foreignField: '_id',
  match: { status: 'active' },
});

// Method to accept a join request and add team to user
teamSchema.methods.acceptJoinRequest = async function (
  requestId,
  teamLeaderId
) {
  const request = await mongoose.model('JoinRequest').findById(requestId);

  if (
    !request ||
    request.status !== 'pending' ||
    !request.team.equals(this._id)
  ) {
    throw new Error('Invalid request');
  }

  request.status = 'accepted';
  request.responseAt = Date.now();
  request.responseBy = teamLeaderId;
  await request.save();

  // Add the team to the user after accepting the request
  const user = await mongoose.model('User').findById(request.user);

  this.members.push({
    user: request.user,
    role: 'member',
    joinedAt: Date.now(),
  });

  await this.save();
  // Add the team to the user
  user.teams.push(this._id);
  await user.save();
};

// Method to reject a join request
teamSchema.methods.rejectJoinRequest = async function (requestId) {
  const request = this.joinRequests.id(requestId);

  if (!request || request.status !== 'pending') {
    throw new Error('Invalid request');
  }

  request.status = 'rejected';
  await this.save();
};

// Indexes للأداء الأفضل
teamSchema.index({ teamLeader: 1 });
teamSchema.index({ category: 1 });
teamSchema.index({ status: 1 });

const Team = mongoose.model('Team', teamSchema);
export default Team;
