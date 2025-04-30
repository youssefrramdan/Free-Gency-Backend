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
      default:
        'https://static.vecteezy.com/system/resources/previews/039/845/042/non_2x/male-default-avatar-profile-gray-picture-grey-photo-placeholder-gray-profile-anonymous-face-picture-illustration-isolated-on-white-background-free-vector.jpg',
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
    ratings: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Review',
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    fcmToken: {
      type: String,
      default:
        'cGSjs9QfRzeJFz1xVeUasI:APA91bE9JQRfDO95U9lfPPzhpJhbkhrIAKCPQ2zkAEVYlbyond8oBvkz6wRJvB6UyZEDpEf_VBpljtZT6vKeVc7HuPPA_TQ-ESAWYOJEHIkgbNtUUjX0u8A',
    },
  },
  {
    timestamps: true,
  }
);
// Remove interests population from pre-find middleware
userSchema.pre(/^find/, function (next) {
  this.select('-__v -createdAt -updatedAt -ratedUser');
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

// Add method to update average rating
userSchema.methods.updateAverageRating = async function () {
  const ratings = await mongoose.model('Review').find({ ratedUser: this._id });
  if (ratings.length > 0) {
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    this.averageRating = totalRating / ratings.length;
    this.ratingCount = ratings.length;
  } else {
    this.averageRating = 0;
    this.ratingCount = 0;
  }
  await this.save();
};

// حفظ الـ FCM Token عند الـ Login أو الـ Signup
userSchema.methods.saveFCMToken = async function (token) {
  this.fcmToken = token;
  await this.save();
};

// مسح الـ FCM Token عند الـ Logout
userSchema.methods.removeFCMToken = async function () {
  this.fcmToken = null;
  await this.save();
};

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ createdTeam: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
