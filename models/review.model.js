import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    review: {
      type: String,
      maxlength: [500, 'Review cannot be more than 500 characters'],
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must be created by a user'],
    },
    ratedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ratedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Projects',
    },
    ratedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
  },
  {
    timestamps: true,
  }
);

// Validate that only one type of review is provided
reviewSchema.pre('validate', function (next) {
  const reviewTypes = [
    this.ratedUser,
    this.ratedProject,
    this.ratedTeam,
  ].filter(Boolean);
  if (reviewTypes.length !== 1) {
    this.invalidate(
      'review',
      'Review must be for either a user, project, or team, but not multiple'
    );
  }
  next();
});

// Create indexes for performance
reviewSchema.index({ ratedUser: 1 });
reviewSchema.index({ ratedProject: 1 });
reviewSchema.index({ ratedTeam: 1 });
reviewSchema.index({ ratedBy: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
