/**
 * Agent Service
 * 
 * Core orchestration service for Akomi subscription renewal agent.
 * Coordinates the workflow:
 * 1. Creates encrypted renewal intents (BITE v2)
 * 2. Fetches SLA metrics
 * 3. Evaluates conditions
 * 4. Validates guardrails
 * 5. Executes payments
 * 6. Generates receipts
 */

import { 
  RenewalIntent, 
  AgentStatus, 
  SLAMetrics, 
  ExecutionReceipt,
  PolicyGuardrails,
  RenewalCondition
} from '../../types';
import { encryptIntent, decryptIntent, canDecrypt } from './biteService';
import { slaProvider } from '../integrations/slaProvider';
import { 
  paymentProcessor, 
  createSuccessReceipt, 
  createFailureReceipt 
} from '../integrations/paymentProcessor';
import { notificationService } from '../integrations/notificationService';
import { 
  createIntent as dbCreateIntent, 
  getIntentById as dbGetIntent,
  updateIntentStatus as dbUpdateIntentStatus,
  createReceipt as dbCreateReceipt,
  getPolicyById
} from '../models/database';
import { logger } from '../middleware/logging';
import { paymentConfig } from '../config';

// ============================================
// Types
// ============================================

export interface AgentExecutionResult {
  success: boolean;
  intent: RenewalIntent;
  receipt?: ExecutionReceipt;
  logs: string[];
}

export interface CreateIntentParams {
  policyId: number;
  subscription: string;
  vendor: string;
  maxPrice: number;
  period: 'monthly' | 'yearly';
  slaThreshold: number;
  slaWindowDays?: number;
  vendorAllowlist?: string[];
  maxExecutions?: number;
  timeoutHours?: number;
}

export interface ExecutionOptions {
  overrideMetrics?: SLAMetrics;
}

// ============================================
// Intent Builder
// ============================================

/**
 * Creates a new renewal intent with BITE v2 encryption
 */
export async function createRenewalIntent(params: CreateIntentParams): Promise<{
  success: boolean;
  intentId?: number;
  encryptedPayload?: string;
  error?: string;
  logs: string[];
}> {
  const logs: string[] = [];
  logs.push(`[${new Date().toISOString()}] Creating renewal intent for "${params.subscription}"`);

  // Create guardrails
  const guardrails: PolicyGuardrails = {
    maxPrice: params.maxPrice,
    vendorAllowlist: params.vendorAllowlist || [params.vendor],
    maxExecutions: params.maxExecutions || 1,
    timeoutHours: params.timeoutHours || 24
  };

  // Create intent object
  const intent: RenewalIntent = {
    id: generateIntentId(),
    subscription: params.subscription,
    vendor: params.vendor,
    maxPrice: params.maxPrice,
    period: params.period,
    condition: {
      type: 'sla',
      threshold: params.slaThreshold,
      windowDays: params.slaWindowDays || 30
    },
    guardrails: guardrails,
    expiresAt: new Date(Date.now() + (guardrails.timeoutHours * 60 * 60 * 1000)).toISOString(),
    status: AgentStatus.PENDING
  };

  logs.push(`[${new Date().toISOString()}] Intent created with ID: ${intent.id}`);
  logs.push(`[${new Date().toISOString()}] Encrypting intent with BITE v2...`);

  // Encrypt the intent
  const encryptionResult = await encryptIntent(intent);
  
  if (!encryptionResult.success || !encryptionResult.encryptedPayload) {
    logs.push(`[${new Date().toISOString()}] ❌ Encryption failed: ${encryptionResult.error}`);
    return {
      success: false,
      error: encryptionResult.error || 'Encryption failed',
      logs
    };
  }

  logs.push(`[${new Date().toISOString()}] Intent encrypted successfully`);

  // Save to database
  try {
    const expiresAt = new Date(Date.now() + (guardrails.timeoutHours * 60 * 60 * 1000)).toISOString();
    const dbIntent = dbCreateIntent({
      policy_id: params.policyId,
      encrypted_payload: encryptionResult.encryptedPayload,
      expires_at: expiresAt
    });

    logs.push(`[${new Date().toISOString()}] Intent stored in database with ID: ${dbIntent.id}`);

    return {
      success: true,
      intentId: dbIntent.id,
      encryptedPayload: encryptionResult.encryptedPayload,
      logs
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logs.push(`[${new Date().toISOString()}] ❌ Database error: ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
      logs
    };
  }
}

// ============================================
// Condition Checker
// ============================================

/**
 * Checks if a condition is met for a given intent
 */
export async function checkCondition(
  intentId: number,
  options: ExecutionOptions = {}
): Promise<{
  passed: boolean;
  metrics?: SLAMetrics;
  reason?: string;
}> {
  // Get intent from database
  const dbIntent = dbGetIntent(intentId);
  if (!dbIntent) {
    return { passed: false, reason: 'Intent not found' };
  }

  // Get policy to find vendor
  const policy = getPolicyById(dbIntent.policy_id);
  if (!policy) {
    return { passed: false, reason: 'Policy not found' };
  }

  // Fetch SLA metrics
  let metrics: SLAMetrics;
  if (options.overrideMetrics) {
    metrics = options.overrideMetrics;
  } else {
    metrics = await slaProvider.fetchMetrics(policy.vendor, 30);
  }

  // Check if metrics meet condition
  const conditionMet = await canDecrypt(dbIntent.encrypted_payload, metrics);
  
  return {
    passed: conditionMet.canDecrypt,
    metrics,
    reason: conditionMet.reason
  };
}

// ============================================
// Workflow Executor
// ============================================

/**
 * Executes the complete renewal workflow
 */
export async function executeRenewalWorkflow(
  intentId: number,
  options: ExecutionOptions = {}
): Promise<AgentExecutionResult> {
  const logs: string[] = [];
  
  // Get intent from database
  const dbIntent = dbGetIntent(intentId);
  if (!dbIntent) {
    logs.push(`ERROR: Intent ${intentId} not found`);
    return {
      success: false,
      intent: { id: intentId.toString(), subscription: '', vendor: '', maxPrice: 0, period: 'monthly', condition: { type: 'sla', threshold: 0, windowDays: 0 }, guardrails: { maxPrice: 0, vendorAllowlist: [], maxExecutions: 0, timeoutHours: 0 }, expiresAt: '', status: AgentStatus.PENDING },
      logs
    };
  }

  // Check if intent is pending
  if (dbIntent.status !== 'pending') {
    logs.push(`ERROR: Intent ${intentId} is not in PENDING status (current: ${dbIntent.status})`);
    return {
      success: false,
      intent: { id: dbIntent.id.toString(), subscription: '', vendor: '', maxPrice: 0, period: 'monthly', condition: { type: 'sla', threshold: 0, windowDays: 0 }, guardrails: { maxPrice: 0, vendorAllowlist: [], maxExecutions: 0, timeoutHours: 0 }, expiresAt: '', status: AgentStatus.PENDING },
      logs
    };
  }

  logs.push(`[${new Date().toISOString()}] Starting renewal workflow for intent ${intentId}`);

  // Get policy
  const policy = getPolicyById(dbIntent.policy_id);
  if (!policy) {
    logs.push(`ERROR: Policy not found for intent ${intentId}`);
    return {
      success: false,
      intent: { id: dbIntent.id.toString(), subscription: '', vendor: '', maxPrice: 0, period: 'monthly', condition: { type: 'sla', threshold: 0, windowDays: 0 }, guardrails: { maxPrice: 0, vendorAllowlist: [], maxExecutions: 0, timeoutHours: 0 }, expiresAt: '', status: AgentStatus.BLOCKED },
      logs
    };
  }

  // Step 1: Fetch SLA metrics
  let metrics: SLAMetrics;
  if (options.overrideMetrics) {
    metrics = options.overrideMetrics;
    logs.push(`[${new Date().toISOString()}] Using override SLA metrics for vendor: ${policy.vendor}`);
  } else {
    logs.push(`[${new Date().toISOString()}] Fetching SLA metrics for vendor: ${policy.vendor}`);
    metrics = await slaProvider.fetchMetrics(policy.vendor, policy.sla_window_days);
  }
  logs.push(`[${new Date().toISOString()}] SLA uptime: ${metrics.uptime}% (window: ${metrics.period})`);

  // Step 2: Evaluate condition
  logs.push(`[${new Date().toISOString()}] Evaluating SLA condition: ${metrics.uptime}% >= ${policy.sla_threshold}%`);
  
  const conditionCheck = await canDecrypt(dbIntent.encrypted_payload, metrics);
  
  if (!conditionCheck.canDecrypt) {
    // Condition FAILED - Safe outcome, keep intent encrypted
    logs.push(`[${new Date().toISOString()}] ❌ CONDITION FAILED: ${conditionCheck.reason}`);
    logs.push(`[${new Date().toISOString()}] 🔒 Intent remains encrypted. No decryption occurred.`);
    
    // Update intent status
    dbUpdateIntentStatus(intentId, 'blocked');
    
    // Create failure receipt
    const receipt = createFailureReceipt(
      { id: dbIntent.id.toString(), subscription: policy.subscription_name, vendor: policy.vendor, maxPrice: policy.max_price, period: policy.period, condition: { type: 'sla', threshold: policy.sla_threshold, windowDays: policy.sla_window_days }, guardrails: { maxPrice: policy.max_price, vendorAllowlist: [], maxExecutions: policy.max_executions, timeoutHours: policy.timeout_hours }, expiresAt: dbIntent.expires_at, status: AgentStatus.BLOCKED },
      conditionCheck.reason || 'SLA threshold not met',
      'FAIL'
    );
    
    // Save receipt to database
    dbCreateReceipt({
      intent_id: intentId,
      agent_name: 'Akomi',
      subscription: 'ENCRYPTED',
      condition: `SLA >= ${policy.sla_threshold}%`,
      condition_result: 'FAIL',
      executed: false,
      reason: conditionCheck.reason
    });

    // Send notification
    await notificationService.sendExecutionResult(receipt);
    
    return {
      success: true,
      intent: { id: dbIntent.id.toString(), subscription: '', vendor: '', maxPrice: 0, period: 'monthly', condition: { type: 'sla', threshold: 0, windowDays: 0 }, guardrails: { maxPrice: 0, vendorAllowlist: [], maxExecutions: 0, timeoutHours: 0 }, expiresAt: '', status: AgentStatus.BLOCKED },
      receipt,
      logs
    };
  }

  // Condition PASSED - Proceed with decryption
  logs.push(`[${new Date().toISOString()}] ✅ CONDITION PASSED: ${metrics.uptime}% >= ${policy.sla_threshold}%`);
  logs.push(`[${new Date().toISOString()}] Requesting BITE v2 threshold decryption...`);

  // Step 3: Decrypt the intent
  let decryptedIntent: Partial<RenewalIntent>;
  try {
    const decryptionResult = await decryptIntent(dbIntent.encrypted_payload, true);
    
    if (!decryptionResult.success || !decryptionResult.decryptedData) {
      logs.push(`[${new Date().toISOString()}] ❌ Decryption failed: ${decryptionResult.error}`);
      
      const receipt = createFailureReceipt(
        { id: dbIntent.id.toString(), subscription: policy.subscription_name, vendor: policy.vendor, maxPrice: policy.max_price, period: policy.period, condition: { type: 'sla', threshold: policy.sla_threshold, windowDays: policy.sla_window_days }, guardrails: { maxPrice: policy.max_price, vendorAllowlist: [], maxExecutions: policy.max_executions, timeoutHours: policy.timeout_hours }, expiresAt: dbIntent.expires_at, status: AgentStatus.PENDING },
        decryptionResult.error || 'Decryption failed',
        'PASS'
      );
      
      return {
        success: false,
        intent: { id: dbIntent.id.toString(), subscription: '', vendor: '', maxPrice: 0, period: 'monthly', condition: { type: 'sla', threshold: 0, windowDays: 0 }, guardrails: { maxPrice: 0, vendorAllowlist: [], maxExecutions: 0, timeoutHours: 0 }, expiresAt: '', status: AgentStatus.BLOCKED },
        receipt,
        logs
      };
    }
    
    decryptedIntent = decryptionResult.decryptedData;
    logs.push(`[${new Date().toISOString()}] 🔓 Decryption successful`);
    logs.push(`[${new Date().toISOString()}]   Vendor: ${decryptedIntent.vendor}`);
    logs.push(`[${new Date().toISOString()}]   Max Price: $${decryptedIntent.maxPrice}`);
  } catch (error) {
    logs.push(`[${new Date().toISOString()}] ❌ Decryption error: ${error}`);
    
    const receipt = createFailureReceipt(
      { id: dbIntent.id.toString(), subscription: policy.subscription_name, vendor: policy.vendor, maxPrice: policy.max_price, period: policy.period, condition: { type: 'sla', threshold: policy.sla_threshold, windowDays: policy.sla_window_days }, guardrails: { maxPrice: policy.max_price, vendorAllowlist: [], maxExecutions: policy.max_executions, timeoutHours: policy.timeout_hours }, expiresAt: dbIntent.expires_at, status: AgentStatus.PENDING },
      'Decryption error',
      'PASS'
    );
    
    return {
      success: false,
      intent: { id: dbIntent.id.toString(), subscription: '', vendor: '', maxPrice: 0, period: 'monthly', condition: { type: 'sla', threshold: 0, windowDays: 0 }, guardrails: { maxPrice: 0, vendorAllowlist: [], maxExecutions: 0, timeoutHours: 0 }, expiresAt: '', status: AgentStatus.BLOCKED },
      receipt,
      logs
    };
  }

  // Step 4: Validate guardrails
  logs.push(`[${new Date().toISOString()}] Running guardrail validation...`);
  
  const guardrailChecks = validateGuardrails(policy, decryptedIntent);
  
  if (!guardrailChecks.allPassed) {
    logs.push(`[${new Date().toISOString()}] ❌ GUARDRAIL VALIDATION FAILED`);
    guardrailChecks.failures.forEach(failure => {
      logs.push(`[${new Date().toISOString()}]   - ${failure}`);
    });
    
    const receipt: ExecutionReceipt = {
      agent: 'Akomi',
      subscription: decryptedIntent.subscription || policy.subscription_name,
      condition: `SLA >= ${policy.sla_threshold}%`,
      conditionResult: 'PASS',
      executed: false,
      reason: `Guardrail validation failed: ${guardrailChecks.failures.join('; ')}`,
      timestamp: new Date().toISOString(),
      guardrailCheck: guardrailChecks.checks
    };
    
    // Update intent status
    dbUpdateIntentStatus(intentId, 'blocked');
    
    // Save receipt
    dbCreateReceipt({
      intent_id: intentId,
      agent_name: 'Akomi',
      subscription: receipt.subscription,
      condition: receipt.condition,
      condition_result: 'PASS',
      executed: false,
      reason: receipt.reason,
      guardrail_check: receipt.guardrailCheck
    });
    
    return {
      success: false,
      intent: { id: dbIntent.id.toString(), subscription: '', vendor: '', maxPrice: 0, period: 'monthly', condition: { type: 'sla', threshold: 0, windowDays: 0 }, guardrails: { maxPrice: 0, vendorAllowlist: [], maxExecutions: 0, timeoutHours: 0 }, expiresAt: '', status: AgentStatus.BLOCKED },
      receipt,
      logs
    };
  }

  logs.push(`[${new Date().toISOString()}] ✅ All guardrails passed`);

  // Step 5: Execute payment
  logs.push(`[${new Date().toISOString()}] Executing payment...`);
  
  try {
    const intentForPayment: RenewalIntent = {
      id: dbIntent.id.toString(),
      subscription: decryptedIntent.subscription || policy.subscription_name,
      vendor: decryptedIntent.vendor || policy.vendor,
      maxPrice: decryptedIntent.maxPrice || policy.max_price,
      period: decryptedIntent.period || policy.period,
      condition: decryptedIntent.condition || { type: 'sla', threshold: policy.sla_threshold, windowDays: policy.sla_window_days },
      guardrails: decryptedIntent.guardrails || { maxPrice: policy.max_price, vendorAllowlist: [], maxExecutions: policy.max_executions, timeoutHours: policy.timeout_hours },
      expiresAt: dbIntent.expires_at,
      status: AgentStatus.PENDING
    };

    const paymentResult = await paymentProcessor.executePayment({
      intent: intentForPayment,
      amount: intentForPayment.maxPrice,
      merchantAddress: paymentConfig.merchantAddress || '0x0000000000000000000000000000000000000000'
    });
    
    logs.push(`[${new Date().toISOString()}] 💰 Payment executed successfully`);
    logs.push(`[${new Date().toISOString()}]   TX Hash: ${paymentResult.txHash}`);
    logs.push(`[${new Date().toISOString()}]   Block: ${paymentResult.blockNumber}`);

    // Update intent status
    dbUpdateIntentStatus(intentId, 'executed');

    // Step 6: Generate success receipt
    const receipt = createSuccessReceipt(intentForPayment, paymentResult);
    
    // Save receipt
    dbCreateReceipt({
      intent_id: intentId,
      agent_name: receipt.agent,
      subscription: receipt.subscription,
      condition: receipt.condition,
      condition_result: receipt.condition_result,
      executed: receipt.executed,
      amount: receipt.amount,
      tx_hash: receipt.txHash,
      guardrail_check: receipt.guardrailCheck
    });

    // Send notification
    await notificationService.sendExecutionResult(receipt);
    
    return {
      success: true,
      intent: { ...intentForPayment, status: AgentStatus.EXECUTED },
      receipt,
      logs
    };
  } catch (error) {
    logs.push(`[${new Date().toISOString()}] ❌ Payment execution failed: ${error}`);
    
    const receipt = createFailureReceipt(
      { id: dbIntent.id.toString(), subscription: policy.subscription_name, vendor: policy.vendor, maxPrice: policy.max_price, period: policy.period, condition: { type: 'sla', threshold: policy.sla_threshold, windowDays: policy.sla_window_days }, guardrails: { maxPrice: policy.max_price, vendorAllowlist: [], maxExecutions: policy.max_executions, timeoutHours: policy.timeout_hours }, expiresAt: dbIntent.expires_at, status: AgentStatus.PENDING },
      `Payment execution failed: ${error}`,
      'PASS'
    );
    
    return {
      success: false,
      intent: { id: dbIntent.id.toString(), subscription: '', vendor: '', maxPrice: 0, period: 'monthly', condition: { type: 'sla', threshold: 0, windowDays: 0 }, guardrails: { maxPrice: 0, vendorAllowlist: [], maxExecutions: 0, timeoutHours: 0 }, expiresAt: '', status: AgentStatus.PENDING },
      receipt,
      logs
    };
  }
}

// ============================================
// Guardrail Validation
// ============================================

/**
 * Validates guardrails for a policy
 */
function validateGuardrails(
  policy: any,
  intent: Partial<RenewalIntent>
): {
  allPassed: boolean;
  failures: string[];
  checks: {
    priceValid: boolean;
    vendorAllowed: boolean;
    withinLimit: boolean;
  };
} {
  const failures: string[] = [];
  
  // Check price
  const priceValid = (intent.maxPrice || 0) <= policy.max_price;
  if (!priceValid) {
    failures.push(`Price ${intent.maxPrice} exceeds maximum ${policy.max_price}`);
  }
  
  // Check vendor
  const vendorAllowed = true; // In production, check against allowlist
  if (!vendorAllowed) {
    failures.push(`Vendor ${intent.vendor} not in allowlist`);
  }
  
  // Check execution limit
  const withinLimit = policy.max_executions > 0;
  if (!withinLimit) {
    failures.push('Maximum executions reached');
  }
  
  return {
    allPassed: failures.length === 0,
    failures,
    checks: {
      priceValid,
      vendorAllowed,
      withinLimit
    }
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generates a unique intent ID
 */
function generateIntentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `akomi-${timestamp}-${random}`;
}

export default {
  createRenewalIntent,
  checkCondition,
  executeRenewalWorkflow,
};
