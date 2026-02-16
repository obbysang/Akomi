/**
 * Utility Functions
 * 
 * Helper functions used throughout the backend.
 */

import crypto from 'crypto';

/**
 * Generates a random string of specified length
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generates a UUID-like string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Hashes a string using SHA-256
 */
export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Safely parses JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Formats a date to ISO string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Truncates a string to specified length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Validates a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Debounces a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleeps for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamps a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Converts a decimal to percentage
 */
export function toPercent(value: number, decimals: number = 2): number {
  return parseFloat((value * 100).toFixed(decimals));
}

export default {
  generateRandomString,
  generateUUID,
  hashString,
  isValidEmail,
  safeJsonParse,
  formatDate,
  truncate,
  isValidUrl,
  debounce,
  sleep,
  clamp,
  toPercent,
};
