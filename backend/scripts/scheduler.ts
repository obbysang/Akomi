/**
 * Agent Scheduler
 * 
 * Automated scheduler for periodic condition checks on pending intents.
 * Runs at configured intervals to check and execute renewal workflows.
 * 
 * Usage:
 *   npx ts-node backend/scripts/scheduler.ts
 *   # or
 *   node backend/dist/scripts/scheduler.js
 * 
 * Environment:
 *   SCHEDULER_ENABLED=true/false
 *   SCHEDULER_INTERVAL_MS=3600000 (default: 1 hour)
 */

import { getPendingIntents } from '../models/database';
import { executeRenewalWorkflow } from '../services/agentService';
import { schedulerConfig } from '../config';
import { logger } from '../middleware/logging';

// ============================================
// Scheduler State
// ============================================

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

/**
 * Main scheduler loop
 */
async function schedulerLoop(): Promise<void> {
  if (isRunning) {
    logger.warn('Scheduler loop already running, skipping iteration');
    return;
  }

  isRunning = true;
  logger.info('Starting scheduler iteration...');

  try {
    // Get all pending intents
    const pendingIntents = getPendingIntents();
    
    logger.info(`Found ${pendingIntents.length} pending intents`);

    if (pendingIntents.length === 0) {
      logger.info('No pending intents to process');
      return;
    }

    // Process each pending intent
    for (const intent of pendingIntents) {
      try {
        logger.info(`Processing intent ${intent.id} (policy: ${intent.policy_id})`);
        
        const result = await executeRenewalWorkflow(intent.id);
        
        if (result.success) {
          logger.info(`Intent ${intent.id} executed successfully`, {
            executed: result.receipt?.executed,
            conditionResult: result.receipt?.conditionResult
          });
        } else {
          logger.warn(`Intent ${intent.id} execution failed`, {
            reason: result.receipt?.reason
          });
        }
      } catch (error) {
        logger.error(`Error processing intent ${intent.id}`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  } catch (error) {
    logger.error('Scheduler loop error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    isRunning = false;
  }
}

/**
 * Starts the scheduler
 */
export function startScheduler(): void {
  if (!schedulerConfig.enabled) {
    logger.info('Scheduler is disabled');
    return;
  }

  if (intervalId) {
    logger.warn('Scheduler already running');
    return;
  }

  logger.info(`Starting scheduler with interval: ${schedulerConfig.checkIntervalMs}ms`);

  // Run immediately on start
  schedulerLoop();

  // Schedule periodic runs
  intervalId = setInterval(schedulerLoop, schedulerConfig.checkIntervalMs);
}

/**
 * Stops the scheduler
 */
export function stopScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Scheduler stopped');
  }
}

/**
 * Manual trigger for testing
 */
export async function triggerNow(): Promise<void> {
  logger.info('Manual trigger initiated');
  await schedulerLoop();
  logger.info('Manual trigger completed');
}

// ============================================
// CLI Entry Point
// ============================================

// Run if executed directly
if (require.main === module) {
  console.log('Starting Akomi Agent Scheduler...');
  
  // Initialize
  import('../models/database').then(({ initializeDatabase }) => {
    initializeDatabase();
  });
  
  // Start scheduler
  startScheduler();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down scheduler...');
    stopScheduler();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\nShutting down scheduler...');
    stopScheduler();
    process.exit(0);
  });
}

export default {
  startScheduler,
  stopScheduler,
  triggerNow,
};
