/**
 * Policy Engine Service
 * 
 * Implements guardrail validation for Akomi subscription renewal agents.
 * Enforces spend caps, vendor allowlists, execution limits, and timeout rules.
 * 
 * This is a core part of the trust & safety model:
 * - Spend caps prevent overspending
 * - Vendor allowlists ensure trusted counterparties
 * - Execution limits prevent duplicate charges
 * - Timeout logic handles stale intents
 */

import { RenewalIntent, AgentStatus, PolicyGuardrails } from '../types';

// Policy validation result
export interface GuardrailValidation {
  passed: boolean;
  checks: {
    priceValid: boolean;
    vendorAllowed: boolean;
    withinLimit: boolean;
    notExpired: boolean;
    notExecuted: boolean;
  };
  failures: string[];
}

/**
 * Validates all guardrails for a renewal intent
 * 
 * @param intent - The renewal intent to validate
 * @param metrics - Current SLA metrics (for conditional validation)
 * @returns Guardrail validation result
 */
export function validateGuardrails(
  intent: RenewalIntent,
  metrics?: { uptime: number }
): GuardrailValidation {
  const checks = {
    priceValid: false,
    vendorAllowed: false,
    withinLimit: false,
    notExpired: false,
    notExecuted: false
  };
  
  const failures: string[] = [];
  
  // Check 1: Price within spend cap
  checks.priceValid = validatePrice(intent);
  if (!checks.priceValid) {
    failures.push(`Price $${intent.maxPrice} exceeds guardrail cap`);
  }
  
  // Check 2: Vendor in allowlist
  checks.vendorAllowed = validateVendor(intent);
  if (!checks.vendorAllowed) {
    failures.push(`Vendor "${intent.vendor}" not in allowlist`);
  }
  
  // Check 3: Execution within limits
  checks.withinLimit = validateExecutionLimit(intent);
  if (!checks.withinLimit) {
    failures.push('Execution limit reached');
  }
  
  // Check 4: Intent not expired
  checks.notExpired = validateExpiration(intent);
  if (!checks.notExpired) {
    failures.push('Intent has expired');
  }
  
  // Check 5: Intent not already executed
  checks.notExecuted = validateNotExecuted(intent);
  if (!checks.notExecuted) {
    failures.push('Intent has already been executed');
  }
  
  return {
    passed: Object.values(checks).every(Boolean),
    checks,
    failures
  };
}

/**
 * Validates price against guardrail cap
 */
function validatePrice(intent: RenewalIntent): boolean {
  const guardrailCap = intent.guardrails.maxPrice;
  return intent.maxPrice <= guardrailCap;
}

/**
 * Validates vendor is in allowlist
 */
function validateVendor(intent: RenewalIntent): boolean {
  const allowlist = intent.guardrails.vendorAllowlist;
  const vendorLower = intent.vendor.toLowerCase();
  
  // If no allowlist specified, allow any vendor (not recommended for production)
  if (!allowlist || allowlist.length === 0) {
    return true;
  }
  
  return allowlist.some(allowed => 
    allowed.toLowerCase() === vendorLower
  );
}

/**
 * Validates execution limit
 */
function validateExecutionLimit(intent: RenewalIntent): boolean {
  const maxExecutions = intent.guardrails.maxExecutions;
  
  // If already executed, check against limit
  if (intent.status === AgentStatus.EXECUTED) {
    return false;
  }
  
  // In production, track actual execution count in persistent storage
  return maxExecutions >= 1;
}

/**
 * Validates intent has not expired
 */
function validateExpiration(intent: RenewalIntent): boolean {
  const expiresAt = new Date(intent.expiresAt);
  const now = new Date();
  return expiresAt > now;
}

/**
 * Validates intent has not been executed
 */
function validateNotExecuted(intent: RenewalIntent): boolean {
  return intent.status !== AgentStatus.EXECUTED && 
         intent.status !== AgentStatus.BLOCKED;
}

/**
 * Checks if a renewal should be triggered based on policy
 */
export function shouldTriggerRenewal(
  intent: RenewalIntent,
  metrics: { uptime: number }
): {
  shouldTrigger: boolean;
  reason: string;
} {
  // Check expiration
  if (!validateExpiration(intent)) {
    return {
      shouldTrigger: false,
      reason: 'Intent has expired'
    };
  }
  
  // Check execution status
  if (!validateNotExecuted(intent)) {
    return {
      shouldTrigger: false,
      reason: 'Intent already executed or blocked'
    };
  }
  
  // Check vendor allowlist
  if (!validateVendor(intent)) {
    return {
      shouldTrigger: false,
      reason: 'Vendor not in allowlist'
    };
  }
  
  // Check SLA condition
  if (metrics.uptime < intent.condition.threshold) {
    return {
      shouldTrigger: false,
      reason: `SLA condition not met: ${metrics.uptime}% < ${intent.condition.threshold}%`
    };
  }
  
  return {
    shouldTrigger: true,
    reason: 'All conditions met'
  };
}

/**
 * Creates updated guardrails with defaults
 */
export function createGuardrails(params: {
  maxPrice: number;
  vendorAllowlist?: string[];
  maxExecutions?: number;
  timeoutHours?: number;
  vendor?: string;
}): PolicyGuardrails {
  return {
    maxPrice: params.maxPrice,
    vendorAllowlist: params.vendorAllowlist || 
      (params.vendor ? [params.vendor.toLowerCase()] : []),
    maxExecutions: params.maxExecutions || 1,
    timeoutHours: params.timeoutHours || 72
  };
}

/**
 * Validates guardrail configuration
 */
export function validateGuardrailConfig(config: PolicyGuardrails): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (config.maxPrice <= 0) {
    errors.push('Max price must be positive');
  }
  
  if (config.maxPrice > 1000000) {
    errors.push('Max price exceeds reasonable limit');
  }
  
  if (config.maxExecutions <= 0 || config.maxExecutions > 12) {
    errors.push('Max executions must be between 1 and 12');
  }
  
  if (config.timeoutHours < 1 || config.timeoutHours > 8760) {
    errors.push('Timeout must be between 1 hour and 1 year');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
