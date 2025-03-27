import asyncHandler from 'express-async-handler';
import User from '../models/user.model.js';
import sendEmail from '../utils/sendEmail.js';
import emailTemplate from '../utils/emailTemplate.js';
import generateToken from '../utils/Token.js';

const createUser = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.create(req.body);
  sendEmail({
    email: req.body.email,
    subject: 'Test Verification Email',
    html: emailTemplate(generateToken(email)),
  });
  res.status(201).json({
    message: 'success',
    user,
  });
});

export { createUser };
