import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { createLogStream, getLogFilePath, getLogDirectory } from './logStream';

const MAX_LOG_AGE_DAYS = 30; // Keep logs for 30 days

function cleanupOldLogs() {
  try {
    const logDir = getLogDirectory();
    const files = fs.readdirSync(logDir);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
      
      if (ageInDays > MAX_LOG_AGE_DAYS) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old logs:', error);
  }
}

// Clean up old logs on startup
cleanupOldLogs();

let logStream = createLogStream();

// Rotate logs every hour
setInterval(() => {
  logStream.end();
  logStream = createLogStream();
}, 60 * 60 * 1000);

// Clean up old logs daily
setInterval(() => {
  cleanupOldLogs();
}, 24 * 60 * 60 * 1000);

export const logger = {
  info: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message} ${args.length ? JSON.stringify(args) : ''}\n`;
    console.log(logMessage);
    logStream.write(logMessage);
  },

  error: (message: string, error?: Error) => {
    const timestamp = new Date().toISOString();
    const errorDetails = error ? `\n${error.stack || error.message}` : '';
    const logMessage = `[${timestamp}] ERROR: ${message}${errorDetails}\n`;
    console.error(logMessage);
    logStream.write(logMessage);
  },

  warn: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message} ${args.length ? JSON.stringify(args) : ''}\n`;
    console.warn(logMessage);
    logStream.write(logMessage);
  },

  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] DEBUG: ${message} ${args.length ? JSON.stringify(args) : ''}\n`;
      console.debug(logMessage);
      logStream.write(logMessage);
    }
  },

  // Add method to get log file path for UI
  getLogFilePath,

  // Add method to get recent logs
  getRecentLogs: (lines: number = 100) => {
    try {
      const logFile = getLogFilePath();
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf-8');
        const logLines = content.split('\n').filter(line => line.trim());
        return logLines.slice(-lines);
      }
      return [];
    } catch (error) {
      console.error('Error reading logs:', error);
      return [];
    }
  },

  // Add method to get log directory size
  getLogDirectorySize: () => {
    try {
      const logDir = getLogDirectory();
      let totalSize = 0;
      const files = fs.readdirSync(logDir);
      for (const file of files) {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
      return totalSize;
    } catch (error) {
      console.error('Error getting log directory size:', error);
      return 0;
    }
  },

  // Add method to recreate log stream
  recreateLogStream: () => {
    logStream.end();
    logStream = createLogStream();
  }
}; 