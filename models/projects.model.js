import mongoose from 'mongoose';

const ProjectsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
    },
    budget: {
      type: String,
      required: [true, 'Project budget is required'],
    },
    imageCover: {
        type : String,
    },
    images: [String],
    projectUrl: String,
    technologies: [String],
    completionDate: {
      type: Date,
      required: [true, 'Project completion date is required'],
    },
    team: {
      type: mongoose.Schema.ObjectId,
      ref: 'Team',
      required: [true, 'Team is required'],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
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
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ProjectsSchema.index({ team: 1 });
ProjectsSchema.index({ category: 1 });
ProjectsSchema.index({ visibility: 1 });

// Add method to update average rating
ProjectsSchema.methods.updateAverageRating = async function () {
  const ratings = await mongoose
    .model('Review')
    .find({ ratedProject: this._id });
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

const Projects = mongoose.model('Projects', ProjectsSchema);
export default Projects;
