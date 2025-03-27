import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Service must belong to a category'],
    },
    image: {
      type: String,
      default: 'default-service.png',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for projects
serviceSchema.virtual('projects', {
  ref: 'Project',
  foreignField: 'service',
  localField: '_id',
});

// Get projects count
serviceSchema.virtual('projectsCount', {
  ref: 'Project',
  foreignField: 'service',
  localField: '_id',
  count: true,
});

// Middleware to ensure service belongs to a valid category
serviceSchema.pre('save', async function (next) {
  try {
    const Category = mongoose.model('Category');
    const categoryExists = await Category.findById(this.category);

    if (!categoryExists) {
      return next(new Error('Category not found'));
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get all services by category
serviceSchema.statics.getServicesByCategory = function (categoryId) {
  return this.find({ category: categoryId, status: 'active' }).sort({
    name: 1,
  });
};

// Indexes
serviceSchema.index({ name: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ status: 1 });

const Service = mongoose.model('Service', serviceSchema);
export default Service;
