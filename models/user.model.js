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
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
    },
    profileImage: {
      type: String,
    },
    role: {
      type: String,
      enum: ['client', 'team_member', 'team_leader'],
      default: 'client',
    },
    teams: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Team',
      },
    ],
    createdTeam: {
      type: mongoose.Schema.ObjectId,
      ref: 'Team',
    },
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
    isVerified: {
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

// Compare password method - essential utility method kept in schema
userSchema.methods.comparePassword = async function (candidatePassword) {
  // إذا كانت كلمة المرور غير متاحة (بسبب select: false)
  if (!this.password) {
    throw new Error('Password not loaded for comparison');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Ensure team leaders always have 'team_leader' role
userSchema.pre('save', function (next) {
  if (this.createdTeam && this.role !== 'team_leader') {
    this.role = 'team_leader';
  }
  next();
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ createdTeam: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
