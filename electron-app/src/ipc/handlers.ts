import { ipcMain, BrowserWindow } from 'electron';
import type { IpcMessageMap } from '../types/ipc';
import { OllamaClient } from '../shared/api/OllamaClient';
import { MessageStore } from '../services/MessageStore';
import { MemoryService, MemoryChunk } from '../services/MemoryService';
import { IPC_CHANNELS } from './channels';
import { OllamaService } from '../services/OllamaService';
import { VectorStoreService } from '../services/VectorStoreService';
import { logger } from '../utils/logger';
import type { ChatMessage } from '../types/ipc';
import { ChatService } from '../services/ChatService';
import { EmbeddingService } from '../services/EmbeddingService';

const client = OllamaClient.getInstance();
const messageStore = new MessageStore();
const memoryService = MemoryService.getInstance();

export async function setupIpcHandlers(): Promise<void> {
  const ollamaService = new OllamaService();
  const embeddingService = new EmbeddingService(ollamaService);
  const vectorStoreService = new VectorStoreService(embeddingService);
  const chatService = new ChatService(ollamaService, vectorStoreService);

  // Initialize services
  await messageStore.initialize();
  await memoryService.initialize();
  await vectorStoreService.initialize();
  await ollamaService.initialize();
  await embeddingService.initialize();
  await chatService.initialize();

  // Chat message handler with RAG
  ipcMain.handle(IPC_CHANNELS.CHAT.SEND_MESSAGE, async (_event, message) => {
    try {
      return await chatService.sendMessage(message);
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CHAT.SEND_MESSAGE_STREAM, async (_event, message) => {
    try {
      await chatService.sendMessageStream(message);
    } catch (error) {
      logger.error('Error sending message stream:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CHAT.CREATE_CONVERSATION, async (_event, title) => {
    try {
      return await chatService.createConversation(title);
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CHAT.GET_CONVERSATION, async (_event, id) => {
    try {
      return await chatService.getConversation(id);
    } catch (error) {
      logger.error('Error getting conversation:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CHAT.GET_CONVERSATIONS, async () => {
    try {
      return await chatService.listConversations();
    } catch (error) {
      logger.error('Error listing conversations:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CHAT.DELETE_CONVERSATION, async (_event, id) => {
    try {
      await chatService.deleteConversation(id);
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CHAT.UPDATE_CONVERSATION_TITLE, async (_event, id, title) => {
    try {
      await chatService.updateConversationTitle(id, title);
    } catch (error) {
      logger.error('Error updating conversation title:', error);
      throw error;
    }
  });

  // App status handlers
  ipcMain.handle(IPC_CHANNELS.APP.HEALTH_CHECK, async () => {
    try {
      const ollamaStatus = await ollamaService.checkConnection();
      return {
        status: ollamaStatus.status === 'connected' ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        details: {
          ollamaConnected: ollamaStatus.status === 'connected',
          currentModel: ollamaService.getCurrentModel(),
        },
      };
    } catch (error) {
      logger.error('Error checking health:', error);
      throw error;
    }
  });

  // Ollama model handlers
  ipcMain.handle(IPC_CHANNELS.OLLAMA.LIST_MODELS, async () => {
    try {
      const models = await ollamaService.listModels();
      return { models };
    } catch (error) {
      logger.error('Error listing models:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.OLLAMA.SET_MODEL, async (_event, modelName) => {
    try {
      await ollamaService.setModel(modelName);
    } catch (error) {
      logger.error('Error setting model:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.OLLAMA.CHECK_CONNECTION, async () => {
    try {
      return await ollamaService.checkConnection();
    } catch (error) {
      logger.error('Error checking connection:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.OLLAMA.CANCEL_LOAD, async () => {
    try {
      await ollamaService.cancelLoad();
    } catch (error) {
      logger.error('Error canceling load:', error);
      throw error;
    }
  });

  // Start health check monitoring
  client.startHealthCheck();

  // Cleanup on app quit
  process.on('exit', () => {
    client.stopHealthCheck();
  });

  // Memory service handlers
  ipcMain.handle(IPC_CHANNELS.MEMORY.INITIALIZE, async () => {
    return memoryService.initialize();
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY.STORE, async (_, { content, metadata }) => {
    return memoryService.store(content, metadata);
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY.SEARCH, async (_, { query, options }) => {
    return memoryService.search(query, options);
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY.GET_RECENT, async (_, { limit }) => {
    return memoryService.getRecent(limit);
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY.DELETE, async (_, { id }) => {
    return memoryService.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY.CLEAR, async () => {
    return memoryService.clear();
  });

  // Memory service event listeners
  memoryService.on('initialized', () => {
    // Notify all windows
    BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
      window.webContents.send(IPC_CHANNELS.MEMORY.INITIALIZE);
    });
  });

  memoryService.on('stored', (memory: MemoryChunk) => {
    BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
      window.webContents.send(IPC_CHANNELS.MEMORY.STORE, memory);
    });
  });

  memoryService.on('searched', (memories: MemoryChunk[]) => {
    BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
      window.webContents.send(IPC_CHANNELS.MEMORY.SEARCH, memories);
    });
  });

  memoryService.on('recent', (memories: MemoryChunk[]) => {
    BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
      window.webContents.send(IPC_CHANNELS.MEMORY.GET_RECENT, memories);
    });
  });

  memoryService.on('deleted', (id: string) => {
    BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
      window.webContents.send(IPC_CHANNELS.MEMORY.DELETE, id);
    });
  });

  memoryService.on('cleared', () => {
    BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
      window.webContents.send(IPC_CHANNELS.MEMORY.CLEAR);
    });
  });

  // Vector store handlers
  ipcMain.handle(IPC_CHANNELS.VECTOR.SEARCH, async (_event, query) => {
    try {
      return await vectorStoreService.searchSimilar(query);
    } catch (error) {
      logger.error('Error searching vector store:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.VECTOR.ADD, async (_event, document) => {
    try {
      await vectorStoreService.addDocument(document);
    } catch (error) {
      logger.error('Error adding document to vector store:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.VECTOR.DELETE, async (_event, id) => {
    try {
      await vectorStoreService.deleteDocument(id);
    } catch (error) {
      logger.error('Error deleting document from vector store:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.VECTOR.CLEAR, async () => {
    try {
      await vectorStoreService.clear();
    } catch (error) {
      logger.error('Error clearing vector store:', error);
      throw error;
    }
  });

  // Embedding configuration handlers
  ipcMain.handle(IPC_CHANNELS.EMBEDDING.GET_CONFIG, async () => {
    try {
      return embeddingService.getConfig();
    } catch (error) {
      logger.error('Error getting embedding config:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.EMBEDDING.UPDATE_CONFIG, async (_event, config) => {
    try {
      await embeddingService.updateConfig(config);
    } catch (error) {
      logger.error('Error updating embedding config:', error);
      throw error;
    }
  });
} 