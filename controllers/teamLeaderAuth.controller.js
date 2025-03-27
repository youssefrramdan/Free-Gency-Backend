import asyncHandler from 'express-async-handler';
import TeamLeader from '../models/teamLeaderModel.js';
import generateToken from '../utils/Token.js';

const signupTeamLeader = asyncHandler(async (req, res, next) => {
  const user = await TeamLeader.create(req.body);
  user.save();
  const token = generateToken(user._id);
  res.status(201).json({
    message: 'success',
    user: {
      TeamLeader: user._id,
      teamName: user.teamName,
      email: user.email,
      teamCode: user.teamCode,
    },
    token,
  });
});
