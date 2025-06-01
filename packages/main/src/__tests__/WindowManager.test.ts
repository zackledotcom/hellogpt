import { describe, it, expect } from 'vitest';
import { BrowserWindow, app } from 'electron';
import { createWindowManagerModule } from '../modules/WindowManager';

const mockGetAllWindows = jest.fn();

jest.mock('electron', () => {
  const original = jest.requireActual('electron');
  return {
    ...original,
    BrowserWindow: {
      getAllWindows: mockGetAllWindows,
      // Mock BrowserWindow constructor
      new: jest.fn(() => ({
        loadURL: jest.fn(),
        loadFile: jest.fn(),
        isDestroyed: jest.fn(),
        isMinimized: jest.fn(),
        restore: jest.fn(),
        show: jest.fn(),
        webContents: { openDevTools: jest.fn() },
        focus: jest.fn(),
      })),
    },
    app: {
      whenReady: jest.fn(() => Promise.resolve()),
      on: jest.fn(),
    },
  };
});

describe('WindowManager', () => {
  it('should create and restore window properly', async () => {
    const initConfig = {
      preload: { path: 'preload.js' },
      renderer: { path: 'renderer.html' },
    };
    const windowManager = createWindowManagerModule({ initConfig, openDevTools: true });

    // Mock getAllWindows to return empty array to force createWindow
    mockGetAllWindows.mockReturnValue([]);

    const window = await windowManager.restoreOrCreateWindow(true);
    expect(window).toBeDefined();
  });

  it('should handle existing window', async () => {
    const initConfig = {
      preload: { path: 'preload.js' },
      renderer: { path: 'renderer.html' },
    };
    const windowManager = createWindowManagerModule({ initConfig });

    // Mock getAllWindows to return a window that is not destroyed
    const mockWindow = {
      isDestroyed: () => false,
      isMinimized: () => false,
      restore: jest.fn(),
      show: jest.fn(),
      webContents: { openDevTools: jest.fn() },
      focus: jest.fn(),
    };
    mockGetAllWindows.mockReturnValue([mockWindow]);

    const window = await windowManager.restoreOrCreateWindow(true);
    expect(window).toBe(mockWindow);
  });
});
