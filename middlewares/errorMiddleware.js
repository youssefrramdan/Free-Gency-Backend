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
const sendErrorDev = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });

const sendErrorProd = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });

/**
 * Main Error Middleware
 * Handles all errors in the application
 */
const globalError = (err, req, res, next) => {
  // Set default error status and code
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  // Clone error object
  let error = { ...err };
  // Handle JWT Authentication Errors
  if (error.name === 'JsonWebTokenError') {
    error = handleJwtInvalidSignature();
  }

  if (error.name === 'TokenExpiredError') {
    error = handleJwtExpired();
  }

  // Handle Mongoose Validation Errors
  if (error.name === 'ValidationError') {
    error = handleValidationErrorDB(error);
  }

  // Handle MongoDB Duplicate Field Errors
  if (error.code === 11000) {
    error = handleDuplicateFieldsDB(error);
  }

  // Send appropriate response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

export default globalError;
