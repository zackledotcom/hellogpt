import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ChromaClient } from 'chromadb';
import { WindowManager } from './modules/WindowManager';
import { validateStartup } from './startupValidation';
import { logger } from './utils/logger';
import { createLogStream, getLogDirectory } from './utils/logStream';
import fs from 'fs';

const execAsync = promisify(exec);

// Initialize ChromaDB with persistence
const chromaClient = new ChromaClient({
  path: path.join(app.getPath('userData'), 'chroma')
});

// IPC Handlers
function setupIpcHandlers() {
  ipcMain.handle('create-collection', async (_, name: string) => {
    try {
      logger.info('Creating collection', { name });
      const collection = await chromaClient.createCollection({ name });
      return collection;
    } catch (error) {
      logger.error('Error creating collection', error instanceof Error ? error : new Error('Unknown error'));
      if (error instanceof Error) {
        throw new Error(`Failed to create collection: ${error.message}`);
      }
      throw new Error('Failed to create collection: Unknown error');
    }
  });

  ipcMain.handle('get-collection', async (_, name: string) => {
    try {
      logger.info('Getting collection', { name });
      const collection = await chromaClient.getCollection({ name });
      return collection;
    } catch (error) {
      logger.error('Error getting collection', error instanceof Error ? error : new Error('Unknown error'));
      if (error instanceof Error) {
        throw new Error(`Failed to get collection: ${error.message}`);
      }
      throw new Error('Failed to get collection: Unknown error');
    }
  });

  ipcMain.handle('list-collections', async () => {
    try {
      logger.info('Listing collections');
      const collections = await chromaClient.listCollections();
      return collections;
    } catch (error) {
      logger.error('Error listing collections', error instanceof Error ? error : new Error('Unknown error'));
      if (error instanceof Error) {
        throw new Error(`Failed to list collections: ${error.message}`);
      }
      throw new Error('Failed to list collections: Unknown error');
    }
  });

  ipcMain.handle('delete-collection', async (_, name: string) => {
    try {
      logger.info('Deleting collection', { name });
      await chromaClient.deleteCollection({ name });
      return true;
    } catch (error) {
      logger.error('Error deleting collection', error instanceof Error ? error : new Error('Unknown error'));
      if (error instanceof Error) {
        throw new Error(`Failed to delete collection: ${error.message}`);
      }
      throw new Error('Failed to delete collection: Unknown error');
    }
  });

  ipcMain.handle('query-collection', async (_, { name, query, nResults = 10 }) => {
    try {
      logger.info('Querying collection', { name, query, nResults });
      const collection = await chromaClient.getCollection({ name });
      const results = await collection.query({
        queryTexts: [query],
        nResults
      });
      return results;
    } catch (error) {
      logger.error('Error querying collection', error instanceof Error ? error : new Error('Unknown error'));
      if (error instanceof Error) {
        throw new Error(`Failed to query collection: ${error.message}`);
      }
      throw new Error('Failed to query collection: Unknown error');
    }
  });

  // Log viewing handlers
  ipcMain.handle('logs:get-path', () => {
    return logger.getLogFilePath();
  });

  ipcMain.handle('logs:get-recent', (_, lines: number) => {
    return logger.getRecentLogs(lines);
  });

  ipcMain.handle('logs:open-folder', () => {
    const logDir = getLogDirectory();
    require('electron').shell.openPath(logDir);
  });

  // Add log management handlers
  ipcMain.handle('logs:get-size', () => {
    return logger.getLogDirectorySize();
  });

  ipcMain.handle('logs:clear', () => {
    try {
      const logDir = getLogDirectory();
      const files = fs.readdirSync(logDir);
      for (const file of files) {
        fs.unlinkSync(path.join(logDir, file));
      }
      // Recreate the log stream
      logger.recreateLogStream();
      return true;
    } catch (error) {
      logger.error('Error clearing logs', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  });
}

async function main() {
  try {
    logger.info('Starting application');
    
    // Wait for Electron to be ready
    await app.whenReady();
    logger.info('Electron app ready');

    // Run startup validation
    const validationResult = await validateStartup();
    if (!validationResult.success) {
      logger.error('Startup validation failed', new Error(validationResult.errors.join('\n')));
      app.quit();
      return;
    }
    logger.info('Startup validation passed');

    // Initialize window manager
    const windowManager = new WindowManager(path.join(__dirname, '../preload/dist/index.cjs'));
    await windowManager.enable({ app });
    logger.info('Window manager initialized');

    // Handle app lifecycle
    app.on('window-all-closed', () => {
      logger.info('All windows closed');
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      logger.info('App activated');
      if (BrowserWindow.getAllWindows().length === 0) {
        windowManager.enable({ app });
      }
    });

    setupIpcHandlers();
    logger.info('IPC handlers setup complete');
  } catch (error) {
    logger.error('Failed to start application', error instanceof Error ? error : new Error('Unknown error'));
    app.quit();
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  app.quit();
});

// Handle app exit
app.on('before-quit', () => {
  logger.info('Application shutting down');
  // Give time for final logs to be written
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

// Start the application
main();
