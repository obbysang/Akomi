/**
 * Policy Controller
 * 
 * Handles CRUD operations for renewal policies.
 * Provides endpoints for creating, reading, updating, and deleting policies.
 */

import { Request, Response } from 'express';
import {
  createPolicy as dbCreatePolicy,
  getPolicyById as dbGetPolicyById,
  getPoliciesByUserId as dbGetPoliciesByUserId,
  updatePolicy as dbUpdatePolicy,
  deletePolicy as dbDeletePolicy,
  Policy
} from '../models/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog, parseVendorAllowlist } from '../models/database';

// ============================================
// Create Policy
// ============================================

/**
 * POST /api/policies
 * 
 * Creates a new renewal policy
 */
export async function createPolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      subscription_name,
      vendor,
      max_price,
      period,
      sla_threshold,
      sla_window_days,
      vendor_allowlist,
      max_executions,
      timeout_hours
    } = req.body;

    // Validate required fields
    if (!subscription_name || !vendor || !max_price || !period || !sla_threshold) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: subscription_name, vendor, max_price, period, sla_threshold'
      });
      return;
    }

    // Validate period
    if (!['monthly', 'yearly'].includes(period)) {
      res.status(400).json({
        success: false,
        error: 'Period must be "monthly" or "yearly"'
      });
      return;
    }

    // Create policy
    const policy = dbCreatePolicy({
      user_id: req.user!.id,
      subscription_name,
      vendor,
      max_price,
      period,
      sla_threshold,
      sla_window_days: sla_window_days || 30,
      vendor_allowlist,
      max_executions: max_executions || 1,
      timeout_hours: timeout_hours || 24
    });

    // Log action
    createAuditLog({
      user_id: req.user!.id,
      action: 'create',
      entity_type: 'policy',
      entity_id: policy.id,
      details: { subscription_name, vendor },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      data: formatPolicy(policy)
    });
  } catch (error) {
    console.error('Create policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create policy'
    });
  }
}

// ============================================
// Get All Policies
// ============================================

/**
 * GET /api/policies
 * 
 * Returns all policies for the authenticated user
 */
export function getPolicies(req: AuthenticatedRequest, res: Response): void {
  try {
    const policies = dbGetPoliciesByUserId(req.user!.id);

    res.json({
      success: true,
      data: policies.map(formatPolicy)
    });
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policies'
    });
  }
}

// ============================================
// Get Policy by ID
// ============================================

/**
 * GET /api/policies/:id
 * 
 * Returns a specific policy by ID
 */
export function getPolicy(req: AuthenticatedRequest, res: Response): void {
  try {
    const policyId = parseInt(req.params.id, 10);
    
    if (isNaN(policyId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid policy ID'
      });
      return;
    }

    const policy = dbGetPolicyById(policyId);

    if (!policy) {
      res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
      return;
    }

    // Check ownership
    if (policy.user_id !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: formatPolicy(policy)
    });
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policy'
    });
  }
}

// ============================================
// Update Policy
// ============================================

/**
 * PUT /api/policies/:id
 * 
 * Updates an existing policy
 */
export function updatePolicy(req: AuthenticatedRequest, res: Response): void {
  try {
    const policyId = parseInt(req.params.id, 10);
    
    if (isNaN(policyId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid policy ID'
      });
      return;
    }

    const existingPolicy = dbGetPolicyById(policyId);

    if (!existingPolicy) {
      res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
      return;
    }

    // Check ownership
    if (existingPolicy.user_id !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    const {
      subscription_name,
      vendor,
      max_price,
      period,
      sla_threshold,
      sla_window_days,
      vendor_allowlist,
      max_executions,
      timeout_hours,
      status
    } = req.body;

    // Update policy
    const updatedPolicy = dbUpdatePolicy(policyId, {
      subscription_name,
      vendor,
      max_price,
      period,
      sla_threshold,
      sla_window_days,
      vendor_allowlist,
      max_executions,
      timeout_hours,
      status
    });

    // Log action
    createAuditLog({
      user_id: req.user!.id,
      action: 'update',
      entity_type: 'policy',
      entity_id: policyId,
      details: req.body,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: formatPolicy(updatedPolicy!)
    });
  } catch (error) {
    console.error('Update policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update policy'
    });
  }
}

// ============================================
// Delete Policy
// ============================================

/**
 * DELETE /api/policies/:id
 * 
 * Deletes a policy
 */
export function deletePolicy(req: AuthenticatedRequest, res: Response): void {
  try {
    const policyId = parseInt(req.params.id, 10);
    
    if (isNaN(policyId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid policy ID'
      });
      return;
    }

    const existingPolicy = dbGetPolicyById(policyId);

    if (!existingPolicy) {
      res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
      return;
    }

    // Check ownership
    if (existingPolicy.user_id !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    // Delete policy
    const deleted = dbDeletePolicy(policyId);

    if (deleted) {
      // Log action
      createAuditLog({
        user_id: req.user!.id,
        action: 'delete',
        entity_type: 'policy',
        entity_id: policyId,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });

      res.json({
        success: true,
        message: 'Policy deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete policy'
      });
    }
  } catch (error) {
    console.error('Delete policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete policy'
    });
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Formats policy for API response
 */
function formatPolicy(policy: Policy) {
  return {
    id: policy.id,
    user_id: policy.user_id,
    subscription_name: policy.subscription_name,
    vendor: policy.vendor,
    max_price: policy.max_price,
    period: policy.period,
    sla_threshold: policy.sla_threshold,
    sla_window_days: policy.sla_window_days,
    vendor_allowlist: parseVendorAllowlist(policy),
    max_executions: policy.max_executions,
    timeout_hours: policy.timeout_hours,
    status: policy.status,
    created_at: policy.created_at,
    updated_at: policy.updated_at
  };
}

export default {
  createPolicy,
  getPolicies,
  getPolicy,
  updatePolicy,
  deletePolicy,
};
