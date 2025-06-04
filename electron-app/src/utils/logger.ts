import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';

class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(app.getPath('userData'), 'logs');
    this.logFile = path.join(this.logDir, `app-${format(new Date(), 'yyyy-MM-dd')}.log`);

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: string, error?: any): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
    const errorDetails = error ? `\nError: ${error instanceof Error ? error.stack : error}` : '';
    return `[${timestamp}] ${level}: ${message}${errorDetails}\n`;
  }

  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFile, message);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message: string): void {
    const formattedMessage = this.formatMessage('INFO', message);
    console.info(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  error(message: string, error?: any): void {
    const formattedMessage = this.formatMessage('ERROR', message, error);
    console.error(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  warn(message: string, error?: any): void {
    const formattedMessage = this.formatMessage('WARN', message, error);
    console.warn(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  debug(message: string, error?: any): void {
    const formattedMessage = this.formatMessage('DEBUG', message, error);
    console.debug(formattedMessage);
    this.writeToFile(formattedMessage);
  }
}

export const logger = new Logger(); 