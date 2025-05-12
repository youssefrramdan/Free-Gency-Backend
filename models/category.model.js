import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    nameAr: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    color: String,
    imageCover: String,
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

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ status: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;

//endpoints
// ----> teams assigned in this category -sort = rating
// ----> projects assigned in this category
