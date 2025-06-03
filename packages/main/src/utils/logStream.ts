import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_LOG_FILES = 5;

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function rotateLogs() {
  try {
    // Check if current log file exceeds max size
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size >= MAX_LOG_SIZE) {
        // Rotate existing log files
        for (let i = MAX_LOG_FILES - 1; i >= 0; i--) {
          const oldPath = i === 0 ? LOG_FILE : path.join(LOG_DIR, `app.${i}.log`);
          const newPath = path.join(LOG_DIR, `app.${i + 1}.log`);
          
          if (fs.existsSync(oldPath)) {
            if (i === MAX_LOG_FILES - 1) {
              // Delete oldest log file
              fs.unlinkSync(oldPath);
            } else {
              // Move log file
              fs.renameSync(oldPath, newPath);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error rotating logs:', error);
  }
}

export function createLogStream() {
  rotateLogs();
  return fs.createWriteStream(LOG_FILE, { flags: 'a' });
}

export function getLogFilePath() {
  return LOG_FILE;
}

export function getLogDirectory() {
  return LOG_DIR;
} 