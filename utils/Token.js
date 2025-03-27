import jwt from 'jsonwebtoken';

/**
 * @desc Generate JWT Token
 * @param {string} payload - User ID or any data to be encoded in the token
 * @returns {string} JWT token
 */
const generateToken = payload =>
  jwt.sign({ userId: payload }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

export default generateToken;
