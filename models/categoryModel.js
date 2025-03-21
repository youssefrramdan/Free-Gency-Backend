import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);
export default Category;
