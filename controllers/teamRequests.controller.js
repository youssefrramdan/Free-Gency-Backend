// import Team from '../models/teamModel.js';
// import User from '../models/userModel.js';
// import catchAsync from '../utils/catchAsync.js';
// import AppError from '../utils/appError.js';

export const addMemberRequest = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const userId = req.user._id;
  const { message, requestType } = req.body;

  // Find the team
  const team = await Team.findById(teamId);
  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  // Check if user is already a member
  const isMember = team.members.some(member =>
    member.user.equals(userId)
  );

  if (isMember) {
    return next(new AppError('You are already a team member', 400));
  }

  // Check for existing request
  const existingRequest = team.pendingRequests.find(req =>
    req.user.equals(userId)
  );

  if (existingRequest) {
    return next(new AppError('A request from this user already exists', 400));
  }

  // Add new request
  team.pendingRequests.push({
    user: userId,
    requestedAt: new Date(),
    message: message || '',
    requestType: requestType || 'join',
    status: 'pending'
  });

  await team.save();

  res.status(201).json({
    status: 'success',
    message: 'Membership request submitted successfully',
    data: {
      request: team.pendingRequests[team.pendingRequests.length - 1]
    }
  });
});

export const getPendingRequests = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const teamLeaderId = req.user._id;

  // Find the team and verify team leader
  const team = await Team.findById(teamId)
    .populate({
      path: 'pendingRequests.user',
      select: 'name email profile' // Select specific user fields
    });

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  // Verify the requester is the team leader
  if (!team.teamLeader.equals(teamLeaderId)) {
    return next(new AppError('Only the team leader can view pending requests', 403));
  }

  // Filter and sort pending requests
  const pendingRequests = team.pendingRequests
    .filter(request => request.status === 'pending')
    .sort((a, b) => a.requestedAt - b.requestedAt);

  res.status(200).json({
    status: 'success',
    results: pendingRequests.length,
    data: {
      pendingRequests,
      totalPendingRequestsCount: pendingRequests.length
    }
  });
});

export const manageRequest = catchAsync(async (req, res, next) => {
  const { teamId, userId } = req.params;
  const teamLeaderId = req.user._id;
  const { action } = req.body;

  // Find the team
  const team = await Team.findById(teamId);
  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  // Verify the team leader
  if (!team.teamLeader.equals(teamLeaderId)) {
    return next(new AppError('Only the team leader can manage requests', 403));
  }

  // Find the request
  const requestIndex = team.pendingRequests.findIndex(req =>
    req.user.equals(userId) && req.status === 'pending'
  );

  if (requestIndex === -1) {
    return next(new AppError('No pending request found for this user', 404));
  }

  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Process the request based on action
  if (action === 'approve') {
    // Add user to team members
    team.members.push({
      user: userId,
      role: 'member',
      joinedAt: new Date()
    });

    // Update request status
    team.pendingRequests[requestIndex].status = 'reviewed';

    // Update user's team memberships
    await User.findByIdAndUpdate(userId, {
      $push: {
        teamMemberships: {
          team: team._id,
          role: 'member',
          status: 'active',
          joinedAt: new Date()
        }
      }
    });

    await team.save();

    res.status(200).json({
      status: 'success',
      message: 'Membership request approved',
      data: {
        team,
        user
      }
    });
  } else if (action === 'reject') {
    // Update request status
    team.pendingRequests[requestIndex].status = 'reviewed';
    await team.save();

    res.status(200).json({
      status: 'success',
      message: 'Membership request rejected',
      data: {
        team,
        user
      }
    });
  } else {
    return next(new AppError('Invalid action. Use "approve" or "reject"', 400));
  }
});

export const getPendingRequestsCount = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const teamLeaderId = req.user._id;

  // Find the team and verify team leader
  const team = await Team.findById(teamId);

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  // Verify the requester is the team leader
  if (!team.teamLeader.equals(teamLeaderId)) {
    return next(new AppError('Only the team leader can view pending requests count', 403));
  }

  // Count pending requests
  const pendingRequestsCount = team.pendingRequests.filter(
    request => request.status === 'pending'
  ).length;

  res.status(200).json({
    status: 'success',
    data: {
      pendingRequestsCount
    }
  });
});

// // Route definitions
// router.post('/:teamId/requests', protect, addMemberRequest);
// router.get('/:teamId/requests', protect, getPendingRequests);
// router.patch('/:teamId/requests/:userId', protect, manageRequest);
// router.get('/:teamId/requests/count', protect, getPendingRequestsCount);
