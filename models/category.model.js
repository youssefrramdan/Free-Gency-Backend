import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    image: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.id; 
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.id;
        return ret;
      },
    },
  }
);

// Virtual for services in this category
categorySchema.virtual('services', {
  ref: 'Service',
  foreignField: 'category',
  localField: '_id',
  justOne: false, // because we want an array of services
});

// Virtual for services count
categorySchema.virtual('servicesCount', {
  ref: 'Service',
  foreignField: 'category',
  localField: '_id',
  count: true,
});

// // Virtual for teams in this category
// categorySchema.virtual('teams', {
//   ref: 'Team',
//   localField: '_id',
//   foreignField: 'category',
//   options: { sort: { rating: -1 } }, // Sort by rating in descending order
// });

// // Virtual for projects in this category
// categorySchema.virtual('projects', {
//   ref: 'Project',
//   localField: '_id',
//   foreignField: 'category',
//   options: { sort: { createdAt: -1 } }, // Sort by creation date in descending order
// });

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ status: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;

//endpoints
// ----> teams assigned in this category -sort = rating
// ----> projects assigned in this category
