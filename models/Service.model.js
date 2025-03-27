import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

serviceSchema.virtual('projectsCount').get(function () {
  return this.projects.length;
});

// Indexes
serviceSchema.index({ name: 1 });
serviceSchema.index({ teams: 1 });
serviceSchema.index({ projects: 1 });

const Service = mongoose.model('Service', serviceSchema);
export default Service;
