import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const teamLeaderSchema = new mongoose.Schema(
  {
    teamLeaderName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      unique: true,
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
    logo: {
      type: String,
      default: 'default-team-logo.png',
    },
    aboutUs: {
      type: String,
      required: [true, 'About us description is required'],
      minlength: [100, 'About us must be at least 100 characters'],
      maxlength: [2000, 'About us cannot exceed 2000 characters'],
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'Rating must be above 0'],
        max: [5, 'Rating cannot be above 5'],
        set: val => Math.round(val * 10) / 10, // Round to 1 decimal place
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    categories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: [true, 'Team must belong to at least one category'],
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
        description: String,
        images: [String],
        projectUrl: String,
        technologies: [String],
        completionDate: Date,
      },
    ],
    teamCode: {
      type: String,
      required: [true, 'Team code is required'],
      unique: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    profileImage: String,
    portfolio: [
      {
        title: String,
        description: String,
        imageUrl: String,
        projectUrl: String,
      },
    ],
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

// // Method to update average rating and rating count
// teamLeaderSchema.statics.updateRating = async function (teamId) {
//   const teamLeader = await this.findById(teamId);
//   const reviews = await mongoose.model('Review').find({ team: teamId });
//   const totalRatings = reviews.reduce((acc, review) => acc + review.ratings, 0);
//   const averageRating = reviews.length > 0 ? totalRatings / reviews.length : 0;

//   teamLeader.rating.average = averageRating;
//   teamLeader.rating.count = reviews.length;
//   await teamLeader.save();
// };

// // Update rating on review save or remove
// teamLeaderSchema.post('save', async function () {
//   await this.constructor.updateRating(this._id);
// });

// teamLeaderSchema.post('remove', async function () {
//   await this.constructor.updateRating(this._id);
// });

const TeamLeader = mongoose.model('TeamLeader', teamLeaderSchema);
export default TeamLeader;
