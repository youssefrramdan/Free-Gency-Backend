import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
      minlength: 8,
    },
    profileImage: {
      type: String,
    },
    role: {
      type: String,
      enum: ['client', 'team_member'],
      default: 'client',
    },
    // مصفوفة تحتوي على فرق متعددة يمكن للمستخدم الانضمام إليها
    teams: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'TeamLeader',
      },
    ],
    // إذا كان client
    interests: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
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
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user can apply to any team
userSchema.methods.canApplyToTeam = async function () {
  if (this.role === 'team_member') {
    return false;
  }

  // Check if user has any pending requests for any team
  const pendingRequest = await mongoose.model('TeamRequest').findOne({
    user: this._id,
    status: 'pending',
  });

  return !pendingRequest;
};

// Virtual للحصول على جميع الفرق التي ينتمي إليها الفريق
userSchema.virtual('teamDetails', {
  ref: 'TeamLeader',
  localField: 'teams',
  foreignField: '_id',
});

// Virtual للحصول على طلبات الانضمام للفرق
userSchema.virtual('teamRequests', {
  ref: 'TeamRequest',
  localField: '_id',
  foreignField: 'user',
  options: { sort: { requestDate: -1 } },
});

// Virtual للتحقق إذا كان المستخدم عضو في فرق متعددة
userSchema.virtual('isTeamMember').get(function () {
  return this.role === 'team_member' && this.teams.length > 0;
});

const User = mongoose.model('User', userSchema);
export default User;
