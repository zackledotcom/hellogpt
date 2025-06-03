import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@app/shared/ipcChannels';
import { createIpcHandler, createIpcListener } from '@app/shared/ipcMiddleware';
import { OllamaClient } from './modules/OllamaClient.js';
import type { ChatMessage, ChatResponse, AppStatus, OllamaConnectionStatus } from '@app/shared/ipcTypes';

const ollamaClient = new OllamaClient();

export function setupIpcHandlers() {
  // Message handling
  ipcMain.handle(
    IPC_CHANNELS.CHAT.SEND_MESSAGE,
    createIpcHandler(IPC_CHANNELS.CHAT.SEND_MESSAGE, async (_event, message: ChatMessage) => {
      const response = await ollamaClient.sendMessage(message.content);
      return {
        content: response,
        timestamp: Date.now(),
      } as ChatResponse;
    })
  );

  // Health check
  ipcMain.handle(
    IPC_CHANNELS.APP.HEALTH_CHECK,
    createIpcHandler(IPC_CHANNELS.APP.HEALTH_CHECK, async () => {
      const status = await ollamaClient.checkHealth();
      const connectionStatus = await ollamaClient.checkConnection();
      return {
        status: status ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        details: {
          ollamaConnected: connectionStatus.connected,
          currentModel: ollamaClient.getCurrentModel(),
        },
      } as AppStatus;
    })
  );

  // Streaming message handling
  ipcMain.handle(
    IPC_CHANNELS.CHAT.SEND_MESSAGE_STREAM,
    createIpcHandler(IPC_CHANNELS.CHAT.SEND_MESSAGE_STREAM, async (event, message: ChatMessage) => {
      await ollamaClient.sendMessageStream(message.content, {
        onChunk: (chunk: string) => event.sender.send(IPC_CHANNELS.CHAT.STREAM_CHUNK, chunk),
        onEnd: (fullText: string) => event.sender.send(IPC_CHANNELS.CHAT.STREAM_END, fullText),
        onError: (error: Error) => event.sender.send(IPC_CHANNELS.CHAT.STREAM_ERROR, error.message),
      });
    })
  );

  // Ollama model management
  ipcMain.handle(
    IPC_CHANNELS.OLLAMA.LIST_MODELS,
    createIpcHandler(IPC_CHANNELS.OLLAMA.LIST_MODELS, async () => {
      const models = await ollamaClient.listModels();
      return { models };
    })
  );

  ipcMain.handle(
    IPC_CHANNELS.OLLAMA.SET_MODEL,
    createIpcHandler(IPC_CHANNELS.OLLAMA.SET_MODEL, async (_event, { modelName }) => {
      await ollamaClient.setModel(modelName);
    })
  );

  ipcMain.handle(
    IPC_CHANNELS.OLLAMA.CHECK_CONNECTION,
    createIpcHandler(IPC_CHANNELS.OLLAMA.CHECK_CONNECTION, async () => {
      const connectionStatus = await ollamaClient.checkConnection();
      return connectionStatus;
    })
  );
}
