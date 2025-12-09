/**
 * Centralized Logger Utility
 * Handles environment-based logging with consistent formatting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  timestamp: boolean;
  colorize: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS = {
  reset: '\x1b[0m',
  debug: '\x1b[36m',  // Cyan
  info: '\x1b[32m',   // Green
  warn: '\x1b[33m',   // Yellow
  error: '\x1b[31m',  // Red
  timestamp: '\x1b[90m', // Gray
};

class Logger {
  private config: LogConfig;
  private minLevel: number;

  constructor() {
    const env = process.env.NODE_ENV || 'development';
    const configuredLevel = (process.env.LOG_LEVEL as LogLevel) || (env === 'production' ? 'info' : 'debug');

    this.config = {
      level: configuredLevel,
      timestamp: true,
      colorize: env !== 'production',
    };

    this.minLevel = LOG_LEVELS[this.config.level];
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private formatTimestamp(): string {
    if (!this.config.timestamp) return '';
    const timestamp = new Date().toISOString();
    return this.config.colorize 
      ? `${COLORS.timestamp}[${timestamp}]${COLORS.reset} `
      : `[${timestamp}] `;
  }

  private formatLevel(level: LogLevel): string {
    const levelStr = level.toUpperCase().padEnd(5);
    return this.config.colorize
      ? `${COLORS[level]}${levelStr}${COLORS.reset}`
      : levelStr;
  }

  private formatMessage(level: LogLevel, message: string, meta?: object): string {
    const timestamp = this.formatTimestamp();
    const levelStr = this.formatLevel(level);
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp}${levelStr} ${message}${metaStr}`;
  }

  debug(message: string, meta?: object): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  info(message: string, meta?: object): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  warn(message: string, meta?: object): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  error(message: string, error?: Error | unknown, meta?: object): void {
    if (this.shouldLog('error')) {
      const errorMeta = error instanceof Error
        ? { 
            errorName: error.name, 
            errorMessage: error.message,
            ...(this.isDevelopment() && { stack: error.stack }),
            ...meta 
          }
        : { error, ...meta };
      
      console.error(this.formatMessage('error', message, errorMeta));
    }
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Log only in development mode
   */
  dev(message: string, meta?: object): void {
    if (this.isDevelopment()) {
      this.debug(message, meta);
    }
  }

  /**
   * Create a child logger with a prefix
   */
  child(prefix: string): ChildLogger {
    return new ChildLogger(this, prefix);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private prefix: string
  ) {}

  private formatMessage(message: string): string {
    return `[${this.prefix}] ${message}`;
  }

  debug(message: string, meta?: object): void {
    this.parent.debug(this.formatMessage(message), meta);
  }

  info(message: string, meta?: object): void {
    this.parent.info(this.formatMessage(message), meta);
  }

  warn(message: string, meta?: object): void {
    this.parent.warn(this.formatMessage(message), meta);
  }

  error(message: string, error?: Error | unknown, meta?: object): void {
    this.parent.error(this.formatMessage(message), error, meta);
  }

  dev(message: string, meta?: object): void {
    this.parent.dev(this.formatMessage(message), meta);
  }

  isDevelopment(): boolean {
    return this.parent.isDevelopment();
  }

  isProduction(): boolean {
    return this.parent.isProduction();
  }
}

export const logger = new Logger();

export type { LogLevel, LogConfig };

