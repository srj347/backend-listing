enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

const getLogLevel = (): LogLevel => {
  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'production':
      return LogLevel.INFO;
    case 'test':
      return LogLevel.SILENT;
    default:
      return LogLevel.DEBUG;
  }
};

const currentLogLevel = getLogLevel();

const log = (level: LogLevel, message: string, ...args: any[]): void => {
  if (level >= currentLogLevel) {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    console.log(`[${timestamp}] [${levelName}] ${message}`, ...args);
  }
};

export const logger = {
  debug: (message: string, ...args: any[]) => log(LogLevel.DEBUG, message, ...args),
  info: (message: string, ...args: any[]) => log(LogLevel.INFO, message, ...args),
  warn: (message: string, ...args: any[]) => log(LogLevel.WARN, message, ...args),
  error: (message: string, ...args: any[]) => log(LogLevel.ERROR, message, ...args),
  
  isDevelopment: (): boolean => (process.env.NODE_ENV || 'development') === 'development',
  isProduction: (): boolean => process.env.NODE_ENV === 'production',
};

