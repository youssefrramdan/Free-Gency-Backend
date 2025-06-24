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
    contactInfo: {
      email: String,
      phone: String,
      pricing: String,
    },

    socialMediaLinks: {
      linkedin: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/(www\.)?linkedin\.com\//.test(v);
          },
          message: 'Please provide a valid LinkedIn URL',
        },
      },
      facebook: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/(www\.)?facebook\.com\//.test(v);
          },
          message: 'Please provide a valid Facebook URL',
        },
      },
      twitter: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//.test(v);
          },
          message: 'Please provide a valid Twitter/X URL',
        },
      },
      instagram: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/(www\.)?instagram\.com\//.test(v);
          },
          message: 'Please provide a valid Instagram URL',
        },
      },
      youtube: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/(www\.)?youtube\.com\//.test(v);
          },
          message: 'Please provide a valid YouTube URL',
        },
      },
      website: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid website URL',
        },
      },
      github: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/(www\.)?github\.com\//.test(v);
          },
          message: 'Please provide a valid GitHub URL',
        },
      },
      behance: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/(www\.)?behance\.net\//.test(v);
          },
          message: 'Please provide a valid Behance URL',
        },
      },
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
        'cpxejH2vK1RwXoumhrtwKG:APA91bExzMeZD9sXLX4rF3FDnyBNsINTzDAWqw_zXloyVw6Fiz9mUVVfBtPp2-moLnVnZnW7rQ_xId3Pdsc0JCiG92i6aWkJpLzPQZtxwd69B4s3Il6ZLbQ',
    },
    savedTasks: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Task',
      },
    ],
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
    this.averageRating = parseFloat((totalRating / ratings.length).toFixed(2));
    this.ratingCount = ratings.length;
  } else {
    this.averageRating = 0.0;
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
