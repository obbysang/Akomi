/**
 * Execution Controller
 * 
 * Handles execution of renewal workflows.
 * Provides endpoints for triggering condition checks and executing workflows.
 */

import { Request, Response } from 'express';
import {
  getIntentById as dbGetIntentById,
  getPolicyById as dbGetPolicyById
} from '../models/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { executeRenewalWorkflow, checkCondition } from '../services/agentService';
import { createAuditLog } from '../models/database';
import { SLAMetrics } from '../../types';

// ============================================
// Trigger Execution
// ============================================

/**
 * POST /api/execute/trigger
 * 
 * Triggers condition check for an intent without full execution
 */
export async function triggerConditionCheck(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { intent_id, force_condition_pass } = req.body;

    if (!intent_id) {
      res.status(400).json({
        success: false,
        error: 'intent_id is required'
      });
      return;
    }

    // Get intent
    const intent = dbGetIntentById(intent_id);
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

    // Build options
    const options: any = {};
    
    // For testing: allow forcing condition pass/fail
    if (force_condition_pass !== undefined) {
      const threshold = policy.sla_threshold;
      options.overrideMetrics = {
        uptime: force_condition_pass ? threshold + 1 : threshold - 1,
        period: `last_${policy.sla_window_days}_days`,
        timestamp: new Date().toISOString()
      } as SLAMetrics;
    }

    // Check condition
    const result = await checkCondition(intent_id, options);

    // Log action
    createAuditLog({
      user_id: req.user!.id,
      action: 'condition_check',
      entity_type: 'intent',
      entity_id: intent_id,
      details: { passed: result.passed, metrics: result.metrics },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: {
        intent_id,
        passed: result.passed,
        metrics: result.metrics,
        reason: result.reason
      }
    });
  } catch (error) {
    console.error('Trigger condition check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check condition'
    });
  }
}

// ============================================
// Execute Workflow
// ============================================

/**
 * POST /api/execute/:intentId
 * 
 * Executes the full renewal workflow for an intent
 */
export async function executeWorkflow(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const intentId = parseInt(req.params.intentId, 10);
    const { force_condition_pass } = req.body;

    if (isNaN(intentId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid intent ID'
      });
      return;
    }

    // Get intent
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

    // Build options
    const options: any = {};
    
    // For testing: allow forcing condition pass/fail
    if (force_condition_pass !== undefined) {
      const threshold = policy.sla_threshold;
      options.overrideMetrics = {
        uptime: force_condition_pass ? threshold + 1 : threshold - 1,
        period: `last_${policy.sla_window_days}_days`,
        timestamp: new Date().toISOString()
      } as SLAMetrics;
    }

    // Execute workflow
    const result = await executeRenewalWorkflow(intentId, options);

    // Log action
    createAuditLog({
      user_id: req.user!.id,
      action: result.success ? 'execute_success' : 'execute_failure',
      entity_type: 'intent',
      entity_id: intentId,
      details: { 
        success: result.success, 
        executed: result.receipt?.executed,
        condition_result: result.receipt?.conditionResult 
      },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      success: result.success,
      data: {
        intent: result.intent,
        receipt: result.receipt,
        logs: result.logs
      }
    });
  } catch (error) {
    console.error('Execute workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute workflow'
    });
  }
}

export default {
  triggerConditionCheck,
  executeWorkflow,
};
