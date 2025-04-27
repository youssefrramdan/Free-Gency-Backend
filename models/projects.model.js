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
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ProjectsSchema.index({ team: 1 });
ProjectsSchema.index({ category: 1 });
ProjectsSchema.index({ visibility: 1 });

const Projects = mongoose.model('Projects', ProjectsSchema);
export default Projects;
