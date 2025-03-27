import mongoose from 'mongoose';

// endpoints ---> get all tasks for specific team member
// endpoint ---> get all tasks for project for team leader
// endpoint ---> post task for specific team member
// endpoint ----> update task status for team member ---> body {status = ""}
// endpoint ----> delete task for team member  --->(team leader)

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
    },
    project: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project'],
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Task must be assigned to a team member'],
    },
    status: {
      type: String,
      enum: ['pending','completed'],
      default: 'pending',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    deadLine: {
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
taskSchema.pre('save', async function (next) {
  const user = await mongoose.model('User').findById(this.assignedTo);
  if (!user || user.role !== 'team_member') {
    throw new Error('Assigned user must be a team member');
  }
  next();
});

// Post-save hook to update project status based on task completion
taskSchema.post('save', async function () {
  const project = await mongoose.model('Project').findById(this.project);
  const tasks = await mongoose.model('Task').find({ project: this.project });

  // Check if all tasks are completed
  const completedTasks = tasks.filter(task => task.status === 'completed');
  if (completedTasks.length === tasks.length) {
    project.status = 'completed';
    await project.save();
  }
});

const Task = mongoose.model('Task', taskSchema);
export default Task;

// const task = new Task({
//     title: 'Design homepage',
//     description: 'Create the homepage design for the project',
//     project: projectId,
//     assignedTo: teamMemberId,
//     startDate: Date.now(),
//     dueDate: new Date('2025-04-01'),
//     priority: 'high',
//   });
//   await task.save();

// task.status = 'completed';
// await task.save();

// إضافة تعليق إلى المهمة: لإضافة تعليق إلى المهمة من Team Leader أو Team Member:

// task.comments.push({
//     user: userId,  // UserId of the person adding the comment
//     text: 'Task completed successfully',
//   });
//   await task.save();
