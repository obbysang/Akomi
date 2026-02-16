/**
 * Akomi API Service
 * 
 * Frontend service layer that handles all communication with the Akomi backend.
 * This includes authentication, policy management, intent operations, and execution.
 * 
 * All endpoints require JWT authentication (Bearer token).
 */

import { RenewalIntent, AgentStatus, ExecutionReceipt, SLAMetrics } from '../types';

// ============================================
// Configuration
// ============================================

// API base URL - defaults to backend port 3001
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';

// ============================================
// Types
// ============================================

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: number;
      email: string;
      name?: string;
    };
  };
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PolicyFormData {
  subscription_name: string;
  vendor: string;
  max_price: number;
  period: 'monthly' | 'yearly';
  sla_threshold: number;
  sla_window_days?: number;
  vendor_allowlist?: string;
  max_executions?: number;
  timeout_hours?: number;
}

export interface PolicyData {
  id: number;
  user_id: number;
  subscription_name: string;
  vendor: string;
  max_price: number;
  period: 'monthly' | 'yearly';
  sla_threshold: number;
  sla_window_days: number;
  vendor_allowlist: string[];
  max_executions: number;
  timeout_hours: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Auth Token Management
// ============================================

const AUTH_TOKEN_KEY = 'akomi_auth_token';
const USER_DATA_KEY = 'akomi_user_data';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
}

export function getStoredUser(): { id: number; email: string; name?: string } | null {
  const userData = localStorage.getItem(USER_DATA_KEY);
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
  return null;
}

export function setStoredUser(user: { id: number; email: string; name?: string }): void {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

// ============================================
// API Helper
// ============================================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      data: data.data,
      message: data.message,
    };
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network request failed',
    };
  }
}

// ============================================
// Auth API
// ============================================

export const authApi = {
  /**
   * POST /api/auth/login
   * Login with email and password
   */
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: { id: number; email: string; name?: string } }>> {
    const result = await apiRequest<{ token: string; user: { id: number; email: string; name?: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.success && result.data) {
      setAuthToken(result.data.token);
      setStoredUser(result.data.user);
    }

    return result;
  },

  /**
   * POST /api/auth/register
   * Register a new user account
   */
  async register(email: string, password: string, name?: string): Promise<ApiResponse<{ token: string; user: { id: number; email: string; name?: string } }>> {
    const result = await apiRequest<{ token: string; user: { id: number; email: string; name?: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (result.success && result.data) {
      setAuthToken(result.data.token);
      setStoredUser(result.data.user);
    }

    return result;
  },

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<ApiResponse<{ id: number; email: string; name?: string; created_at: string }>> {
    return apiRequest('/auth/me');
  },

  /**
   * POST /api/auth/logout
   * Logout current user
   */
  async logout(): Promise<ApiResponse> {
    const result = await apiRequest('/auth/logout', { method: 'POST' });
    removeAuthToken();
    return result;
  },
};

// ============================================
// Policy API
// ============================================

export const policyApi = {
  /**
   * GET /api/policies
   * Get all policies for current user
   */
  async getPolicies(): Promise<ApiResponse<PolicyData[]>> {
    return apiRequest<PolicyData[]>('/policies');
  },

  /**
   * POST /api/policies
   * Create a new policy
   */
  async createPolicy(policy: PolicyFormData): Promise<ApiResponse<PolicyData>> {
    return apiRequest<PolicyData>('/policies', {
      method: 'POST',
      body: JSON.stringify(policy),
    });
  },

  /**
   * GET /api/policies/:id
   * Get a specific policy
   */
  async getPolicy(id: number): Promise<ApiResponse<PolicyData>> {
    return apiRequest<PolicyData>(`/policies/${id}`);
  },

  /**
   * PUT /api/policies/:id
   * Update a policy
   */
  async updatePolicy(id: number, policy: Partial<PolicyFormData>): Promise<ApiResponse<PolicyData>> {
    return apiRequest<PolicyData>(`/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policy),
    });
  },

  /**
   * DELETE /api/policies/:id
   * Delete a policy
   */
  async deletePolicy(id: number): Promise<ApiResponse> {
    return apiRequest(`/policies/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Intent API
// ============================================

export const intentApi = {
  /**
   * GET /api/intents
   * Get all intents (optionally filtered by policy_id)
   */
  async getIntents(policyId?: number): Promise<ApiResponse<RenewalIntent[]>> {
    const endpoint = policyId ? `/intents?policy_id=${policyId}` : '/intents';
    return apiRequest<RenewalIntent[]>(endpoint);
  },

  /**
   * POST /api/intents
   * Create a new encrypted intent from a policy
   */
  async createIntent(policyId: number): Promise<ApiResponse<RenewalIntent>> {
    return apiRequest<RenewalIntent>('/intents', {
      method: 'POST',
      body: JSON.stringify({ policy_id: policyId }),
    });
  },

  /**
   * GET /api/intents/:id
   * Get a specific intent
   */
  async getIntent(id: string): Promise<ApiResponse<RenewalIntent>> {
    return apiRequest<RenewalIntent>(`/intents/${id}`);
  },
};

// ============================================
// Execution API
// ============================================

export const executionApi = {
  /**
   * POST /api/execute/trigger
   * Trigger condition check for an intent
   */
  async triggerConditionCheck(intentId: string): Promise<ApiResponse<{
    success: boolean;
    intent: RenewalIntent;
    receipt?: ExecutionReceipt;
    logs: string[];
  }>> {
    return apiRequest('/execute/trigger', {
      method: 'POST',
      body: JSON.stringify({ intent_id: intentId }),
    });
  },

  /**
   * POST /api/execute/:intentId
   * Execute the full renewal workflow
   */
  async executeWorkflow(intentId: string): Promise<ApiResponse<{
    success: boolean;
    intent: RenewalIntent;
    receipt?: ExecutionReceipt;
    logs: string[];
  }>> {
    return apiRequest(`/execute/${intentId}`, {
      method: 'POST',
    });
  },
};

// ============================================
// Receipt API
// ============================================

export const receiptApi = {
  /**
   * GET /api/receipts
   * Get all receipts for current user
   */
  async getReceipts(): Promise<ApiResponse<ExecutionReceipt[]>> {
    return apiRequest<ExecutionReceipt[]>('/receipts');
  },

  /**
   * GET /api/receipts/:id
   * Get a specific receipt
   */
  async getReceipt(id: number): Promise<ApiResponse<ExecutionReceipt>> {
    return apiRequest<ExecutionReceipt>(`/receipts/${id}`);
  },

  /**
   * GET /api/receipts/intent/:intentId
   * Get receipt for a specific intent
   */
  async getReceiptByIntent(intentId: string): Promise<ApiResponse<ExecutionReceipt>> {
    return apiRequest<ExecutionReceipt>(`/receipts/intent/${intentId}`);
  },
};

// ============================================
// Encryption API (BITE v2)
// ============================================

export const encryptionApi = {
  /**
   * POST /api/encrypt
   * Encrypt a renewal intent using BITE v2
   */
  async encryptIntent(intent: RenewalIntent): Promise<ApiResponse<{ encryptedPayload: string }>> {
    return apiRequest<{ encryptedPayload: string }>('/encrypt', {
      method: 'POST',
      body: JSON.stringify(intent),
    });
  },

  /**
   * POST /api/decrypt
   * Decrypt a BITE v2 encrypted payload
   */
  async decryptIntent(encryptedPayload: string, conditionMet: boolean): Promise<ApiResponse<Partial<RenewalIntent>>> {
    return apiRequest<Partial<RenewalIntent>>('/decrypt', {
      method: 'POST',
      body: JSON.stringify({ encryptedPayload, conditionMet }),
    });
  },
};

// ============================================
// SLA API
// ============================================

export const slaApi = {
  /**
   * GET /api/sla/:vendor
   * Get SLA metrics for a vendor
   */
  async getMetrics(vendor: string, windowDays?: number): Promise<ApiResponse<{ uptime: number; period: string; timestamp: string }>> {
    const endpoint = windowDays ? `/sla/${vendor}?window=${windowDays}` : `/sla/${vendor}`;
    return apiRequest<{ uptime: number; period: string; timestamp: string }>(endpoint);
  },
};

// ============================================
// Payment API
// ============================================

export const paymentApi = {
  /**
   * POST /api/payment/execute
   * Execute a payment via x402 protocol
   */
  async executePayment(params: {
    intent_id: string;
    amount: number;
    merchant_address: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<{
    txHash: string;
    blockNumber: number;
    status: 'confirmed' | 'pending' | 'failed';
    gasUsed: string;
  }>> {
    return apiRequest('/payment/execute', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * GET /api/payment/balance
   * Check wallet balance
   */
  async checkBalance(amount: number): Promise<ApiResponse<{ canPay: boolean; shortfall: number }>> {
    return apiRequest(`/payment/balance?amount=${amount}`, {
      method: 'GET',
    });
  },

  /**
   * GET /api/payment/status/:txHash
   * Get payment status by transaction hash
   */
  async getPaymentStatus(txHash: string): Promise<ApiResponse<{
    txHash: string;
    blockNumber: number;
    status: 'confirmed' | 'pending' | 'failed';
    gasUsed: string;
  }>> {
    return apiRequest(`/payment/status/${txHash}`);
  },
};

// ============================================
// Health Check
// ============================================

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export default {
  authApi,
  policyApi,
  intentApi,
  executionApi,
  receiptApi,
  encryptionApi,
  slaApi,
  paymentApi,
  checkApiHealth,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
};
