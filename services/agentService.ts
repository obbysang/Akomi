/**
 * Akomi Agent Service
 * 
 * Main orchestration service that coordinates the subscription renewal workflow:
 * 1. Creates encrypted renewal intents (BITE v2)
 * 2. Fetches SLA metrics
 * 3. Evaluates conditions
 * 4. Validates guardrails
 * 5. Executes payments
 * 6. Generates receipts
 * 
 * This is the core agent logic that implements the workflow from documentation.md
 */

import { RenewalIntent, AgentStatus, SLAMetrics, ExecutionReceipt } from '../types';
import { biteEncrypt, biteDecrypt, verifyConditionThreshold, canDecrypt } from './biteService';
import { fetchSLAMetrics, validateSLACondition } from './slaService';
import { executePayment, createSuccessReceipt, createFailureReceipt } from './paymentService';
import { validateGuardrails, shouldTriggerRenewal, createGuardrails } from './policyEngine';

// Agent execution result
export interface AgentExecutionResult {
  success: boolean;
  intent: RenewalIntent;
  receipt?: ExecutionReceipt;
  logs: string[];
}

// Internal execution options (for testing)
interface ExecutionOptions {
  overrideMetrics?: SLAMetrics;
}

/**
 * Creates a new renewal intent with BITE v2 encryption
 */
export async function createRenewalIntent(params: {
  subscription: string;
  vendor: string;
  maxPrice: number;
  period: 'monthly' | 'yearly';
  slaThreshold: number;
  slaWindowDays?: number;
  vendorAllowlist?: string[];
  maxExecutions?: number;
  timeoutHours?: number;
}): Promise<{
  intent: RenewalIntent;
  logs: string[];
}> {
  const logs: string[] = [];
  logs.push(`[${new Date().toISOString()}] Creating renewal intent for "${params.subscription}"`);

  // Create guardrails
  const guardrails = createGuardrails({
    maxPrice: params.maxPrice,
    vendorAllowlist: params.vendorAllowlist,
    maxExecutions: params.maxExecutions,
    timeoutHours: params.timeoutHours,
    vendor: params.vendor
  });

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
  const encryptedPayload = await biteEncrypt(intent);
  intent.encryptedPayload = encryptedPayload;
  
  logs.push(`[${new Date().toISOString()}] Intent encrypted successfully`);
  logs.push(`[${new Date().toISOString()}] Intent status: PENDING (encrypted)`);

  return { intent, logs };
}

/**
 * Internal execution function with optional metrics override
 */
async function executeWorkflowInternal(
  intent: RenewalIntent,
  options: ExecutionOptions = {}
): Promise<AgentExecutionResult> {
  const logs: string[] = [];
  
  // Validate intent status
  if (intent.status !== AgentStatus.PENDING) {
    logs.push(`ERROR: Intent ${intent.id} is not in PENDING status`);
    return {
      success: false,
      intent,
      logs
    };
  }

  logs.push(`[${new Date().toISOString()}] Starting renewal workflow for intent ${intent.id}`);
  
  // Step 1: Fetch SLA metrics (or use override)
  let metrics: SLAMetrics;
  if (options.overrideMetrics) {
    metrics = options.overrideMetrics;
    logs.push(`[${new Date().toISOString()}] Using override SLA metrics for vendor: ${intent.vendor}`);
  } else {
    logs.push(`[${new Date().toISOString()}] Fetching SLA metrics for vendor: ${intent.vendor}`);
    metrics = await fetchSLAMetrics(intent.vendor, intent.condition.windowDays);
  }
  logs.push(`[${new Date().toISOString()}] SLA uptime: ${metrics.uptime}% (window: ${metrics.period})`);

  // Step 2: Evaluate condition
  logs.push(`[${new Date().toISOString()}] Evaluating SLA condition: ${metrics.uptime}% >= ${intent.condition.threshold}%`);
  
  const conditionResult = validateSLACondition(metrics, intent.condition.threshold);
  
  if (!conditionResult.passed) {
    // Condition FAILED - Safe outcome, keep intent encrypted
    logs.push(`[${new Date().toISOString()}] ❌ CONDITION FAILED: ${conditionResult.actualUptime}% < ${conditionResult.requiredUptime}%`);
    logs.push(`[${new Date().toISOString()}] 🔒 Intent remains encrypted. No decryption occurred.`);
    
    const receipt = createFailureReceipt(
      intent,
      `SLA threshold not met: ${conditionResult.actualUptime}% < ${conditionResult.requiredUptime}%`,
      'FAIL'
    );
    
    return {
      success: true, // This is a valid/safe outcome
      intent: { ...intent, status: AgentStatus.BLOCKED },
      receipt,
      logs
    };
  }

  // Condition PASSED - Proceed with decryption
  logs.push(`[${new Date().toISOString()}] ✅ CONDITION PASSED: ${conditionResult.actualUptime}% >= ${conditionResult.requiredUptime}%`);
  logs.push(`[${new Date().toISOString()}] Requesting BITE v2 threshold decryption...`);

  // Step 3: Verify threshold and decrypt
  const canDecryptResult = await canDecrypt(intent.encryptedPayload!, metrics);
  
  if (!canDecryptResult.canDecrypt) {
    logs.push(`[${new Date().toISOString()}] ❌ Decryption blocked: ${canDecryptResult.reason}`);
    
    const receipt = createFailureReceipt(
      intent,
      canDecryptResult.reason || 'Decryption not authorized',
      'FAIL'
    );
    
    return {
      success: false,
      intent: { ...intent, status: AgentStatus.BLOCKED },
      receipt,
      logs
    };
  }

  // Decrypt the intent
  let decryptedIntent: Partial<RenewalIntent>;
  try {
    decryptedIntent = await biteDecrypt(intent.encryptedPayload!, true);
    logs.push(`[${new Date().toISOString()}] 🔓 Decryption successful`);
    logs.push(`[${new Date().toISOString()}]   Vendor: ${decryptedIntent.vendor}`);
    logs.push(`[${new Date().toISOString()}]   Max Price: $${decryptedIntent.maxPrice}`);
  } catch (error) {
    logs.push(`[${new Date().toISOString()}] ❌ Decryption failed: ${error}`);
    
    const receipt = createFailureReceipt(
      intent,
      'Decryption failed',
      'PASS'
    );
    
    return {
      success: false,
      intent,
      receipt,
      logs
    };
  }

  // Step 4: Validate guardrails
  logs.push(`[${new Date().toISOString()}] Running guardrail validation...`);
  
  const guardrailValidation = validateGuardrails(intent, metrics);
  
  if (!guardrailValidation.passed) {
    logs.push(`[${new Date().toISOString()}] ❌ GUARDRAIL VALIDATION FAILED`);
    guardrailValidation.failures.forEach(failure => {
      logs.push(`[${new Date().toISOString()}]   - ${failure}`);
    });
    
    const receipt: ExecutionReceipt = {
      agent: 'Akomi',
      subscription: intent.subscription,
      condition: `SLA >= ${intent.condition.threshold}%`,
      conditionResult: 'PASS',
      executed: false,
      reason: `Guardrail validation failed: ${guardrailValidation.failures.join('; ')}`,
      timestamp: new Date().toISOString(),
      guardrailCheck: guardrailValidation.checks
    };
    
    return {
      success: false,
      intent: { ...intent, status: AgentStatus.BLOCKED },
      receipt,
      logs
    };
  }

  logs.push(`[${new Date().toISOString()}] ✅ All guardrails passed`);
  logs.push(`[${new Date().toISOString()}]   ✓ Price within cap: $${decryptedIntent.maxPrice} <= $${intent.guardrails.maxPrice}`);
  logs.push(`[${new Date().toISOString()}]   ✓ Vendor allowed: ${decryptedIntent.vendor}`);
  logs.push(`[${new Date().toISOString()}]   ✓ Execution within limit`);

  // Step 5: Execute payment
  logs.push(`[${new Date().toISOString()}] Executing payment...`);
  
  try {
    const paymentResult = await executePayment(intent);
    logs.push(`[${new Date().toISOString()}] 💰 Payment executed successfully`);
    logs.push(`[${new Date().toISOString()}]   TX Hash: ${paymentResult.txHash}`);
    logs.push(`[${new Date().toISOString()}]   Block: ${paymentResult.blockNumber}`);
    logs.push(`[${new Date().toISOString()}]   Gas Used: ${paymentResult.gasUsed}`);

    // Step 6: Generate success receipt
    const receipt = createSuccessReceipt(intent, paymentResult);
    
    return {
      success: true,
      intent: { ...intent, status: AgentStatus.EXECUTED },
      receipt,
      logs
    };
  } catch (error) {
    logs.push(`[${new Date().toISOString()}] ❌ Payment execution failed: ${error}`);
    
    const receipt = createFailureReceipt(
      intent,
      `Payment execution failed: ${error}`,
      'PASS'
    );
    
    return {
      success: false,
      intent,
      receipt,
      logs
    };
  }
}

/**
 * Executes the renewal workflow for a pending intent (production version)
 */
export async function executeRenewalWorkflow(
  intent: RenewalIntent
): Promise<AgentExecutionResult> {
  return executeWorkflowInternal(intent, {});
}

/**
 * Manually triggers condition check (for demo/testing purposes)
 * This simulates what would happen on a scheduled basis in production
 */
export async function triggerConditionCheck(
  intent: RenewalIntent,
  forceConditionPass?: boolean
): Promise<AgentExecutionResult> {
  if (forceConditionPass !== undefined) {
    // For testing: inject artificial metrics
    const threshold = intent.condition.threshold;
    const mockMetrics: SLAMetrics = {
      uptime: forceConditionPass ? threshold + 0.5 : threshold - 2,
      period: `last_${intent.condition.windowDays}_days`,
      timestamp: new Date().toISOString()
    };
    
    // Use internal function with override
    return executeWorkflowInternal(intent, { overrideMetrics: mockMetrics });
  }
  
  return executeWorkflowInternal(intent, {});
}

// ==================== Helper Functions ====================

/**
 * Generates a unique intent ID
 * In production, this would use UUID or similar
 */
function generateIntentId(): string {
  // Use timestamp + random for uniqueness
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `akomi-${timestamp}-${random}`;
}

/**
 * Gets human-readable intent status
 */
export function getIntentStatusText(intent: RenewalIntent): string {
  switch (intent.status) {
    case AgentStatus.PENDING:
      return 'Pending - Awaiting condition check';
    case AgentStatus.EXECUTED:
      return 'Executed - Payment completed';
    case AgentStatus.BLOCKED:
      return 'Blocked - Condition not met or guardrails failed';
    default:
      return 'Unknown';
  }
}
