/**
 * Error Handling Middleware
 * 
 * Centralized error handling for Akomi backend.
 * Catches and formats all errors in a consistent manner.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logging';

// ============================================
// Custom Error Classes
// ============================================

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

// ============================================
// Error Handler Middleware
// ============================================

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: err.message,
      statusCode: 400,
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      statusCode: 401,
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      statusCode: 401,
    });
    return;
  }

  // Handle database errors
  if (err.message?.includes('SQLITE_CONSTRAINT')) {
    res.status(409).json({
      success: false,
      error: 'Database constraint violation',
      statusCode: 409,
    });
    return;
  }

  // Handle all other errors (500 Internal Server Error)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    statusCode: 500,
  });
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(
  req: Request,
  res: Response
): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  });
}

/**
 * Async handler wrapper to catch errors automatically
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
