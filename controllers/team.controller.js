import asyncHandler from 'express-async-handler';
import Team from '../models/team.model.js';
import ApiError from '../utils/apiError.js';
import User from '../models/user.model.js';
import JoinRequest from '../models/JoinRequest.model.js';

// ==========================================
// Public Team Operations
// ==========================================

/**
 * @desc    Get all teams
 * @route   GET /api/v1/teams
 * @access  Public
 */
const getAllTeams = asyncHandler(async (req, res, next) => {
  const teams = await Team.find({});
  res.status(200).json({
    message: 'success',
    data: teams,
  });
});

/**
 * @desc    Get specific team by ID
 * @route   GET /api/v1/teams/:id
 * @access  Public
 */
const getSpecificTeam = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const team = await Team.findById(id).populate(
    'Projects',
    'title imageCover averageRating ratingCount'
  );
  if (!team) {
    return next(new ApiError(`There isn't a team with this id: ${id}`, 404));
  }
  res.status(200).json({
    message: 'success',
    data: team,
  });
});

// ==========================================
// Team Creation & Management
// ==========================================

/**
 * @desc    Create new team
 * @route   POST /api/v1/teams
 * @access  Private/Authenticated
 */
const createTeam = asyncHandler(async (req, res, next) => {
  // Check if user already has a team
  if (req.user.createdTeam) {
    return next(
      new ApiError(
        'You already have a team. You cannot create another one.',
        400
      )
    );
  }

  const { name, teamCode, category } = req.body;

  // Create the team with team leader in members array
  const team = await Team.create({
    teamLeader: req.user._id,
    name,
    teamCode,
    category,
    members: [
      {
        user: req.user._id,
        role: 'teamLeader',
        job: 'Team Leader',
        joinedAt: new Date(),
      },
    ],
  });

  // Update user's createdTeam field
  await User.findByIdAndUpdate(req.user._id, {
    createdTeam: team._id,
  });

  res.status(201).json({
    message: 'success',
    data: team,
  });
});

/**
 * @desc    Update logged in user's team
 * @route   PUT /api/v1/teams/my-team
 * @access  Private/Team Leader
 */
const updateMyTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({ teamLeader: req.user._id });
  if (!team) {
    return next(new ApiError('You do not have a team to update', 404));
  }

  // Fields allowed to be updated
  const allowedFields = [
    'name',
    'aboutUs',
    'status',
    'contactInfo',
    'skills',
    'socialMediaLinks',
  ];

  // Update only allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      team[key] = req.body[key];
    }
  });

  // Save the updated team
  await team.save();

  res.status(200).json({
    message: 'success',
    data: team,
  });
});

const uploadTeamImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError('please upload logo', 404));
  }

  const team = await Team.findOne({ teamLeader: req.user._id });

  if (!team) {
    return next(new ApiError('Team not found', 404));
  }

  team.logo = req.file.path;
  await team.save();

  res.status(200).json({
    message: 'success',
    data: team,
  });
});

/**
 * @desc    Delete logged in user's team
 * @route   DELETE /api/v1/teams/my-team
 * @access  Private/Team Leader
 */
const deleteMyTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findOneAndDelete({ teamLeader: req.user._id });
  if (!team) {
    return next(new ApiError('You do not have a team to delete', 404));
  }

  // Remove team reference from user's schema
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { createdTeam: 1 },
  });

  // Remove team from all users' teams array
  await User.updateMany({ teams: team._id }, { $pull: { teams: team._id } });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// ==========================================
// Team Queries
// ==========================================

/**
 * @desc    Get team where user is a team leader
 * @route   GET /api/v1/teams/my-team
 * @access  Private/Authenticated
 */
const getMyTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({ teamLeader: req.user._id }).populate(
    'Projects',
    'title imageCover averageRating ratingCount'
  );
  if (!team) {
    return next(new ApiError('You do not have a team', 404));
  }
  res.status(200).json({
    message: 'success',
    data: team,
  });
});

/**
 * @desc    Get all teams where user is a member or team leader
 * @route   GET /api/v1/teams/my-teams
 * @access  Private/Authenticated
 * @returns {
 *   status: string,
 *   data: {
 *     asLeader: Array, // Teams where user is a team leader
 *     asMember: Array  // Teams where user is a member
 *   }
 * }
 */
const getMyTeams = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // Execute both queries in parallel using Promise.all
  const [asLeader, asMember] = await Promise.all([
    Team.find({ teamLeader: userId })
      .select('_id name category')
      .populate('category', 'name'),
    Team.find({
      'members.user': userId,
      teamLeader: { $ne: userId },
    })
      .select('_id name category members')
      .populate('category', 'name'),
  ]);

  res.status(200).json({
    status: 'success',
    total: asLeader.length + asMember.length,
    data: {
      asLeader,
      asMember,
    },
  });
});

// ==========================================
// Team Members Management
// ==========================================

/**
 * @desc    Get all team members
 * @route   GET /api/v1/teams/my-team/members
 * @access  Private/Team Leader
 */
const getTeamMembers = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.user.createdTeam._id).populate(
    'members.user',
    'name profileImage'
  );

  if (!team) {
    return next(new ApiError('Team not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: team.members,
  });
});

/**
 * @desc    Update team member role
 * @route   PATCH /api/v1/teams/my-team/members/:memberId/role
 * @access  Private/Team Leader
 */
const updateTeamMemberRole = asyncHandler(async (req, res, next) => {
  const { memberId } = req.params;
  const { role } = req.body;

  const team = await Team.findById(req.user.createdTeam._id);
  if (!team) {
    return next(new ApiError('Team not found Or you didnt a team leader', 404));
  }

  const member = team.members.id(memberId);
  if (!member) {
    return next(new ApiError('Member not found', 404));
  }

  member.role = role;
  await team.save();

  res.status(200).json({
    status: 'success',
    data: team.members,
  });
});

/**
 * @desc    Remove team member
 * @route   DELETE /api/v1/teams/my-team/members/:memberId
 * @access  Private/Team Leader
 */
const removeTeamMember = asyncHandler(async (req, res, next) => {
  const { memberId } = req.params;

  const team = await Team.findById(req.user.createdTeam._id);

  if (!team) {
    return next(new ApiError('Team not found Or you didnt a team leader', 404));
  }
  // Prevent removing team leader
  const member = team.members.id(memberId);
  if (!member) {
    return next(new ApiError('Member not found', 404));
  }

  if (member.role === 'teamLeader') {
    return next(new ApiError('Cannot remove team leader', 400));
  }

  // Get user before removing from team
  const userId = member.user;

  // Remove member from team's members array
  team.members = team.members.filter(m => m._id.toString() !== memberId);
  await team.save();

  // Remove team from user's teams array
  await User.findByIdAndUpdate(userId, {
    $pull: { teams: team._id },
    role: 'client',
  });

  await JoinRequest.findByIdAndDelete(userId);

  res.status(200).json({
    message: 'success',
  });
});

// ==========================================
// Team Statistics
// ==========================================

/**
 * @desc    Get team statistics
 * @route   GET /api/v1/teams/my-team/statistics
 * @access  Private/Team Leader
 */
const getTeamStatistics = asyncHandler(async (req, res, next) => {
  // Populate createdTeam before using it
  await req.user.populate({
    path: 'createdTeam',
    select: '_id',
  });

  const team = await Team.findById(req.user.createdTeam._id);
  if (!team) {
    return next(new ApiError('Team not found', 404));
  }

  const statistics = {
    totalMembers: team.members.length,
    totalProjects: team.lastedProjects.length,
    memberRoles: {
      teamLeader: team.members.filter(m => m.role === 'teamLeader').length,
      teamMember: team.members.filter(m => m.role === 'teamMember').length,
      admin: team.members.filter(m => m.role === 'admin').length,
    },
  };

  res.status(200).json({
    status: 'success',
    data: statistics,
  });
});

// ==========================================
// Admin Operations
// ==========================================

/**
 * @desc    Delete specific team by admin
 * @route   DELETE /api/v1/teams/:id
 * @access  Private/Admin
 */
const deleteTeam = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // 1) Get team with members populated
  const team = await Team.findById(id).populate('members.user', '_id');
  if (!team) {
    return next(new ApiError(`There isn't a team with this id: ${id}`, 404));
  }

  // 2) Get all member IDs
  const memberIds = team.members.map(member => member.user._id);

  // 3) Remove team from all members' teams array
  await User.updateMany(
    { _id: { $in: memberIds } },
    { $pull: { teams: team._id } }
  );

  // 4) Remove createdTeam reference from team leader
  await User.findByIdAndUpdate(team.teamLeader, {
    $unset: { createdTeam: 1 },
  });

  // 5) Delete the team
  await Team.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    message: 'Team deleted successfully',
  });
});

// ==========================================
// Get Top Rated Teams
// ==========================================
const getTopRatedTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({
    averageRating: { $gt: 0 }, // Only teams with ratings
  })
    .select('name logo')
    .sort('-averageRating')
    .limit(10);

  res.status(200).json({
    status: 'success',
    results: teams.length,
    data: teams,
  });
});

export {
  createTeam,
  getAllTeams,
  getSpecificTeam,
  getMyTeam,
  getMyTeams,
  deleteMyTeam,
  updateMyTeam,
  uploadTeamImage,
  deleteTeam,
  updateTeamMemberRole,
  removeTeamMember,
  getTeamMembers,
  getTeamStatistics,
  getTopRatedTeams,
};
