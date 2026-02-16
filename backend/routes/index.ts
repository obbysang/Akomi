/**
 * API Routes
 * 
 * Main router that combines all route modules.
 * Maps endpoints to controller functions.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';

// Import controllers
import * as authController from '../controllers/authController';
import * as policyController from '../controllers/policyController';
import * as intentController from '../controllers/intentController';
import * as executionController from '../controllers/executionController';
import * as receiptController from '../controllers/receiptController';

const router = Router();

// ============================================
// Health Check
// ============================================

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Akomi API is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// Auth Routes (Public)
// ============================================

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/auth/register', authController.register);

/**
 * POST /api/auth/login
 * Login and get JWT token
 */
router.post('/auth/login', authController.login);

// ============================================
// Auth Routes (Protected)
// ============================================

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/auth/me', authenticate, authController.getCurrentUser);

/**
 * POST /api/auth/logout
 * Logout current user
 */
router.post('/auth/logout', authenticate, authController.logout);

// ============================================
// Policy Routes
// ============================================

/**
 * GET /api/policies
 * Get all policies for current user
 */
router.get('/policies', authenticate, policyController.getPolicies);

/**
 * POST /api/policies
 * Create a new policy
 */
router.post('/policies', authenticate, policyController.createPolicy);

/**
 * GET /api/policies/:id
 * Get a specific policy
 */
router.get('/policies/:id', authenticate, policyController.getPolicy);

/**
 * PUT /api/policies/:id
 * Update a policy
 */
router.put('/policies/:id', authenticate, policyController.updatePolicy);

/**
 * DELETE /api/policies/:id
 * Delete a policy
 */
router.delete('/policies/:id', authenticate, policyController.deletePolicy);

// ============================================
// Intent Routes
// ============================================

/**
 * GET /api/intents
 * Get intents (optionally filtered by policy_id)
 */
router.get('/intents', authenticate, intentController.getIntents);

/**
 * POST /api/intents
 * Create a new encrypted intent from a policy
 */
router.post('/intents', authenticate, intentController.createIntent);

/**
 * GET /api/intents/:id
 * Get a specific intent
 */
router.get('/intents/:id', authenticate, intentController.getIntent);

// ============================================
// Execution Routes
// ============================================

/**
 * POST /api/execute/trigger
 * Trigger condition check for an intent
 */
router.post('/execute/trigger', authenticate, executionController.triggerConditionCheck);

/**
 * POST /api/execute/:intentId
 * Execute the full renewal workflow
 */
router.post('/execute/:intentId', authenticate, executionController.executeWorkflow);

// ============================================
// Receipt Routes
// ============================================

/**
 * GET /api/receipts
 * Get all receipts for current user
 */
router.get('/receipts', authenticate, receiptController.getReceipts);

/**
 * GET /api/receipts/:id
 * Get a specific receipt
 */
router.get('/receipts/:id', authenticate, receiptController.getReceipt);

/**
 * GET /api/receipts/intent/:intentId
 * Get receipt for a specific intent
 */
router.get('/receipts/intent/:intentId', authenticate, receiptController.getReceiptByIntent);

// ============================================
// Audit Routes
// ============================================

/**
 * GET /api/audit
 * Get audit logs (placeholder - would need additional controller)
 */
router.get('/audit', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Audit endpoint - implementation pending',
    data: []
  });
});

// ============================================
// BITE Encryption Routes
// ============================================

/**
 * POST /api/encrypt
 * Encrypt a renewal intent using BITE v2
 * Internal use - requires authentication
 */
router.post('/encrypt', authenticate, async (req, res) => {
  try {
    const { encryptIntent } = await import('../services/biteService');
    const intent = req.body;
    
    const result = await encryptIntent(intent);
    
    if (result.success) {
      res.json({
        success: true,
        encryptedPayload: result.encryptedPayload
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[API] Encryption error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Encryption failed'
    });
  }
});

/**
 * POST /api/decrypt
 * Decrypt a BITE v2 encrypted payload
 * Internal use - requires authentication
 */
router.post('/decrypt', authenticate, async (req, res) => {
  try {
    const { decryptIntent } = await import('../services/biteService');
    const { encryptedPayload, conditionMet } = req.body;
    
    const result = await decryptIntent(encryptedPayload, conditionMet);
    
    if (result.success) {
      res.json({
        success: true,
        decryptedData: result.decryptedData
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[API] Decryption error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Decryption failed'
    });
  }
});

// ============================================
// SLA Metrics Routes
// ============================================

/**
 * GET /api/sla/:vendor
 * Get SLA metrics for a vendor
 * Internal use - requires authentication
 */
router.get('/sla/:vendor', authenticate, async (req, res) => {
  try {
    const { slaProvider } = await import('../integrations/slaProvider');
    const { vendor } = req.params;
    const windowDays = parseInt(req.query.window as string) || 30;
    
    const metrics = await slaProvider.fetchMetrics(vendor, windowDays);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('[API] SLA fetch error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch SLA metrics'
    });
  }
});

// ============================================
// Payment Routes
// ============================================

/**
 * POST /api/payment/execute
 * Execute a payment via x402 protocol
 * Internal use - requires authentication
 */
router.post('/payment/execute', authenticate, async (req, res) => {
  try {
    const { paymentProcessor } = await import('../integrations/paymentProcessor');
    const { intent_id, amount, merchant_address, metadata } = req.body;
    
    // Create intent object from request
    const intent = {
      id: intent_id,
      subscription: metadata?.subscription || 'Unknown',
      vendor: metadata?.vendor || merchant_address,
      maxPrice: amount,
      period: (metadata?.period as 'monthly' | 'yearly') || 'monthly',
      condition: { type: 'sla' as const, threshold: 0, windowDays: 0 },
      guardrails: { maxPrice: amount, vendorAllowlist: [], maxExecutions: 1, timeoutHours: 24 },
      expiresAt: new Date().toISOString(),
      status: 'pending' as const
    };
    
    const result = await paymentProcessor.executePayment({
      intent,
      amount,
      merchantAddress: merchant_address,
      metadata
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[API] Payment execution error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Payment execution failed'
    });
  }
});

/**
 * GET /api/payment/balance
 * Check wallet balance for payment capability
 * Internal use - requires authentication
 */
router.get('/payment/balance', authenticate, async (req, res) => {
  try {
    const { paymentProcessor } = await import('../integrations/paymentProcessor');
    const amount = parseFloat(req.query.amount as string) || 0;
    
    const result = await paymentProcessor.validatePaymentCapability(amount);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[API] Balance check error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Balance check failed'
    });
  }
});

/**
 * GET /api/payment/status/:txHash
 * Get payment status by transaction hash
 * Internal use - requires authentication
 */
router.get('/payment/status/:txHash', authenticate, async (req, res) => {
  try {
    const { paymentProcessor } = await import('../integrations/paymentProcessor');
    const { txHash } = req.params;
    
    const result = await paymentProcessor.getPaymentStatus(txHash);
    
    if (result) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
  } catch (error) {
    console.error('[API] Payment status error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment status'
    });
  }
});

export default router;
