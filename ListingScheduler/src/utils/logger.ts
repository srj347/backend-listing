type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const levelStr = `[${level.toUpperCase()}]`;
    
    let logMessage = `[${timestamp}] ${levelStr} ${message}`;
    
    if (data !== undefined) {
      if (data instanceof Error) {
        logMessage += `\n${data.stack || data.message}`;
      } else if (typeof data === 'object') {
        logMessage += ` ${JSON.stringify(data)}`;
      } else {
        logMessage += ` ${data}`;
      }
    }
    
    return logMessage;
  }

  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: unknown): void {
    console.log(this.formatMessage('info', message, data));
  }

  warn(message: string, data?: unknown): void {
    console.warn(this.formatMessage('warn', message, data));
  }

  error(message: string, error?: unknown): void {
    console.error(this.formatMessage('error', message, error));
  }
}

export const logger = new Logger();

