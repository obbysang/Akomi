/**
 * Authentication Middleware
 * 
 * JWT-based authentication middleware for Akomi backend.
 * Handles token verification and user session management.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config';
import { getUserById, User } from '../models/database';

// Extend Express Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// ============================================
// JWT Token Functions
// ============================================

/**
 * Generates a JWT token for a user
 */
export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
  };
  
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
  });
}

/**
 * Verifies a JWT token and returns the payload
 */
export function verifyToken(token: string): { id: number; email: string } | null {
  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as { id: number; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// ============================================
// Middleware Functions
// ============================================

/**
 * Authentication middleware - verifies JWT token
 * 
 * Expects Authorization header: "Bearer <token>"
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No authorization header provided',
      });
      return;
    }
    
    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: 'Invalid authorization header format',
      });
      return;
    }
    
    const token = parts[1];
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }
    
    // Get user from database
    const user = getUserById(decoded.id);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }
    
    const token = parts[1];
    const decoded = verifyToken(token);
    
    if (decoded) {
      const user = getUserById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
}

/**
 * Admin-only middleware (placeholder for future role-based access)
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }
  
  // For now, all authenticated users are admins
  // In production, add role-based access control
  next();
}

export default {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  requireAdmin,
};
