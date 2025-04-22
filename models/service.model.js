import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Service must belong to a category'],
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
    // toJSON: {
    //   virtuals: true,
    //   transform: function (doc, ret) {
    //     delete ret.id;
    //     return ret;
    //   },
    // },
    // toObject: {
    //   virtuals: true,
    //   transform: function (doc, ret) {
    //     delete ret.id;
    //     return ret;
    //   },
    // },
  }
);

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

// Indexes
serviceSchema.index({ name: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ status: 1 });

const Service = mongoose.model('Service', serviceSchema);
export default Service;
