import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    teamLeader: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Team must have a leader'],
    },
    logo: {
      type: String,
      default:
        'https://img.freepik.com/free-photo/rag-dolls-opposite-red-word-team-work_1156-194.jpg?semt=ais_hybrid&w=740',
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
          enum: ['teamMember', 'teamLeader'],
          default: 'teamMember',
        },
        job: String,
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
    skills: [String],
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

    // Client tasks the team is working on
    clientTasks: [
      {
        task: {
          type: mongoose.Schema.ObjectId,
          ref: 'ClientTasks',
        },
        status: {
          type: String,
          enum: ['active', 'completed'],
          default: 'active',
        },
        completionDate: Date,
      },
    ],

    // projects (showcase of team's work)
    Projects: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Projects',
      },
    ],

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
    foundedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes للأداء الأفضل
teamSchema.index({ teamLeader: 1 });
teamSchema.index({ category: 1 });
teamSchema.index({ status: 1 });

// Add methods for team member operations
teamSchema.methods.addMember = async function (userId, job) {
  this.members.push({
    user: userId,
    role: 'teamMember',
    job,
    joinedAt: Date.now(),
  });
  await this.save();
};

// Add method to update average rating
teamSchema.methods.updateAverageRating = async function () {
  const ratings = await mongoose.model('Review').find({ ratedTeam: this._id });
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

const Team = mongoose.model('Team', teamSchema);
export default Team;
