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


const SubTask = mongoose.model('SubTask', subTaskSchema);
export default SubTask;

