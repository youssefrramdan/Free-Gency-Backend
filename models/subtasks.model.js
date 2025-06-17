import mongoose from 'mongoose';

const subTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'SubTask title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'SubTask description is required'],
    },
    task: {
      type: mongoose.Schema.ObjectId,
      ref: 'Task',
      required: [true, 'SubTask must belong to a task'],
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'SubTask must be assigned to a team member'],
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
    },
    deadline: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
        text: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to validate if task is assigned to a valid team member
subTaskSchema.pre('save', async function (next) {
  const user = await mongoose.model('User').findById(this.assignedTo);
  if (!user || user.role !== 'team_member') {
    throw new Error('Assigned user must be a team member');
  }
  next();
});


const SubTask = mongoose.model('SubTask', subTaskSchema);
export default SubTask;

