/**
 * Intent Controller
 * 
 * Handles operations for encrypted renewal intents.
 * Provides endpoints for creating and retrieving intents.
 */

import { Request, Response } from 'express';
import {
  getIntentsByPolicyId as dbGetIntentsByPolicyId,
  getIntentById as dbGetIntentById,
  getPolicyById as dbGetPolicyById,
  Intent
} from '../models/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { createRenewalIntent } from '../services/agentService';
import { createAuditLog } from '../models/database';

// ============================================
// Create Intent
// ============================================

/**
 * POST /api/intents
 * 
 * Creates a new encrypted renewal intent from a policy
 */
export async function createIntent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { policy_id } = req.body;

    // Validate required fields
    if (!policy_id) {
      res.status(400).json({
        success: false,
        error: 'policy_id is required'
      });
      return;
    }

    // Get policy
    const policy = dbGetPolicyById(policy_id);
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

    // Create intent
    const result = await createRenewalIntent({
      policyId: policy.id,
      subscription: policy.subscription_name,
      vendor: policy.vendor,
      maxPrice: policy.max_price,
      period: policy.period,
      slaThreshold: policy.sla_threshold,
      slaWindowDays: policy.sla_window_days,
      maxExecutions: policy.max_executions,
      timeoutHours: policy.timeout_hours
    });

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to create intent'
      });
      return;
    }

    // Log action
    createAuditLog({
      user_id: req.user!.id,
      action: 'create',
      entity_type: 'intent',
      entity_id: result.intentId,
      details: { policy_id, subscription: policy.subscription_name },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.intentId,
        policy_id: policy.id,
        encrypted_payload: result.encryptedPayload,
        status: 'pending',
        created_at: new Date().toISOString()
      },
      logs: result.logs
    });
  } catch (error) {
    console.error('Create intent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create intent'
    });
  }
}

// ============================================
// Get Intents by Policy
// ============================================

/**
 * GET /api/intents?policy_id=:id
 * 
 * Returns all intents for a specific policy
 */
export function getIntents(req: AuthenticatedRequest, res: Response): void {
  try {
    const policyId = req.query.policy_id ? parseInt(req.query.policy_id as string, 10) : null;

    if (policyId) {
      // Get specific policy's intents
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

      const intents = dbGetIntentsByPolicyId(policyId);
      res.json({
        success: true,
        data: intents.map(formatIntent)
      });
    } else {
      // Get all intents for user's policies
      // This would require a more complex query - for now return empty
      res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('Get intents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch intents'
    });
  }
}

// ============================================
// Get Intent by ID
// ============================================

/**
 * GET /api/intents/:id
 * 
 * Returns a specific intent by ID
 */
export function getIntent(req: AuthenticatedRequest, res: Response): void {
  try {
    const intentId = parseInt(req.params.id, 10);
    
    if (isNaN(intentId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid intent ID'
      });
      return;
    }

    const intent = dbGetIntentById(intentId);

    if (!intent) {
      res.status(404).json({
        success: false,
        error: 'Intent not found'
      });
      return;
    }

    // Get policy to check ownership
    const policy = dbGetPolicyById(intent.policy_id);
    if (!policy || policy.user_id !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: formatIntent(intent)
    });
  } catch (error) {
    console.error('Get intent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch intent'
    });
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Formats intent for API response
 * Note: Encrypted payload is returned as-is, not decrypted
 */
function formatIntent(intent: Intent) {
  return {
    id: intent.id,
    policy_id: intent.policy_id,
    // Return first 50 chars of encrypted payload for display
    encrypted_payload_preview: intent.encrypted_payload.substring(0, 50) + '...',
    status: intent.status,
    expires_at: intent.expires_at,
    executed_at: intent.executed_at,
    created_at: intent.created_at
  };
}

export default {
  createIntent,
  getIntents,
  getIntent,
};
