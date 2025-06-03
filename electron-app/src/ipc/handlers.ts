import { ipcMain } from 'electron';
import type { IpcMessageMap } from '../types/ipc';
import { OllamaClient } from '../shared/api/OllamaClient';

const client = OllamaClient.getInstance();

export function setupIpcHandlers() {
  // Chat message handlers
  ipcMain.handle('chat:send-message', async (_, message: IpcMessageMap['chat:send-message']['request']) => {
    return client.sendMessage(message);
  });

  ipcMain.handle('chat:send-message-stream', async (event, message: IpcMessageMap['chat:send-message-stream']['request']) => {
    return client.sendMessageStream(message, {
      onChunk: (chunk) => event.sender.send('chat:stream-chunk', chunk),
      onError: (error) => event.sender.send('chat:stream-error', error.message),
      onComplete: () => event.sender.send('chat:stream-complete')
    });
  });

  // App status handlers
  ipcMain.handle('app:health-check', async () => {
    const connectionStatus = await client.checkConnection();
    return {
      status: connectionStatus.status === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: Date.now(),
      details: {
        ollamaConnected: connectionStatus.status === 'connected',
        currentModel: client.getCurrentModel()
      }
    };
  });

  // Ollama model handlers
  ipcMain.handle('ollama:list-models', async () => {
    const models = await client.listModels();
    return { models };
  });

  ipcMain.handle('ollama:set-model', async (_, { modelName }: IpcMessageMap['ollama:set-model']['request']) => {
    await client.setModel(modelName);
  });

  ipcMain.handle('ollama:check-connection', async () => {
    return client.checkConnection();
  });

  // Start health check monitoring
  client.startHealthCheck();

  // Cleanup on app quit
  process.on('exit', () => {
    client.stopHealthCheck();
  });
} 