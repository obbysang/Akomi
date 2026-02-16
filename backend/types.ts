/**
 * Shared Types for Akomi Backend
 * 
 * This file is copied from the root types.ts to ensure
 * the backend has access to the same type definitions.
 */

export enum AgentStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
  BLOCKED = 'blocked'
}

export interface RenewalCondition {
  type: 'sla';
  threshold: number;
  windowDays: number;
}

export interface PolicyGuardrails {
  maxPrice: number;
  vendorAllowlist: string[];
  maxExecutions: number;
  timeoutHours: number;
}

export interface RenewalIntent {
  id: string;
  subscription: string;
  vendor: string;
  maxPrice: number;
  period: 'monthly' | 'yearly';
  condition: RenewalCondition;
  guardrails: PolicyGuardrails;
  expiresAt: string;
  status: AgentStatus;
  encryptedPayload?: string;
  plaintextPayload?: string;
}

export interface SLAMetrics {
  uptime: number;
  period: string;
  timestamp: string;
}

export interface ExecutionReceipt {
  agent: string;
  subscription: string;
  condition: string;
  conditionResult: 'PASS' | 'FAIL';
  executed: boolean;
  amount?: number;
  txHash?: string;
  timestamp: string;
  reason?: string;
  guardrailCheck?: {
    priceValid: boolean;
    vendorAllowed: boolean;
    withinLimit: boolean;
  };
}
