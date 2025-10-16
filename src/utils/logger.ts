import { env } from '../config/env.js';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  private level: number;

  constructor(level: LogLevel = 'info') {
    this.level = LOG_LEVELS[level];
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= this.level;
  }

  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${levelStr} ${message}${metaStr}`;
  }

  error(message: string, meta?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message: string, meta?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message: string, meta?: unknown): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  debug(message: string, meta?: unknown): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

export const logger = new Logger(env.LOG_LEVEL);
