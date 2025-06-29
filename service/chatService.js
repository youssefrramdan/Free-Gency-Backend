import ProjectAccess from '../models/projectAccess.model.js';
import Team from '../models/team.model.js';

/**
 * Create project access when a project is created or team is assigned
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID (optional)
 * @param {string} clientId - Client user ID
 * @param {string} teamId - Team ID
 * @returns {Promise<Object>} Created project access
 */
const createProjectAccess = async (
  projectId,
  clientId,
  teamId,
  taskId = null
) => {
  try {
    // Check if project access already exists
    const existingAccess = await ProjectAccess.findOne({ projectId });
    if (existingAccess) {
      console.log(`Project access already exists for project ${projectId}`);
      return existingAccess;
    }

    // Get team details to extract team leader and members
    const team = await Team.findById(teamId)
      .populate('teamLeader', '_id')
      .populate('members.user', '_id role');

    if (!team) {
      throw new Error('Team not found');
    }

    // Extract team member IDs (excluding team leader)
    const teamMembers = team.members
      .filter(member => member.role === 'teamMember')
      .map(member => member.user._id);

    // Create project access
    const projectAccess = new ProjectAccess({
      projectId,
      taskId,
      clientId,
      teamId,
      teamLeaderId: team.teamLeader._id,
      teamMembers,
      status: 'active',
    });

    await projectAccess.save();
    console.log(`Project access created for project ${projectId}`);
    return projectAccess;
  } catch (error) {
    console.error('Error creating project access:', error);
    throw error;
  }
};

/**
 * Update project access when team members change
 * @param {string} teamId - Team ID
 * @returns {Promise<void>}
 */
const updateProjectAccessForTeam = async teamId => {
  try {
    // Get updated team details
    const team = await Team.findById(teamId)
      .populate('teamLeader', '_id')
      .populate('members.user', '_id role');

    if (!team) {
      throw new Error('Team not found');
    }

    // Extract team member IDs (excluding team leader)
    const teamMembers = team.members
      .filter(member => member.role === 'teamMember')
      .map(member => member.user._id);

    // Update all project access records for this team
    await ProjectAccess.updateMany(
      { teamId },
      {
        teamLeaderId: team.teamLeader._id,
        teamMembers,
      }
    );

    console.log(`Project access updated for team ${teamId}`);
  } catch (error) {
    console.error('Error updating project access for team:', error);
    throw error;
  }
};

/**
 * Remove project access when project is completed or deleted
 * @param {string} projectId - Project ID
 * @returns {Promise<void>}
 */
const removeProjectAccess = async projectId => {
  try {
    await ProjectAccess.findOneAndDelete({ projectId });
    console.log(`Project access removed for project ${projectId}`);
  } catch (error) {
    console.error('Error removing project access:', error);
    throw error;
  }
};

/**
 * Update project access status
 * @param {string} projectId - Project ID
 * @param {string} status - New status (active, completed, paused)
 * @returns {Promise<void>}
 */
const updateProjectAccessStatus = async (projectId, status) => {
  try {
    await ProjectAccess.findOneAndUpdate(
      { projectId },
      { status },
      { new: true }
    );
    console.log(
      `Project access status updated to ${status} for project ${projectId}`
    );
  } catch (error) {
    console.error('Error updating project access status:', error);
    throw error;
  }
};

/**
 * Get all users with access to a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Array of user IDs
 */
const getProjectParticipants = async projectId => {
  try {
    const projectAccess = await ProjectAccess.findOne({ projectId });
    if (!projectAccess) {
      return [];
    }

    return [
      projectAccess.clientId,
      projectAccess.teamLeaderId,
      ...projectAccess.teamMembers,
    ].filter(id => id);
  } catch (error) {
    console.error('Error getting project participants:', error);
    throw error;
  }
};

/**
 * Create project access when a project is created or team is assigned
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID (optional)
 * @param {string} clientId - Client user ID
 * @param {string} teamId - Team ID
 * @param {string} teamLeaderId - Team leader ID
 * @returns {Promise<Object>} Created project access
 */
const createProjectAccessNew = async ({
  projectId,
  taskId,
  clientId,
  teamId,
  teamLeaderId,
}) => {
  try {
    const existingAccess = await ProjectAccess.findOne({ projectId });
    if (existingAccess) {
      return existingAccess;
    }

    const projectAccess = await ProjectAccess.create({
      projectId,
      taskId,
      clientId,
      teamId,
      teamLeaderId,
      assignedMembers: [], // فارغ في البداية
      status: 'active',
    });

    return projectAccess;
  } catch (error) {
    console.error('Error creating project access:', error);
    throw error;
  }
};

/**
 * Add member to chat when a subtask is assigned
 * @param {string} taskId - Task ID
 * @param {string} memberId - Member ID
 * @returns {Promise<Object>} Updated project access
 */
const addMemberToChat = async (taskId, memberId) => {
  try {
    const updatedAccess = await ProjectAccess.addAssignedMember(
      taskId,
      memberId
    );
    if (updatedAccess) {
      console.log(`Member ${memberId} added to chat for task ${taskId}`);
    }
    return updatedAccess;
  } catch (error) {
    console.error('Error adding member to chat:', error);
    throw error;
  }
};

/**
 * Remove member from chat when a subtask is unassigned
 * @param {string} taskId - Task ID
 * @param {string} memberId - Member ID
 * @returns {Promise<Object>} Updated project access
 */
const removeMemberFromChat = async (taskId, memberId) => {
  try {
    const updatedAccess = await ProjectAccess.removeAssignedMember(
      taskId,
      memberId
    );
    if (updatedAccess) {
      console.log(`Member ${memberId} removed from chat for task ${taskId}`);
    }
    return updatedAccess;
  } catch (error) {
    console.error('Error removing member from chat:', error);
    throw error;
  }
};

/**
 * Sync assigned members based on existing subtasks
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Updated project access
 */
const syncAssignedMembers = async taskId => {
  try {
    const SubTask = (await import('../models/subtasks.model.js')).default;

    // Get all subtasks for the task and their assigned members
    const subtasks = await SubTask.find({ task: taskId }).populate(
      'assignedTo',
      '_id'
    );
    const assignedMemberIds = subtasks.map(subtask => subtask.assignedTo._id);

    // Update project access
    const updatedAccess = await ProjectAccess.findOneAndUpdate(
      { projectId: taskId, status: 'active' },
      { assignedMembers: assignedMemberIds },
      { new: true }
    );

    console.log(
      `Synced assigned members for task ${taskId}: ${assignedMemberIds.length} members`
    );
    return updatedAccess;
  } catch (error) {
    console.error('Error syncing assigned members:', error);
    throw error;
  }
};

/**
 * Remove project access when project is completed or deleted
 * @param {string} projectId - Project ID
 * @returns {Promise<void>}
 */
const removeProjectAccessCompleted = async projectId => {
  try {
    const result = await ProjectAccess.findOneAndUpdate(
      { projectId },
      { status: 'completed' },
      { new: true }
    );
    console.log(`Project access completed for project ${projectId}`);
    return result;
  } catch (error) {
    console.error('Error removing project access:', error);
    throw error;
  }
};

/**
 * Check user access to a project
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user has access, false otherwise
 */
const checkUserAccess = async (projectId, userId) => {
  try {
    return await ProjectAccess.checkUserAccess(projectId, userId);
  } catch (error) {
    console.error('Error checking user access:', error);
    return false;
  }
};

/**
 * Get authorized users for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Array of user IDs
 */
const getAuthorizedUsers = async projectId => {
  try {
    return await ProjectAccess.getAuthorizedUsers(projectId);
  } catch (error) {
    console.error('Error getting authorized users:', error);
    return [];
  }
};

const chatService = {
  // إنشاء Project Access جديد (بداية المشروع - كلايت + تيم ليدر بس)
  async createProjectAccess({
    projectId,
    taskId,
    clientId,
    teamId,
    teamLeaderId,
  }) {
    try {
      const existingAccess = await ProjectAccess.findOne({ projectId });
      if (existingAccess) {
        console.log(`Project access already exists for project ${projectId}`);
        return existingAccess;
      }

      const projectAccess = await ProjectAccess.create({
        projectId,
        taskId,
        clientId,
        teamId,
        teamLeaderId,
        assignedMembers: [], // فارغ في البداية - سيتم إضافة الأعضاء عند assign subtasks
        status: 'active',
      });

      console.log(`Project access created for project ${projectId}`);
      return projectAccess;
    } catch (error) {
      console.error('Error creating project access:', error);
      throw error;
    }
  },

  // إضافة عضو للشات عند assign subtask له
  async addMemberToChat(taskId, memberId) {
    try {
      const updatedAccess = await ProjectAccess.addAssignedMember(
        taskId,
        memberId
      );
      if (updatedAccess) {
        console.log(`Member ${memberId} added to chat for task ${taskId}`);
      }
      return updatedAccess;
    } catch (error) {
      console.error('Error adding member to chat:', error);
      throw error;
    }
  },

  // إزالة عضو من الشات عند إلغاء assign أو حذف subtask
  async removeMemberFromChat(taskId, memberId) {
    try {
      const updatedAccess = await ProjectAccess.removeAssignedMember(
        taskId,
        memberId
      );
      if (updatedAccess) {
        console.log(`Member ${memberId} removed from chat for task ${taskId}`);
      }
      return updatedAccess;
    } catch (error) {
      console.error('Error removing member from chat:', error);
      throw error;
    }
  },

  // تحديث الأعضاء المُعيَّنين بناءً على الـ subtasks الموجودة
  async syncAssignedMembers(taskId) {
    try {
      const SubTask = (await import('../models/subtasks.model.js')).default;

      // جلب جميع الـ subtasks للمهمة وأعضائها المُعيَّنين
      const subtasks = await SubTask.find({ task: taskId }).populate(
        'assignedTo',
        '_id'
      );
      const assignedMemberIds = [
        ...new Set(subtasks.map(subtask => subtask.assignedTo._id.toString())),
      ];

      // تحديث الـ Project Access
      const updatedAccess = await ProjectAccess.findOneAndUpdate(
        { projectId: taskId, status: 'active' },
        { assignedMembers: assignedMemberIds },
        { new: true }
      );

      console.log(
        `Synced assigned members for task ${taskId}: ${assignedMemberIds.length} members`
      );
      return updatedAccess;
    } catch (error) {
      console.error('Error syncing assigned members:', error);
      throw error;
    }
  },

  // إزالة Project Access (إنهاء المشروع)
  async removeProjectAccess(projectId) {
    try {
      const result = await ProjectAccess.findOneAndUpdate(
        { projectId },
        { status: 'completed' },
        { new: true }
      );
      console.log(`Project access completed for project ${projectId}`);
      return result;
    } catch (error) {
      console.error('Error removing project access:', error);
      throw error;
    }
  },

  // تحديث حالة Project Access
  async updateProjectAccessStatus(projectId, status) {
    try {
      const result = await ProjectAccess.findOneAndUpdate(
        { projectId },
        { status },
        { new: true }
      );
      console.log(
        `Project access status updated to ${status} for project ${projectId}`
      );
      return result;
    } catch (error) {
      console.error('Error updating project access status:', error);
      throw error;
    }
  },

  // التحقق من صلاحية المستخدم
  async checkUserAccess(projectId, userId) {
    try {
      return await ProjectAccess.checkUserAccess(projectId, userId);
    } catch (error) {
      console.error('Error checking user access:', error);
      return false;
    }
  },

  // جلب المستخدمين المصرح لهم
  async getAuthorizedUsers(projectId) {
    try {
      return await ProjectAccess.getAuthorizedUsers(projectId);
    } catch (error) {
      console.error('Error getting authorized users:', error);
      return [];
    }
  },

  // جلب جميع participants المشروع (للـ Socket.IO rooms)
  async getProjectParticipants(projectId) {
    try {
      const projectAccess = await ProjectAccess.findOne({
        projectId,
        status: 'active',
      });

      if (!projectAccess) {
        return [];
      }

      return [
        projectAccess.clientId,
        projectAccess.teamLeaderId,
        ...projectAccess.assignedMembers,
      ].filter(id => id);
    } catch (error) {
      console.error('Error getting project participants:', error);
      return [];
    }
  },
};

export default chatService;
