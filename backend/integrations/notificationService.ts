/**
 * Notification Service
 * 
 * Stub implementation for external notification services.
 * In production, this would integrate with:
 * - Slack webhooks for team notifications
 * - Email services (SendGrid, AWS SES, etc.)
 * - PagerDuty for incident management
 * - Cloud monitoring services
 */

import { ExecutionReceipt } from '../../types';
import { externalApis } from '../config';

// ============================================
// Notification Types
// ============================================

export interface Notification {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// Notification Service Interface
// ============================================

export interface NotificationService {
  /**
   * Sends a notification
   */
  send(notification: Notification): Promise<NotificationResult>;
  
  /**
   * Sends execution result notification
   */
  sendExecutionResult(receipt: ExecutionReceipt): Promise<NotificationResult>;
  
  /**
   * Sends error notification
   */
  sendError(error: Error, context?: Record<string, any>): Promise<NotificationResult>;
}

// ============================================
// Console Notification Service (Default)
// ============================================

/**
 * Console-based notification service (for development)
 */
export class ConsoleNotificationService implements NotificationService {
  /**
   * Sends notification to console
   */
  async send(notification: Notification): Promise<NotificationResult> {
    const color = notification.type === 'error' ? '\x1b[31m' 
      : notification.type === 'warning' ? '\x1b[33m' 
      : notification.type === 'success' ? '\x1b[32m' 
      : '\x1b[36m';
    const reset = '\x1b[0m';
    
    console.log(`${color}[NOTIFICATION]${reset} ${notification.title}`);
    console.log(`  ${notification.message}`);
    if (notification.metadata) {
      console.log('  Metadata:', JSON.stringify(notification.metadata, null, 2));
    }
    
    return { success: true };
  }

  /**
   * Sends execution result notification
   */
  async sendExecutionResult(receipt: ExecutionReceipt): Promise<NotificationResult> {
    const notification: Notification = {
      type: receipt.executed ? 'success' : receipt.conditionResult === 'FAIL' ? 'warning' : 'error',
      title: receipt.executed 
        ? `Subscription Renewed: ${receipt.subscription}`
        : `Renewal Blocked: ${receipt.subscription}`,
      message: receipt.executed
        ? `Payment of $${receipt.amount} executed successfully`
        : `Condition not met: ${receipt.reason}`,
      metadata: {
        condition: receipt.condition,
        txHash: receipt.txHash,
        timestamp: receipt.timestamp,
      },
    };
    
    return this.send(notification);
  }

  /**
   * Sends error notification
   */
  async sendError(error: Error, context?: Record<string, any>): Promise<NotificationResult> {
    const notification: Notification = {
      type: 'error',
      title: 'Akomi Error',
      message: error.message,
      metadata: {
        stack: error.stack,
        ...context,
      },
    };
    
    return this.send(notification);
  }
}

// ============================================
// Slack Notification Service (Stub)
// ============================================

/**
 * Slack Webhook Notification Service
 * 
 * In production, implement actual Slack integration:
 * https://api.slack.com/messaging/webhooks
 */
export class SlackNotificationService implements NotificationService {
  private webhookUrl: string;
  private channel?: string;

  constructor(webhookUrl: string, channel?: string) {
    this.webhookUrl = webhookUrl;
    this.channel = channel;
  }

  async send(notification: Notification): Promise<NotificationResult> {
    // In production:
    // const payload = {
    //   channel: this.channel,
    //   text: notification.title,
    //   blocks: [
    //     {
    //       type: 'header',
    //       text: { type: 'plain_text', text: notification.title }
    //     },
    //     {
    //       type: 'section',
    //       text: { type: 'mrkdwn', text: notification.message }
    //     }
    //   ]
    // };
    // const response = await fetch(this.webhookUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    
    if (!externalApis.slackWebhookUrl) {
      console.log('[Slack] No webhook URL configured, skipping notification');
      return { success: false, error: 'Slack webhook not configured' };
    }
    
    console.log(`[Slack] Would send: ${notification.title}`);
    return { success: true };
  }

  async sendExecutionResult(receipt: ExecutionReceipt): Promise<NotificationResult> {
    const emoji = receipt.executed ? '✅' : '❌';
    const notification: Notification = {
      type: receipt.executed ? 'success' : 'warning',
      title: `${emoji} Subscription Renewal: ${receipt.subscription}`,
      message: receipt.executed
        ? `Payment of $${receipt.amount} executed`
        : `Blocked: ${receipt.reason}`,
      metadata: { txHash: receipt.txHash },
    };
    
    return this.send(notification);
  }

  async sendError(error: Error, context?: Record<string, any>): Promise<NotificationResult> {
    const notification: Notification = {
      type: 'error',
      title: '🔴 Akomi Error',
      message: error.message,
      metadata: context,
    };
    
    return this.send(notification);
  }
}

// ============================================
// Email Notification Service (Stub)
// ============================================

/**
 * Email Notification Service
 * 
 * In production, implement SendGrid, AWS SES, or other email service:
 * https://docs.sendgrid.com/
 */
export class EmailNotificationService implements NotificationService {
  private apiKey: string;
  private fromEmail: string;
  private toEmails: string[];

  constructor(apiKey: string, fromEmail: string, toEmails: string[]) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    this.toEmails = toEmails;
  }

  async send(notification: Notification): Promise<NotificationResult> {
    // In production:
    // import sgMail from '@sendgrid/mail';
    // sgMail.setApiKey(this.apiKey);
    // const msg = {
    //   to: this.toEmails,
    //   from: this.fromEmail,
    //   subject: notification.title,
    //   html: `<p>${notification.message}</p>`,
    // };
    // await sgMail.send(msg);
    
    if (!externalApis.emailApiKey) {
      console.log('[Email] No API key configured, skipping notification');
      return { success: false, error: 'Email API not configured' };
    }
    
    console.log(`[Email] Would send: ${notification.title} to ${this.toEmails.join(', ')}`);
    return { success: true };
  }

  async sendExecutionResult(receipt: ExecutionReceipt): Promise<NotificationResult> {
    const notification: Notification = {
      type: receipt.executed ? 'success' : 'warning',
      title: `Akomi: Subscription ${receipt.executed ? 'Renewed' : 'Blocked'}`,
      message: receipt.executed
        ? `Your subscription ${receipt.subscription} has been renewed for $${receipt.amount}`
        : `Your renewal was blocked: ${receipt.reason}`,
      metadata: { txHash: receipt.txHash },
    };
    
    return this.send(notification);
  }

  async sendError(error: Error, context?: Record<string, any>): Promise<NotificationResult> {
    const notification: Notification = {
      type: 'error',
      title: 'Akomi Error Alert',
      message: `An error occurred: ${error.message}`,
      metadata: context,
    };
    
    return this.send(notification);
  }
}

// ============================================
// Factory Function
// ============================================

/**
 * Creates a notification service based on configuration
 */
export function createNotificationService(): NotificationService {
  // Return console service by default
  return new ConsoleNotificationService();
}

// ============================================
// Default Export
// ============================================

export const notificationService = createNotificationService();

export default {
  ConsoleNotificationService,
  SlackNotificationService,
  EmailNotificationService,
  createNotificationService,
  notificationService,
};
