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
    teams: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'TeamLeader',
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


// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ teams: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;
