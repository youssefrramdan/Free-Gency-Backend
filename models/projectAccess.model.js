import mongoose from 'mongoose';

const projectAccessSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Task',
      required: true,
    },
    taskId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Task',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    teamId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Team',
      required: true,
    },
    teamLeaderId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedMembers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
projectAccessSchema.index({ projectId: 1, status: 1 });
projectAccessSchema.index({ clientId: 1, status: 1 });
projectAccessSchema.index({ teamLeaderId: 1, status: 1 });

// Method to check if user has access
projectAccessSchema.methods.hasUserAccess = function (userId, userRole) {
  if (userRole === 'client' && this.clientId.toString() === userId) {
    return true;
  }

  if (userRole === 'teamLeader' && this.teamLeaderId.toString() === userId) {
    return true;
  }

  if (
    userRole === 'teamMember' &&
    this.assignedMembers.some(memberId => memberId.toString() === userId)
  ) {
    return true;
  }

  return false;
};

// Method to check if user has access
projectAccessSchema.statics.checkUserAccess = async function (
  projectId,
  userId
) {
  const access = await this.findOne({
    projectId,
    status: 'active',
    $or: [
      { clientId: userId },
      { teamLeaderId: userId },
      { assignedMembers: userId },
    ],
  });

  return !!access;
};

// Method to add assigned member
projectAccessSchema.statics.addAssignedMember = async function (
  taskId,
  memberId
) {
  return await this.findOneAndUpdate(
    { projectId: taskId, status: 'active' },
    { $addToSet: { assignedMembers: memberId } },
    { new: true }
  );
};

// Method to remove assigned member
projectAccessSchema.statics.removeAssignedMember = async function (
  taskId,
  memberId
) {
  return await this.findOneAndUpdate(
    { projectId: taskId, status: 'active' },
    { $pull: { assignedMembers: memberId } },
    { new: true }
  );
};

// Method to get authorized users
projectAccessSchema.statics.getAuthorizedUsers = async function (projectId) {
  const access = await this.findOne({ projectId, status: 'active' })
    .populate('clientId', 'name email')
    .populate('teamLeaderId', 'name email')
    .populate('assignedMembers', 'name email');

  if (!access) return [];

  return [
    access.clientId,
    access.teamLeaderId,
    ...access.assignedMembers,
  ].filter(user => user);
};

const ProjectAccess = mongoose.model('ProjectAccess', projectAccessSchema);
export default ProjectAccess;
