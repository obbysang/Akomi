/**
 * Auth Controller
 * 
 * Handles user authentication and session management.
 * Provides endpoints for login, logout, and user info.
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { 
  createUser as dbCreateUser, 
  getUserByEmail as dbGetUserByEmail,
  getUserById as dbGetUserById
} from '../models/database';
import { generateToken } from '../middleware/auth';
import { createAuditLog } from '../models/database';
import { AuthenticatedRequest } from '../middleware/auth';

// ============================================
// Login
// ============================================

/**
 * POST /api/auth/login
 * 
 * Authenticates a user and returns a JWT token
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
      return;
    }

    // Find user
    const user = dbGetUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate token
    const token = generateToken(user);

    // Log successful login
    createAuditLog({
      user_id: user.id,
      action: 'login',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
}

// ============================================
// Register
// ============================================

/**
 * POST /api/auth/register
 * 
 * Creates a new user account
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
      return;
    }

    // Check if user exists
    const existingUser = dbGetUserByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User already exists'
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = dbCreateUser({
      email,
      password_hash: passwordHash,
      name
    });

    // Generate token
    const token = generateToken(user);

    // Log registration
    createAuditLog({
      user_id: user.id,
      action: 'register',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
}

// ============================================
// Get Current User
// ============================================

/**
 * GET /api/auth/me
 * 
 * Returns the current authenticated user
 */
export function getCurrentUser(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      created_at: req.user.created_at
    }
  });
}

// ============================================
// Logout
// ============================================

/**
 * POST /api/auth/logout
 * 
 * Logs out the current user
 */
export function logout(req: AuthenticatedRequest, res: Response): void {
  // Log logout
  if (req.user) {
    createAuditLog({
      user_id: req.user.id,
      action: 'logout',
      entity_type: 'user',
      entity_id: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}

export default {
  login,
  register,
  getCurrentUser,
  logout,
};
