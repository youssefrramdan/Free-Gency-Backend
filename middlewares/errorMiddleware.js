/* eslint-disable node/no-unsupported-features/es-syntax */
import ApiError from '../utils/apiError.js';

/**
 * JWT Error Handlers
 */
const handleJwtInvalidSignature = () =>
  new ApiError('Invalid token, please login again ...', 401);

const handleJwtExpired = () =>
  new ApiError('Expired token, please login again ...', 401);

/**
 * Database Error Handlers
 */
const handleDuplicateFieldsDB = err => {
  const value = Object.values(err.keyValue)[0];
  return new ApiError(`Duplicate field value: ${value}`, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  return new ApiError(`Invalid input data: ${errors.join('. ')}`, 400);
};

/**
 * Error Response Handlers
 */
const sendErrorForDev = (err, res) =>
  res.status(400).json({
    status: err.status,
    Error: err,
    message: err.message,
    stack: err.stack,
  });

const sendErrorForProd = (err, res) =>
  res.status(400).json({
    status: err.status,
    message: err.message,
  });

/**
 * Main Error Middleware
 * Handles all errors in the application
 */
const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') err = handleJwtInvalidSignature();
  if (err.name === 'TokenExpiredError') err = handleJwtExpired();
  if (err.code === 11000) err = handleDuplicateFieldsDB(err);

  if (process.env.NODE_ENV === 'development') {
    sendErrorForDev(err, res);
  } else {
    sendErrorForProd(err, res);
  }
};

export default globalError;
