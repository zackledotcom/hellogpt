import { app, BrowserWindow, ipcMain } from 'electron';
import { setupIpcHandlers } from './ipc/handlers';
import { logger } from './utils/logger';
import * as path from 'path';
import { ServiceManager } from './services/ServiceManager';
import { IPC_CHANNELS } from './ipc/channels';

class MainWindow {
  private mainWindow: BrowserWindow | null = null;
  private serviceManager: ServiceManager;

  constructor() {
    this.serviceManager = ServiceManager.getInstance();
    this.setupAppEvents();
  }

  private setupAppEvents(): void {
    app.on('ready', () => this.createWindow());
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private async createWindow(): Promise<void> {
    try {
      // Initialize services
      await this.initializeServices();

      // Create the browser window
      this.mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js'),
        },
      });

      // Load the app
      if (process.env.NODE_ENV === 'development') {
        await this.mainWindow.loadURL('http://localhost:3000');
        this.mainWindow.webContents.openDevTools();
      } else {
        await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
      }

      // Setup IPC handlers
      await setupIpcHandlers();

      // Start service monitoring
      this.serviceManager.startMonitoring();

      // Handle service status changes
      this.serviceManager.on('serviceStatusChanged', ({ serviceName, status, error }) => {
        if (this.mainWindow) {
          this.mainWindow.webContents.send(IPC_CHANNELS.APP.SERVICE_STATUS_CHANGED, {
            serviceName,
            status,
            error,
          });
        }
      });

    } catch (error) {
      logger.error('Error creating window:', error);
      // Don't exit the app, just log the error
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      // Start service monitoring
      this.serviceManager.startMonitoring();

      // Initial service check
      await this.serviceManager.checkServices();

      // Setup periodic recovery attempts
      setInterval(async () => {
        const statuses = this.serviceManager.getAllServiceStatuses();
        for (const [serviceName, state] of statuses.entries()) {
          if (state.status === 'degraded') {
            logger.info(`Attempting to recover ${serviceName} service...`);
            await this.serviceManager.retryService(serviceName);
          }
        }
      }, 60000); // Check every minute

    } catch (error) {
      logger.error('Error initializing services:', error);
      // Don't exit the app, just log the error
    }
  }
}

// Initialize main window
const mainWindow = new MainWindow();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  // Don't exit the app, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection:', reason);
  // Don't exit the app, just log the error
}); 