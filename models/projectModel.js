import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
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
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Project category is required'],
    },
    budget: {
      type: Number,
      required: [true, 'Project budget is required'],
    },
    requiredSkills: {
      type: String,
      required: [true, 'Required skills are required'],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Project deadline is required'],
    },
    client: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Project must belong to a client'],
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed'],
      default: 'open',
    },
    assignedTeam: {
      type: mongoose.Schema.ObjectId,
      ref: 'TeamLeader',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ category: 1 });

// Virtual populate for team requests
projectSchema.virtual('teamRequests', {
  ref: 'TeamProjectRequest',
  localField: '_id',
  foreignField: 'project',
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
