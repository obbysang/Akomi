/**
 * Backend Configuration Module
 * 
 * Centralized configuration management for Akomi backend.
 * All environment variables and API keys are defined here.
 * 
 * Usage:
 *   import { config } from './config';
 *   console.log(config.database.path);
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================
// Server Configuration
// ============================================
export const serverConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: '/api',
};

// ============================================
// Database Configuration
// ============================================
export const databaseConfig = {
  type: process.env.DB_TYPE || 'sqlite',
  path: process.env.DB_PATH || './akomi.db',
  // For PostgreSQL (future)
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  name: process.env.DB_NAME || 'akomi',
  username: process.env.DB_USER || 'akomi',
  password: process.env.DB_PASSWORD || '',
};

// ============================================
// Authentication Configuration
// ============================================
export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'akomi-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  bcryptRounds: 10,
  // Session configuration
  sessionMaxAge: 24 * 60 * 60 * 1000, // 24 hours
};

// ============================================
// SKALE BITE Protocol Configuration
// ============================================
export const biteConfig = {
  // SKALE Network Configuration
  networkId: process.env.SKALE_NETWORK_ID || 'skale-mainnet',
  contractAddress: process.env.BITE_CONTRACT_ADDRESS || '',
  
  // Threshold Configuration
  threshold: parseInt(process.env.BITE_THRESHOLD || '2', 10),
  totalValidators: parseInt(process.env.BITE_VALIDATORS || '3', 10),
  
  // Encryption Settings
  algorithm: 'AES-256-GCM',
  keyLength: 256,
  
  // RPC Endpoint for SKALE
  rpcUrl: process.env.SKALE_RPC_URL || '',
};

// ============================================
// CDP Wallet Configuration
// ============================================
export const cdpConfig = {
  apiKey: process.env.CDP_API_KEY || '',
  apiSecret: process.env.CDP_API_SECRET || '',
};

// ============================================
// x402 Payment Protocol Configuration
// ============================================
export const x402Config = {
  enabled: process.env.USE_X402 === 'true',
  endpoint: process.env.X402_ENDPOINT || 'https://api.x402.org/pay',
  paymentToken: process.env.PAYMENT_TOKEN || 'USDC',
};

// ============================================
// Payment Configuration
// ============================================
export const paymentConfig = {
  // Network
  network: (process.env.PAYMENT_NETWORK as 'mainnet' | 'testnet' | 'skale') || 'skale',
  rpcUrl: process.env.SKALE_RPC_URL || '',
  
  // Wallet Configuration
  walletPrivateKey: process.env.WALLET_PRIVATE_KEY || '',
  merchantAddress: process.env.MERCHANT_ADDRESS || '',
  
  // x402 Configuration
  useX402: process.env.USE_X402 === 'true',
  
  // Payment defaults
  defaultGasLimit: 21000,
  maxGasPrice: '100', // gwei
  
  // Payment token
  token: process.env.PAYMENT_TOKEN || 'USDC',
};

// ============================================
// SLA / Metrics Provider Configuration
// ============================================
export const slaConfig = {
  // API Configuration
  apiEndpoint: process.env.SLA_API_ENDPOINT || '',
  apiKey: process.env.SLA_API_KEY || '',
  provider: (process.env.SLA_PROVIDER as 'custom' | 'datadog' | 'newrelic' | 'cloudwatch') || 'custom',
  
  // Default settings
  defaultWindowDays: 30,
  timeout: 10000, // 10 seconds
  
  // Set to false for production real data
  useMockMetrics: process.env.USE_MOCK_SLA === 'true',
};

// ============================================
// External API Keys (Placeholders)
// ============================================
export const externalApis = {
  // Slack for notifications
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  slackBotToken: process.env.SLACK_BOT_TOKEN || '',
  
  // Email service (SendGrid, etc.)
  emailApiKey: process.env.EMAIL_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@akomi.app',
  
  // Cloud monitoring (optional)
  cloudWatchEnabled: process.env.CLOUDWATCH_ENABLED === 'true',
  googleCloudEnabled: process.env.GOOGLE_CLOUD_ENABLED === 'true',
  
  // Vendor API keys (for future integrations)
  vendorApiKeys: process.env.VENDOR_API_KEYS || '',
};

// ============================================
// Logging Configuration
// ============================================
export const loggingConfig = {
  level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  format: process.env.LOG_FORMAT || 'json',
  enableConsole: process.env.LOG_CONSOLE !== 'false',
  enableFile: process.env.LOG_FILE === 'true',
  logPath: process.env.LOG_PATH || './logs',
};

// ============================================
// Agent Scheduler Configuration
// ============================================
export const schedulerConfig = {
  // Enable/disable automatic scheduling
  enabled: process.env.SCHEDULER_ENABLED !== 'false',
  
  // Check interval in milliseconds (default: every hour)
  checkIntervalMs: parseInt(process.env.SCHEDULER_INTERVAL_MS || '3600000', 10),
  
  // Maximum concurrent executions
  maxConcurrentExecutions: parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '5', 10),
  
  // Retry configuration
  maxRetries: parseInt(process.env.SCHEDULER_MAX_RETRIES || '3', 10),
  retryDelayMs: parseInt(process.env.SCHEDULER_RETRY_DELAY || '5000', 10),
};

// ============================================
// Feature Flags
// ============================================
export const features = {
  // Enable/disable features
  auth: process.env.FEATURE_AUTH !== 'false',
  encryption: process.env.FEATURE_ENCRYPTION !== 'false',
  payments: process.env.FEATURE_PAYMENTS !== 'false',
  notifications: process.env.FEATURE_NOTIFICATIONS === 'true',
  auditLogging: process.env.FEATURE_AUDIT !== 'false',
  scheduler: process.env.FEATURE_SCHEDULER !== 'false',
};

// ============================================
// Default Export
// ============================================
export const config = {
  server: serverConfig,
  database: databaseConfig,
  auth: authConfig,
  bite: biteConfig,
  cdp: cdpConfig,
  x402: x402Config,
  sla: slaConfig,
  payment: paymentConfig,
  external: externalApis,
  logging: loggingConfig,
  scheduler: schedulerConfig,
  features,
};

export default config;
