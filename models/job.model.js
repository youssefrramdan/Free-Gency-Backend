import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    descriptionc: {
      type: String,
      required: true,
    },
    type: {
      type: String,
    },
    location: {
      type: String,
    },
    requiredSkills: [String],
    imageCover: {
      type: String,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Job', jobSchema);
