import mongoose from 'mongoose';

const teamRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Request must belong to a user'],
    },
    team: {
      type: mongoose.Schema.ObjectId,
      ref: 'TeamLeader',
      required: [true, 'Request must belong to a team'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    teamCode: {
      type: String,
      required: [true, 'Team code is required'],
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    responseDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual fields
teamRequestSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

teamRequestSchema.virtual('teamDetails', {
  ref: 'TeamLeader',
  localField: 'team',
  foreignField: '_id',
  justOne: true,
});

// Ensure user can only have one pending request per team
teamRequestSchema.index(
  { user: 1, team: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

// Validate team code before saving
teamRequestSchema.pre('save', async function (next) {
  if (this.isNew) {
    const team = await mongoose
      .model('TeamLeader')
      .findOne({ teamCode: this.teamCode });
    if (!team) {
      throw new Error('Invalid team code');
    }
    if (!team._id.equals(this.team)) {
      throw new Error('Team code does not match team ID');
    }
  }
  next();
});

// Update user role and team when request is accepted
teamRequestSchema.pre('save', async function (next) {
  if (this.isModified('status')) {
    this.responseDate = Date.now();

    if (this.status === 'accepted') {
      const user = await mongoose.model('User').findById(this.user);
      if (!user) {
        throw new Error('User not found');
      }

      // تحديث دور المستخدم وفريقه
      user.role = 'team_member';
      user.team = this.team;
      await user.save();

      // تحديث قائمة أعضاء الفريق
      await mongoose
        .model('TeamLeader')
        .findByIdAndUpdate(this.team, { $addToSet: { members: this.user } });
    }
  }
  next();
});

// Static method to check if user can apply to team
teamRequestSchema.statics.canUserApply = async function (userId, teamId) {
  const existingRequest = await this.findOne({
    user: userId,
    team: teamId,
    status: 'pending',
  });
  return !existingRequest;
};


const TeamRequest = mongoose.model('TeamRequest', teamRequestSchema);
export default TeamRequest;
