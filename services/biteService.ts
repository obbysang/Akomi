/**
 * Production BITE v2 Encryption Service
 * 
 * Frontend service for BITE v2 encryption operations.
 * Integrates with SKALE's BITE Protocol via backend API.
 * 
 * Documentation: https://docs.skale.space/developers/bite-protocol/typescript-sdk
 * 
 * This service communicates with the backend for actual encryption/decryption
 * to keep keys secure server-side.
 */

import { RenewalIntent, AgentStatus } from '../types';

// ============================================
// Configuration
// ============================================

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';

// ============================================
// Types
// ============================================

export interface BITEPayload {
  version: string;
  algorithm: string;
  threshold: number;
  totalValidators: number;
  validators: string[];
  condition: {
    type: string;
    threshold: number;
    hash: string;
  };
  iv: string;
  ciphertext: string;
  keyCommitment: string;
  encryptedAt: string;
  networkId: string;
}

export interface EncryptionResult {
  success: boolean;
  encryptedPayload?: string;
  error?: string;
}

export interface DecryptionResult {
  success: boolean;
  decryptedData?: Partial<RenewalIntent>;
  error?: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Encrypts a renewal intent using BITE v2
 * This calls the backend API to perform actual encryption
 * 
 * @param intent - The renewal intent to encrypt
 * @returns Encrypted payload string
 */
export async function biteEncrypt(intent: RenewalIntent): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/encrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(intent),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Encryption failed');
    }

    const data = await response.json();
    return data.encryptedPayload;
  } catch (error) {
    console.error('[BITE] Encryption error:', error);
    throw error;
  }
}

/**
 * Decrypts a BITE v2 encrypted payload
 * This calls the backend API to perform actual decryption
 * 
 * @param encryptedPayload - The BITE encrypted string
 * @param conditionMet - Whether the condition has been met
 * @returns Decrypted intent data
 */
export async function biteDecrypt(
  encryptedPayload: string, 
  conditionMet: boolean = true
): Promise<Partial<RenewalIntent>> {
  try {
    const response = await fetch(`${API_BASE_URL}/decrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        encryptedPayload,
        conditionMet 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Decryption failed');
    }

    const data = await response.json();
    return data.decryptedData;
  } catch (error) {
    console.error('[BITE] Decryption error:', error);
    throw error;
  }
}

/**
 * Verifies if condition threshold is met for decryption
 * This is done locally to check if decryption should be attempted
 */
export async function verifyConditionThreshold(
  encryptedPayload: string,
  actualValue: number
): Promise<boolean> {
  try {
    // Parse payload to get condition
    let payloadStr = encryptedPayload;
    if (encryptedPayload.startsWith('BITE2:')) {
      payloadStr = encryptedPayload.substring(5);
    }

    const bitePayload: BITEPayload = JSON.parse(payloadStr);
    const threshold = bitePayload.condition?.threshold;

    if (!threshold) {
      return false;
    }

    // Check if actual value meets threshold
    // For SLA: actual uptime >= required threshold
    return actualValue >= threshold;
  } catch {
    return false;
  }
}

/**
 * Validates that an intent can be decrypted (condition has been met)
 */
export async function canDecrypt(
  encryptedPayload: string,
  metrics: { uptime: number }
): Promise<{ canDecrypt: boolean; reason?: string }> {
  try {
    const conditionMet = await verifyConditionThreshold(encryptedPayload, metrics.uptime);
    
    if (!conditionMet) {
      return {
        canDecrypt: false,
        reason: `SLA threshold not met: ${metrics.uptime}% < required threshold`
      };
    }
    
    return { canDecrypt: true };
  } catch (error) {
    return {
      canDecrypt: false,
      reason: 'Failed to validate condition'
    };
  }
}

// ============================================
// Local Encryption (Fallback / Development)
// ============================================

/**
 * Local encryption fallback for development
 * In production, encryption should be done server-side
 */
export async function localEncrypt(intent: RenewalIntent): Promise<string> {
  // Prepare plaintext payload
  const plaintext = JSON.stringify({
    subscription: intent.subscription,
    vendor: intent.vendor,
    maxPrice: intent.maxPrice,
    period: intent.period,
    guardrails: intent.guardrails,
    condition: intent.condition,
    encryptedAt: Date.now()
  });

  // Generate random key for this encryption
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    new TextEncoder().encode(plaintext)
  );

  // Export key
  const exportedKey = await crypto.subtle.exportKey('raw', key);

  // Create payload
  const bitePayload = {
    version: 'BITE2',
    algorithm: 'AES-256-GCM',
    threshold: 2,
    totalValidators: 3,
    validators: [],
    condition: {
      type: intent.condition.type,
      threshold: intent.condition.threshold,
      hash: await hashCondition(intent.condition)
    },
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertext),
    keyCommitment: arrayBufferToBase64(exportedKey),
    encryptedAt: new Date().toISOString(),
    networkId: 'skale-mainnet'
  };

  return `BITE2:${JSON.stringify(bitePayload)}`;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Hashes a condition for on-chain storage
 */
async function hashCondition(condition: any): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(condition));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Converts ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use biteEncrypt and biteDecrypt with condition checking
 */
export const checkThreshold = (encryptedPayload: string, actualValue: number): boolean => {
  return verifyConditionThreshold(encryptedPayload, actualValue);
};

export default {
  biteEncrypt,
  biteDecrypt,
  verifyConditionThreshold,
  canDecrypt,
  localEncrypt,
  checkThreshold,
};
