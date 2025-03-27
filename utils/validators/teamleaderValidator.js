import { check } from 'express-validator';
import asyncHandler from 'express-async-handler';
import TeamLeader from '../../models/teamLeaderModel.js';

const createTeamLeaderValidator = [
  check('email')
    .notEmpty()
    .withMessage('Email is Required')
    .isEmail()
    .withMessage('Invalid Email Format')
    .custom(
      asyncHandler(async (value, { req }) => {
        const user = await TeamLeader.find({ email: value });
        if (user) {
          throw new Error('Email already in use');
        }
      })
    ),
];

export { createTeamLeaderValidator };
