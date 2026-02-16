/**
 * Logging Middleware
 * 
 * Request/response logging middleware for Akomi backend.
 * Provides structured logging for debugging and monitoring.
 */

import { Request, Response, NextFunction } from 'express';
import { loggingConfig } from '../config';

// ============================================
// Logger Interface
// ============================================

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
}

/**
 * Simple console logger with level filtering
 */
class Logger {
  private level: number;
  private levels = { debug: 0, info: 1, warn: 2, error: 3 };

  constructor(level: string) {
    this.level = this.levels[level as keyof typeof this.levels] ?? 1;
  }

  private log(level: keyof typeof this.levels, message: string, context?: Record<string, any>): void {
    if (this.levels[level] < this.level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (loggingConfig.format === 'json') {
      console.log(JSON.stringify(entry));
    } else {
      const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
      const reset = '\x1b[0m';
      console.log(`${color}[${entry.timestamp}] ${level.toUpperCase()}:${reset} ${message}`, context || '');
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }
}

export const logger = new Logger(loggingConfig.level);

// ============================================
// Request Logging Middleware
// ============================================

/**
 * Logs incoming HTTP requests
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}

export default {
  logger,
  requestLogger,
};
