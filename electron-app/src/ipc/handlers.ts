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
import { ServiceManager } from '../services/ServiceManager';
import type { EmbeddingConfig } from '../services/EmbeddingService';

const client = OllamaClient.getInstance();
const messageStore = new MessageStore();
const serviceManager = ServiceManager.getInstance();

// Initialize services
const ollamaService = OllamaService.getInstance();
const embeddingService = EmbeddingService.getInstance();
const vectorStoreService = VectorStoreService.getInstance();
const memoryService = MemoryService.getInstance();
const chatService = ChatService.getInstance();

// Helper function to check service availability
const withServiceCheck = async <T>(
  serviceName: string,
  fn: () => Promise<T>
): Promise<{ success: boolean; error?: string; result?: T }> => {
  try {
    const result = await fn();
    return { success: true, result };
  } catch (error) {
    console.error(`Service ${serviceName} error:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : `Service ${serviceName} error` 
    };
  }
};

export async function setupIpcHandlers(): Promise<void> {
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

  // Ollama model handlers
  ipcMain.handle(IPC_CHANNELS.OLLAMA.LIST_MODELS, () =>
    withServiceCheck('ollama', async () => {
      const service = OllamaService.getInstance();
      return service.listModels();
    })
  );

  ipcMain.handle(IPC_CHANNELS.OLLAMA.SET_MODEL, (_, modelName: string) =>
    withServiceCheck('ollama', async () => {
      const service = OllamaService.getInstance();
      return service.setModel(modelName);
    })
  );

  ipcMain.handle(IPC_CHANNELS.OLLAMA.CHECK_CONNECTION, () =>
    withServiceCheck('ollama', async () => {
      const service = OllamaService.getInstance();
      return service.checkConnection();
    })
  );

  ipcMain.handle(IPC_CHANNELS.OLLAMA.CANCEL_LOAD, () =>
    withServiceCheck('ollama', async () => {
      const service = OllamaService.getInstance();
      return service.cancelLoad();
    })
  );

  // Embedding configuration handlers
  ipcMain.handle(IPC_CHANNELS.EMBEDDING.GET_CONFIG, () =>
    withServiceCheck('embedding', async () => {
      const service = EmbeddingService.getInstance();
      return service.getConfig();
    })
  );

  ipcMain.handle(IPC_CHANNELS.EMBEDDING.UPDATE_CONFIG, (_, config: Partial<EmbeddingConfig>) =>
    withServiceCheck('embedding', async () => {
      const service = EmbeddingService.getInstance();
      return service.updateConfig(config);
    })
  );

  // Vector store handlers
  ipcMain.handle(IPC_CHANNELS.VECTOR.SEARCH, (_, query: string) =>
    withServiceCheck('vectorStore', async () => {
      const service = VectorStoreService.getInstance();
      return service.searchSimilar(query);
    })
  );

  ipcMain.handle(IPC_CHANNELS.VECTOR.ADD, (_, document: any) =>
    withServiceCheck('vectorStore', async () => {
      const service = VectorStoreService.getInstance();
      return service.addDocument(document);
    })
  );

  ipcMain.handle(IPC_CHANNELS.VECTOR.DELETE, (_, id: string) =>
    withServiceCheck('vectorStore', async () => {
      const service = VectorStoreService.getInstance();
      return service.deleteDocument(id);
    })
  );

  ipcMain.handle(IPC_CHANNELS.VECTOR.CLEAR, () =>
    withServiceCheck('vectorStore', async () => {
      const service = VectorStoreService.getInstance();
      return service.clear();
    })
  );

  // Memory service handlers
  ipcMain.handle(IPC_CHANNELS.MEMORY.INITIALIZE, () =>
    withServiceCheck('memory', async () => {
      const service = MemoryService.getInstance();
      return service.initialize();
    })
  );

  ipcMain.handle(IPC_CHANNELS.MEMORY.STORE, async (_, chunk: MemoryChunk) => {
    try {
      const memoryService = MemoryService.getInstance();
      await memoryService.store(chunk);
      return { success: true };
    } catch (error) {
      console.error('Failed to store memory:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to store memory' 
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY.SEARCH, async (_, query: string) => {
    try {
      const memoryService = MemoryService.getInstance();
      const results = await memoryService.search(query);
      return { success: true, results };
    } catch (error) {
      console.error('Failed to search memories:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to search memories' 
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY.GET_RECENT, async (_, limit: number = 10) => {
    try {
      const memoryService = MemoryService.getInstance();
      const results = await memoryService.getRecent(limit);
      return { success: true, results };
    } catch (error) {
      console.error('Failed to get recent memories:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get recent memories' 
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY.DELETE, async (_, id: string) => {
    try {
      const memoryService = MemoryService.getInstance();
      await memoryService.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete memory:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete memory' 
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY.CLEAR, async () => {
    try {
      const memoryService = MemoryService.getInstance();
      await memoryService.clear();
      return { success: true };
    } catch (error) {
      console.error('Failed to clear memories:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear memories' 
      };
    }
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

  // Service status handlers
  ipcMain.handle(IPC_CHANNELS.APP.HEALTH_CHECK, () => {
    const statuses = serviceManager.getAllServiceStatuses();
    return Object.fromEntries(statuses);
  });

  // Setup event listeners for service status changes
  serviceManager.on('serviceStatusChanged', ({ serviceName, status, error }) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(IPC_CHANNELS.APP.SERVICE_STATUS_CHANGED, {
        serviceName,
        status,
        error,
      });
    });
  });

  // Start health check monitoring
  client.startHealthCheck();

  // Cleanup on app quit
  process.on('exit', () => {
    client.stopHealthCheck();
  });
} 