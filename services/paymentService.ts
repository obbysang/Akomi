/**
 * Production Payment Service
 * 
 * Handles subscription renewal payments using x402 protocol.
 * In production, this integrates with:
 * - SKALE network for on-chain transactions
 * - x402 protocol for HTTP 402 payment flows
 * - CDP Wallets for fund custody
 * 
 * This service communicates with the backend for actual payment execution.
 */

import { RenewalIntent, ExecutionReceipt } from '../types';
import { paymentApi } from './api';

// Payment configuration
interface PaymentConfig {
  network: 'mainnet' | 'testnet' | 'skale';
  rpcUrl: string;
  walletPrivateKey: string;
  merchantAddress: string;
}

const DEFAULT_CONFIG: PaymentConfig = {
  network: (import.meta.env?.VITE_PAYMENT_NETWORK as PaymentConfig['network']) || 'skale',
  rpcUrl: import.meta.env?.VITE_SKALE_RPC_URL || '',
  walletPrivateKey: import.meta.env?.VITE_WALLET_PRIVATE_KEY || '',
  merchantAddress: import.meta.env?.VITE_MERCHANT_ADDRESS || ''
};

/**
 * Executes a subscription renewal payment via backend API
 * 
 * In production, this calls the backend which:
 * 1. Signs the transaction with CDP Wallet or Ethers.js
 * 2. Submits to SKALE network via x402 protocol
 * 3. Waits for confirmation
 * 4. Returns the transaction hash
 * 
 * @param intent - The renewal intent to execute
 * @returns Promise resolving to transaction receipt
 */
export async function executePayment(intent: RenewalIntent): Promise<{
  txHash: string;
  blockNumber: number;
  status: 'confirmed' | 'pending' | 'failed';
  gasUsed: string;
}> {
  const config = DEFAULT_CONFIG;
  
  // If real RPC is configured, use backend to execute
  if (config.rpcUrl && config.walletPrivateKey) {
    try {
      return await executeOnChainPayment(intent, config);
    } catch (error) {
      console.error('On-chain payment failed:', error);
      throw error;
    }
  }
  
  // If no credentials, try via API
  try {
    const result = await paymentApi.executePayment({
      intent_id: intent.id,
      amount: intent.maxPrice,
      merchant_address: config.merchantAddress || '0x0000000000000000000000000000000000000000'
    });
    
    if (result.success && result.data) {
      return result.data;
    }
    
    throw new Error(result.error || 'Payment failed');
  } catch (error) {
    console.error('Payment API error:', error);
    throw new Error('Payment service unavailable. Configure backend credentials.');
  }
}

/**
 * Executes payment on SKALE network via backend
 */
async function executeOnChainPayment(
  intent: RenewalIntent, 
  config: PaymentConfig
): Promise<{
  txHash: string;
  blockNumber: number;
  status: 'confirmed' | 'pending' | 'failed';
  gasUsed: string;
}> {
  // Call backend payment endpoint
  try {
    const result = await paymentApi.executePayment({
      intent_id: intent.id,
      amount: intent.maxPrice,
      merchant_address: config.merchantAddress || '0x0000000000000000000000000000000000000000',
      metadata: {
        subscription: intent.subscription,
        vendor: intent.vendor,
        period: intent.period
      }
    });
    
    if (result.success && result.data) {
      return result.data;
    }
    
    throw new Error(result.error || 'Payment failed');
  } catch (error) {
    // If backend fails, throw
    throw error;
  }
}

/**
 * Validates payment can be executed
 */
export async function validatePaymentCapability(
  intent: RenewalIntent
): Promise<{ canPay: boolean; shortfall: number }> {
  try {
    const result = await paymentApi.checkBalance(intent.maxPrice);
    
    if (result.success && result.data) {
      return result.data;
    }
    
    return { canPay: false, shortfall: intent.maxPrice };
  } catch {
    return { canPay: false, shortfall: intent.maxPrice };
  }
}

/**
 * Creates an execution receipt for successful payment
 */
export function createSuccessReceipt(
  intent: RenewalIntent,
  txResult: { txHash: string; blockNumber: number; status: string; gasUsed: string }
): ExecutionReceipt {
  return {
    agent: 'Akomi',
    subscription: intent.subscription,
    condition: `SLA >= ${intent.condition.threshold}%`,
    conditionResult: 'PASS',
    executed: true,
    amount: intent.maxPrice,
    txHash: txResult.txHash,
    timestamp: new Date().toISOString(),
    guardrailCheck: {
      priceValid: true,
      vendorAllowed: true,
      withinLimit: true
    }
  };
}

/**
 * Creates a failure receipt when conditions are not met
 */
export function createFailureReceipt(
  intent: RenewalIntent,
  reason: string,
  conditionResult: 'PASS' | 'FAIL' = 'FAIL'
): ExecutionReceipt {
  return {
    agent: 'Akomi',
    subscription: conditionResult === 'FAIL' ? 'ENCRYPTED' : intent.subscription,
    condition: `SLA >= ${intent.condition.threshold}%`,
    conditionResult,
    executed: false,
    reason,
    timestamp: new Date().toISOString()
  };
}

export default {
  executePayment,
  validatePaymentCapability,
  createSuccessReceipt,
  createFailureReceipt,
};
