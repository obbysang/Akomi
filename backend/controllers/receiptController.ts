/**
 * Receipt Controller
 * 
 * Handles retrieval of execution receipts.
 * Provides endpoints for viewing receipts and audit trails.
 */

import { Request, Response } from 'express';
import {
  getReceiptsByUserId as dbGetReceiptsByUserId,
  getReceiptById as dbGetReceiptById,
  getReceiptByIntentId as dbGetReceiptByIntentId,
  getIntentById as dbGetIntentById,
  getPolicyById as dbGetPolicyById,
  Receipt
} from '../models/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { parseGuardrailCheck } from '../models/database';

// ============================================
// Get All Receipts
// ============================================

/**
 * GET /api/receipts
 * 
 * Returns all receipts for the authenticated user
 */
export function getReceipts(req: AuthenticatedRequest, res: Response): void {
  try {
    const receipts = dbGetReceiptsByUserId(req.user!.id);

    res.json({
      success: true,
      data: receipts.map(formatReceipt)
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipts'
    });
  }
}

// ============================================
// Get Receipt by ID
// ============================================

/**
 * GET /api/receipts/:id
 * 
 * Returns a specific receipt by ID
 */
export function getReceipt(req: AuthenticatedRequest, res: Response): void {
  try {
    const receiptId = parseInt(req.params.id, 10);
    
    if (isNaN(receiptId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid receipt ID'
      });
      return;
    }

    const receipt = dbGetReceiptById(receiptId);

    if (!receipt) {
      res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
      return;
    }

    // Get intent to check ownership
    const intent = dbGetIntentById(receipt.intent_id);
    if (!intent) {
      res.status(404).json({
        success: false,
        error: 'Intent not found'
      });
      return;
    }

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
      data: formatReceipt(receipt)
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt'
    });
  }
}

// ============================================
// Get Receipt by Intent ID
// ============================================

/**
 * GET /api/receipts/intent/:intentId
 * 
 * Returns the most recent receipt for an intent
 */
export function getReceiptByIntent(req: AuthenticatedRequest, res: Response): void {
  try {
    const intentId = parseInt(req.params.intentId, 10);
    
    if (isNaN(intentId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid intent ID'
      });
      return;
    }

    // Get intent to check ownership
    const intent = dbGetIntentById(intentId);
    if (!intent) {
      res.status(404).json({
        success: false,
        error: 'Intent not found'
      });
      return;
    }

    const policy = dbGetPolicyById(intent.policy_id);
    if (!policy || policy.user_id !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    const receipt = dbGetReceiptByIntentId(intentId);

    if (!receipt) {
      res.status(404).json({
        success: false,
        error: 'Receipt not found for this intent'
      });
      return;
    }

    res.json({
      success: true,
      data: formatReceipt(receipt)
    });
  } catch (error) {
    console.error('Get receipt by intent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt'
    });
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Formats receipt for API response
 */
function formatReceipt(receipt: Receipt) {
  return {
    id: receipt.id,
    intent_id: receipt.intent_id,
    agent_name: receipt.agent_name,
    subscription: receipt.subscription,
    condition: receipt.condition,
    condition_result: receipt.condition_result,
    executed: !!receipt.executed,
    amount: receipt.amount,
    tx_hash: receipt.tx_hash,
    reason: receipt.reason,
    guardrail_check: parseGuardrailCheck(receipt),
    timestamp: receipt.timestamp
  };
}

export default {
  getReceipts,
  getReceipt,
  getReceiptByIntent,
};
