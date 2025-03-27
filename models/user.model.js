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
    // الفرق التي انضم إليها المستخدم فقط بعد الموافقة
    teams: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Team',
      },
    ],
    createdTeams: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Team',
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

// Compare password method - essential utility method kept in schema
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};



// Ensure team leaders always have 'team_leader' role
userSchema.pre('save', function (next) {
  if (
    this.createdTeams &&
    this.createdTeams.length > 0 &&
    this.role !== 'team_leader'
  ) {
    this.role = 'team_leader';
  }
  next();
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ createdTeams: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
