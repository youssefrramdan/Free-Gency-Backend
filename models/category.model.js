import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// virtual for services in category
// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ teams: 1 });
categorySchema.index({ status: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;

//endpoints
// ----> teams assigned in this category -sort = rating
// ----> projects assigned in this category

//endpoints
//
