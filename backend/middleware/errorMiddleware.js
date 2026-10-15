const logger = require('../utils/logger');

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`,
    errorCode: 'NOT_FOUND',
  });
};

const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled Error at ${req.method} ${req.originalUrl}`, err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';

  // Handle Mongoose Bad ObjectId CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with id of ${err.value}`;
    errorCode = 'INVALID_ID';
  }

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value entered for field: ${field}`;
    errorCode = 'DUPLICATE_KEY';
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
    errorCode = 'VALIDATION_ERROR';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorCode = 'TOKEN_INVALID';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    // Stack trace is strictly omitted for security
  });
};

module.exports = {
  notFound,
  errorHandler,
};
