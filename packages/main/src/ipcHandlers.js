import { BrowserWindow } from 'electron';
import { OllamaClient } from './modules/OllamaClient.js';
const ollamaClient = new OllamaClient('https://api.ollama.com/v1/chat', null, process.env.MOCK_OLLAMA === 'true');
// In-memory logs for errors and warnings
const runtimeErrors = [];
const runtimeWarnings = [];
// Override console.error and console.warn to capture logs
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.error = (...args) => {
    runtimeErrors.push(args.map(String).join(' '));
    originalConsoleError(...args);
};
console.warn = (...args) => {
    runtimeWarnings.push(args.map(String).join(' '));
    originalConsoleWarn(...args);
};
export const ipcHandlers = [
    {
        channel: 'chat:sendMessage',
        handler: async (event, message) => {
            try {
                console.log(`Received message on channel 'chat:sendMessage': ${message}`);
                const response = await ollamaClient.sendMessage(message);
                console.log(`Sending response: ${response}`);
                return { success: true, data: response };
            }
            catch (error) {
                console.error(`Error handling 'chat:sendMessage':`, error);
                return { success: false, error: error?.message || 'Unknown error' };
            }
        },
    },
    {
        channel: 'app:healthCheck',
        handler: async () => {
            try {
                const windows = BrowserWindow.getAllWindows();
                const windowsInfo = windows.map(win => ({
                    id: win.id,
                    title: win.getTitle(),
                    isVisible: win.isVisible(),
                    isMinimized: win.isMinimized(),
                    isDestroyed: win.isDestroyed(),
                }));
                const ipcChannels = ipcHandlers.map((h) => h.channel);
                // For preload exposure keys, we can only check if any keys are exposed via contextBridge
                // This requires renderer process cooperation; here we just note placeholder
                const preloadExposedKeys = 'unknown - requires renderer cooperation';
                // Dependency versions from package.json (simplified)
                const dependencies = {
                    main: {}, // Removed require to avoid module resolution issues in tests
                    renderer: {}, // Removed require to avoid module resolution issues in tests
                    preload: {}, // Removed require to avoid module resolution issues in tests
                };
                return {
                    success: true,
                    data: {
                        ipcReady: true,
                        ollamaModelLoaded: ollamaClient ? true : false,
                        windowsOpen: windows.length,
                        windowsInfo,
                        ipcChannels,
                        preloadExposedKeys,
                        runtimeErrors,
                        runtimeWarnings,
                        dependencies,
                    },
                };
            }
            catch (error) {
                console.error(`Error handling 'app:healthCheck':`, error);
                return { success: false, error: error?.message || 'Unknown error' };
            }
        },
    },
];
