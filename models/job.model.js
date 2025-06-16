import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    requiredSkills: [String],
    imageCover: {
      type: String,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
    },
    createdByTeam: {
      type: mongoose.Schema.ObjectId,
      ref: 'Team',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Job', jobSchema);
