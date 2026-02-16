/**
 * Database Models & Initialization
 * 
 * SQLite database models for Akomi backend.
 * Includes schema definitions for all entities.
 * 
 * Entities:
 * - users: User authentication
 * - policies: Renewal policy definitions
 * - intents: Encrypted renewal intents
 * - receipts: Execution receipts
 * - audit_logs: Audit trail
 */

import Database from 'better-sqlite3';
import { databaseConfig } from '../config';
import path from 'path';

// Initialize database
const dbPath = path.resolve(process.cwd(), databaseConfig.path);
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// ============================================
// Database Schema Initialization
// ============================================

/**
 * Initializes all database tables
 * Call this once at application startup
 */
export function initializeDatabase(): void {
  console.log('Initializing database...');
  
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create policies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subscription_name TEXT NOT NULL,
      vendor TEXT NOT NULL,
      max_price REAL NOT NULL,
      period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly')),
      sla_threshold REAL NOT NULL,
      sla_window_days INTEGER DEFAULT 30,
      vendor_allowlist TEXT, -- JSON array
      max_executions INTEGER DEFAULT 1,
      timeout_hours INTEGER DEFAULT 24,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create intents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS intents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER NOT NULL,
      encrypted_payload TEXT NOT NULL,
      condition_hash TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'blocked', 'expired')),
      expires_at DATETIME NOT NULL,
      executed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
    )
  `);

  // Create receipts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intent_id INTEGER NOT NULL,
      agent_name TEXT NOT NULL,
      subscription TEXT NOT NULL,
      condition TEXT NOT NULL,
      condition_result TEXT NOT NULL CHECK (condition_result IN ('PASS', 'FAIL')),
      executed INTEGER NOT NULL DEFAULT 0,
      amount REAL,
      tx_hash TEXT,
      reason TEXT,
      guardrail_check TEXT, -- JSON object
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (intent_id) REFERENCES intents(id) ON DELETE CASCADE
    )
  `);

  // Create audit_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT, -- JSON object
      ip_address TEXT,
      user_agent TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);
    CREATE INDEX IF NOT EXISTS idx_intents_policy_id ON intents(policy_id);
    CREATE INDEX IF NOT EXISTS idx_intents_status ON intents(status);
    CREATE INDEX IF NOT EXISTS idx_receipts_intent_id ON receipts(intent_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  `);

  console.log('Database initialized successfully');
}

// ============================================
// User Model
// ============================================

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  password_hash: string;
  name?: string;
}

/**
 * Creates a new user
 */
export function createUser(input: CreateUserInput): User {
  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash, name)
    VALUES (@email, @password_hash, @name)
  `);
  
  const result = stmt.run({
    email: input.email,
    password_hash: input.password_hash,
    name: input.name || null,
  });
  
  return getUserById(result.lastInsertRowid as number)!;
}

/**
 * Gets a user by ID
 */
export function getUserById(id: number): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | undefined;
}

/**
 * Gets a user by email
 */
export function getUserByEmail(email: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as User | undefined;
}

// ============================================
// Policy Model
// ============================================

export interface Policy {
  id: number;
  user_id: number;
  subscription_name: string;
  vendor: string;
  max_price: number;
  period: 'monthly' | 'yearly';
  sla_threshold: number;
  sla_window_days: number;
  vendor_allowlist: string | null;
  max_executions: number;
  timeout_hours: number;
  status: 'active' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreatePolicyInput {
  user_id: number;
  subscription_name: string;
  vendor: string;
  max_price: number;
  period: 'monthly' | 'yearly';
  sla_threshold: number;
  sla_window_days?: number;
  vendor_allowlist?: string[];
  max_executions?: number;
  timeout_hours?: number;
}

export interface UpdatePolicyInput {
  subscription_name?: string;
  vendor?: string;
  max_price?: number;
  period?: 'monthly' | 'yearly';
  sla_threshold?: number;
  sla_window_days?: number;
  vendor_allowlist?: string[];
  max_executions?: number;
  timeout_hours?: number;
  status?: 'active' | 'paused' | 'cancelled';
}

/**
 * Creates a new policy
 */
export function createPolicy(input: CreatePolicyInput): Policy {
  const stmt = db.prepare(`
    INSERT INTO policies (
      user_id, subscription_name, vendor, max_price, period,
      sla_threshold, sla_window_days, vendor_allowlist, max_executions, timeout_hours
    )
    VALUES (
      @user_id, @subscription_name, @vendor, @max_price, @period,
      @sla_threshold, @sla_window_days, @vendor_allowlist, @max_executions, @timeout_hours
    )
  `);
  
  const result = stmt.run({
    user_id: input.user_id,
    subscription_name: input.subscription_name,
    vendor: input.vendor,
    max_price: input.max_price,
    period: input.period,
    sla_threshold: input.sla_threshold,
    sla_window_days: input.sla_window_days || 30,
    vendor_allowlist: input.vendor_allowlist ? JSON.stringify(input.vendor_allowlist) : null,
    max_executions: input.max_executions || 1,
    timeout_hours: input.timeout_hours || 24,
  });
  
  return getPolicyById(result.lastInsertRowid as number)!;
}

/**
 * Gets a policy by ID
 */
export function getPolicyById(id: number): Policy | undefined {
  const stmt = db.prepare('SELECT * FROM policies WHERE id = ?');
  return stmt.get(id) as Policy | undefined;
}

/**
 * Gets all policies for a user
 */
export function getPoliciesByUserId(userId: number): Policy[] {
  const stmt = db.prepare('SELECT * FROM policies WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId) as Policy[];
}

/**
 * Gets active policies for a user
 */
export function getActivePoliciesByUserId(userId: number): Policy[] {
  const stmt = db.prepare('SELECT * FROM policies WHERE user_id = ? AND status = ? ORDER BY created_at DESC');
  return stmt.all(userId, 'active') as Policy[];
}

/**
 * Updates a policy
 */
export function updatePolicy(id: number, input: UpdatePolicyInput): Policy | undefined {
  const fields: string[] = [];
  const values: Record<string, any> = { id };
  
  if (input.subscription_name !== undefined) {
    fields.push('subscription_name = @subscription_name');
    values.subscription_name = input.subscription_name;
  }
  if (input.vendor !== undefined) {
    fields.push('vendor = @vendor');
    values.vendor = input.vendor;
  }
  if (input.max_price !== undefined) {
    fields.push('max_price = @max_price');
    values.max_price = input.max_price;
  }
  if (input.period !== undefined) {
    fields.push('period = @period');
    values.period = input.period;
  }
  if (input.sla_threshold !== undefined) {
    fields.push('sla_threshold = @sla_threshold');
    values.sla_threshold = input.sla_threshold;
  }
  if (input.sla_window_days !== undefined) {
    fields.push('sla_window_days = @sla_window_days');
    values.sla_window_days = input.sla_window_days;
  }
  if (input.vendor_allowlist !== undefined) {
    fields.push('vendor_allowlist = @vendor_allowlist');
    values.vendor_allowlist = JSON.stringify(input.vendor_allowlist);
  }
  if (input.max_executions !== undefined) {
    fields.push('max_executions = @max_executions');
    values.max_executions = input.max_executions;
  }
  if (input.timeout_hours !== undefined) {
    fields.push('timeout_hours = @timeout_hours');
    values.timeout_hours = input.timeout_hours;
  }
  if (input.status !== undefined) {
    fields.push('status = @status');
    values.status = input.status;
  }
  
  if (fields.length === 0) {
    return getPolicyById(id);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  
  const stmt = db.prepare(`
    UPDATE policies SET ${fields.join(', ')} WHERE id = @id
  `);
  
  stmt.run(values);
  return getPolicyById(id);
}

/**
 * Deletes a policy
 */
export function deletePolicy(id: number): boolean {
  const stmt = db.prepare('DELETE FROM policies WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============================================
// Intent Model
// ============================================

export interface Intent {
  id: number;
  policy_id: number;
  encrypted_payload: string;
  condition_hash: string | null;
  status: 'pending' | 'executed' | 'blocked' | 'expired';
  expires_at: string;
  executed_at: string | null;
  created_at: string;
}

export interface CreateIntentInput {
  policy_id: number;
  encrypted_payload: string;
  condition_hash?: string;
  expires_at: string;
}

/**
 * Creates a new intent
 */
export function createIntent(input: CreateIntentInput): Intent {
  const stmt = db.prepare(`
    INSERT INTO intents (policy_id, encrypted_payload, condition_hash, expires_at)
    VALUES (@policy_id, @encrypted_payload, @condition_hash, @expires_at)
  `);
  
  const result = stmt.run({
    policy_id: input.policy_id,
    encrypted_payload: input.encrypted_payload,
    condition_hash: input.condition_hash || null,
    expires_at: input.expires_at,
  });
  
  return getIntentById(result.lastInsertRowid as number)!;
}

/**
 * Gets an intent by ID
 */
export function getIntentById(id: number): Intent | undefined {
  const stmt = db.prepare('SELECT * FROM intents WHERE id = ?');
  return stmt.get(id) as Intent | undefined;
}

/**
 * Gets all intents for a policy
 */
export function getIntentsByPolicyId(policyId: number): Intent[] {
  const stmt = db.prepare('SELECT * FROM intents WHERE policy_id = ? ORDER BY created_at DESC');
  return stmt.all(policyId) as Intent[];
}

/**
 * Gets pending intents that haven't expired
 */
export function getPendingIntents(): Intent[] {
  const stmt = db.prepare(`
    SELECT * FROM intents 
    WHERE status = 'pending' AND expires_at > datetime('now')
    ORDER BY created_at ASC
  `);
  return stmt.all() as Intent[];
}

/**
 * Updates an intent's status
 */
export function updateIntentStatus(
  id: number, 
  status: 'pending' | 'executed' | 'blocked' | 'expired'
): Intent | undefined {
  const executedAt = status === 'executed' ? "datetime('now')" : null;
  
  const stmt = db.prepare(`
    UPDATE intents 
    SET status = ?, executed_at = ${executedAt ? '?' : 'NULL'}
    WHERE id = ?
  `);
  
  if (executedAt) {
    stmt.run(status, new Date().toISOString(), id);
  } else {
    stmt.run(status, id);
  }
  
  return getIntentById(id);
}

// ============================================
// Receipt Model
// ============================================

export interface Receipt {
  id: number;
  intent_id: number;
  agent_name: string;
  subscription: string;
  condition: string;
  condition_result: 'PASS' | 'FAIL';
  executed: boolean;
  amount: number | null;
  tx_hash: string | null;
  reason: string | null;
  guardrail_check: string | null;
  timestamp: string;
}

export interface CreateReceiptInput {
  intent_id: number;
  agent_name: string;
  subscription: string;
  condition: string;
  condition_result: 'PASS' | 'FAIL';
  executed: boolean;
  amount?: number;
  tx_hash?: string;
  reason?: string;
  guardrail_check?: Record<string, boolean>;
}

/**
 * Creates a new receipt
 */
export function createReceipt(input: CreateReceiptInput): Receipt {
  const stmt = db.prepare(`
    INSERT INTO receipts (
      intent_id, agent_name, subscription, condition, condition_result,
      executed, amount, tx_hash, reason, guardrail_check
    )
    VALUES (
      @intent_id, @agent_name, @subscription, @condition, @condition_result,
      @executed, @amount, @tx_hash, @reason, @guardrail_check
    )
  `);
  
  const result = stmt.run({
    intent_id: input.intent_id,
    agent_name: input.agent_name,
    subscription: input.subscription,
    condition: input.condition,
    condition_result: input.condition_result,
    executed: input.executed ? 1 : 0,
    amount: input.amount || null,
    tx_hash: input.tx_hash || null,
    reason: input.reason || null,
    guardrail_check: input.guardrail_check ? JSON.stringify(input.guardrail_check) : null,
  });
  
  return getReceiptById(result.lastInsertRowid as number)!;
}

/**
 * Gets a receipt by ID
 */
export function getReceiptById(id: number): Receipt | undefined {
  const stmt = db.prepare('SELECT * FROM receipts WHERE id = ?');
  return stmt.get(id) as Receipt | undefined;
}

/**
 * Gets receipt by intent ID
 */
export function getReceiptByIntentId(intentId: number): Receipt | undefined {
  const stmt = db.prepare('SELECT * FROM receipts WHERE intent_id = ? ORDER BY timestamp DESC LIMIT 1');
  return stmt.get(intentId) as Receipt | undefined;
}

/**
 * Gets all receipts for a user (via policy -> intent)
 */
export function getReceiptsByUserId(userId: number): Receipt[] {
  const stmt = db.prepare(`
    SELECT r.* FROM receipts r
    JOIN intents i ON r.intent_id = i.id
    JOIN policies p ON i.policy_id = p.id
    WHERE p.user_id = ?
    ORDER BY r.timestamp DESC
  `);
  return stmt.all(userId) as Receipt[];
}

// ============================================
// Audit Log Model
// ============================================

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

export interface CreateAuditLogInput {
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Creates an audit log entry
 */
export function createAuditLog(input: CreateAuditLogInput): AuditLog {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      user_id, action, entity_type, entity_id, details, ip_address, user_agent
    )
    VALUES (
      @user_id, @action, @entity_type, @entity_id, @details, @ip_address, @user_agent
    )
  `);
  
  const result = stmt.run({
    user_id: input.user_id || null,
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id || null,
    details: input.details ? JSON.stringify(input.details) : null,
    ip_address: input.ip_address || null,
    user_agent: input.user_agent || null,
  });
  
  return getAuditLogById(result.lastInsertRowid as number)!;
}

/**
 * Gets an audit log by ID
 */
export function getAuditLogById(id: number): AuditLog | undefined {
  const stmt = db.prepare('SELECT * FROM audit_logs WHERE id = ?');
  return stmt.get(id) as AuditLog | undefined;
}

/**
 * Gets audit logs with optional filters
 */
export function getAuditLogs(options: {
  userId?: number;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): AuditLog[] {
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: Record<string, any> = {};
  
  if (options.userId !== undefined) {
    query += ' AND user_id = @userId';
    params.userId = options.userId;
  }
  if (options.action) {
    query += ' AND action = @action';
    params.action = options.action;
  }
  if (options.entityType) {
    query += ' AND entity_type = @entityType';
    params.entityType = options.entityType;
  }
  if (options.startDate) {
    query += ' AND timestamp >= @startDate';
    params.startDate = options.startDate;
  }
  if (options.endDate) {
    query += ' AND timestamp <= @endDate';
    params.endDate = options.endDate;
  }
  
  query += ' ORDER BY timestamp DESC';
  
  if (options.limit) {
    query += ' LIMIT @limit';
    params.limit = options.limit;
  }
  if (options.offset) {
    query += ' OFFSET @offset';
    params.offset = options.offset;
  }
  
  const stmt = db.prepare(query);
  return stmt.all(params) as AuditLog[];
}

// ============================================
// Utility Functions
// ============================================

/**
 * Parses vendor allowlist from JSON string
 */
export function parseVendorAllowlist(policy: Policy): string[] {
  if (!policy.vendor_allowlist) return [];
  try {
    return JSON.parse(policy.vendor_allowlist);
  } catch {
    return [];
  }
}

/**
 * Parses guardrail check from JSON string
 */
export function parseGuardrailCheck(receipt: Receipt): Record<string, boolean> | null {
  if (!receipt.guardrail_check) return null;
  try {
    return JSON.parse(receipt.guardrail_check);
  } catch {
    return null;
  }
}

export default {
  initializeDatabase,
  // Users
  createUser,
  getUserById,
  getUserByEmail,
  // Policies
  createPolicy,
  getPolicyById,
  getPoliciesByUserId,
  getActivePoliciesByUserId,
  updatePolicy,
  deletePolicy,
  // Intents
  createIntent,
  getIntentById,
  getIntentsByPolicyId,
  getPendingIntents,
  updateIntentStatus,
  // Receipts
  createReceipt,
  getReceiptById,
  getReceiptByIntentId,
  getReceiptsByUserId,
  // Audit
  createAuditLog,
  getAuditLogById,
  getAuditLogs,
  // Utilities
  parseVendorAllowlist,
  parseGuardrailCheck,
};
