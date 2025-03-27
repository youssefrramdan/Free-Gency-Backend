import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: 'default-category.png',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    teams: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Team',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual fields
categorySchema.virtual('teamsCount').get(function () {
  return this.teams.length;
});

// Virtual populate for services
categorySchema.virtual('services', {
  ref: 'Service',
  foreignField: 'category',
  localField: '_id',
});

// Get services count
categorySchema.virtual('servicesCount', {
  ref: 'Service',
  foreignField: 'category',
  localField: '_id',
  count: true,
});

// Static method to get active categories
categorySchema.statics.getActiveCategories = function () {
  return this.find({ status: 'active' }).sort({ name: 1 });
};

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ teams: 1 });
categorySchema.index({ status: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;
