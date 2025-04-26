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
      default:'https://static.vecteezy.com/system/resources/previews/039/845/042/non_2x/male-default-avatar-profile-gray-picture-grey-photo-placeholder-gray-profile-anonymous-face-picture-illustration-isolated-on-white-background-free-vector.jpg',
    },
    role: {
      type: String,
      enum: ['client', 'teamMember', 'teamLeader'],
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
    // update -->
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
  }
);
// Remove interests population from pre-find middleware
userSchema.pre(/^find/, function (next) {
  this.select('-__v -createdAt -updatedAt');
  next();
});

// Hash password middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.role) {
    this.role = 'teamMember';
  }
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

// Add method for updating user teams
userSchema.methods.addTeam = async function (teamId) {
  this.teams.push(teamId);
  this.role = 'teamMember';
  await this.save();
};

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ createdTeam: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
