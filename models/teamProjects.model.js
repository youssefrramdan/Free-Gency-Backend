import mongoose from 'mongoose';

const teamProjectsSchema = new mongoose.Schema(
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
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
teamProjectsSchema.index({ team: 1 });
teamProjectsSchema.index({ category: 1 });
teamProjectsSchema.index({ visibility: 1 });

const TeamProjects = mongoose.model('TeamProjects', teamProjectsSchema);
export default TeamProjects;
