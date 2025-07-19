interface LogLevel {
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
  DEBUG: 'debug';
}

const LOG_LEVEL: LogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug'
};

class Logger {
  private formatMessage(level: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const baseLog = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      return `${baseLog} ${JSON.stringify(data, null, 2)}`;
    }
    
    return baseLog;
  }

  info(message: string, data?: unknown): void {
    console.log(this.formatMessage(LOG_LEVEL.INFO, message, data));
  }

  warn(message: string, data?: unknown): void {
    console.warn(this.formatMessage(LOG_LEVEL.WARN, message, data));
  }

  error(message: string, error?: Error | unknown): void {
    console.error(this.formatMessage(LOG_LEVEL.ERROR, message, error));
  }

  debug(message: string, data?: unknown): void {
    if (process.env['NODE_ENV'] === 'development') {
      console.debug(this.formatMessage(LOG_LEVEL.DEBUG, message, data));
    }
  }
}

export const logger = new Logger();