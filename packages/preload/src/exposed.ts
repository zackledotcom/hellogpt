import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for better type safety
interface StreamListeners {
  onChunk: (callback: (chunk: string) => void) => () => void;
  onEnd: (callback: (fullText: string) => void) => () => void;
  onError: (callback: (error: string) => void) => () => void;
}

interface ElectronAPI {
  // Chat functionality
  sendMessage: (message: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  sendMessageStream: (message: string) => Promise<{ success: boolean; error?: string }>;
  
  // Health check
  healthCheck: () => Promise<{ status: string; timestamp: number }>;
  
  // Stream listeners with cleanup
  stream: StreamListeners;
  
  // Ollama API
  ollama: {
    listModels: () => Promise<string[]>;
    setModel: (modelName: string) => Promise<boolean>;
    checkConnection: () => Promise<boolean>;
  };
  
  // Utility functions
  removeAllListeners: (channel?: string) => void;
}

// Channel constants for centralized management
const CHANNELS = {
  CHAT: {
    SEND_MESSAGE: 'chat:send-message',
    SEND_MESSAGE_STREAM: 'chat:send-message-stream',
    STREAM_CHUNK: 'chat:stream-chunk',
    STREAM_END: 'chat:stream-end',
    STREAM_ERROR: 'chat:stream-error',
    GET_CONVERSATIONS: 'chat:get-conversations',
    GET_CONVERSATION: 'chat:get-conversation',
    CREATE_CONVERSATION: 'chat:create-conversation',
    UPDATE_CONVERSATION_TITLE: 'chat:update-conversation-title',
    MESSAGE_RECEIVED: 'chat:message-received',
  },
  APP: {
    HEALTH_CHECK: 'app:health-check'
  },
  OLLAMA: {
    LIST_MODELS: 'ollama:list-models',
    SET_MODEL: 'ollama:set-model',
    CHECK_CONNECTION: 'ollama:check-connection',
    CANCEL_LOAD: 'ollama:cancel-load',
    MODEL_LOADING_STATE_CHANGED: 'ollama:model-loading-state-changed'
  }
} as const;

// Helper function for safe IPC calls with error handling
const safeInvoke = async <T>(channel: string, ...args: any[]): Promise<T> => {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    console.error(`IPC invoke failed for channel ${channel}:`, error);
    throw error;
  }
};

// Helper for creating stream listeners that return cleanup functions
const createStreamListener = (channel: string) => 
  (callback: (data: any) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on(channel, listener);
    
    // Return cleanup function
    return () => ipcRenderer.removeListener(channel, listener);
  };

// Create the API object
const electronAPI: ElectronAPI = {
  // Chat functionality
  sendMessage: (message: string) => 
    safeInvoke(CHANNELS.CHAT.SEND_MESSAGE, message),
  
  sendMessageStream: (message: string) => 
    safeInvoke(CHANNELS.CHAT.SEND_MESSAGE_STREAM, message),
  
  // Health check
  healthCheck: () => 
    safeInvoke(CHANNELS.APP.HEALTH_CHECK),
  
  // Stream listeners
  stream: {
    onChunk: createStreamListener(CHANNELS.CHAT.STREAM_CHUNK),
    onEnd: createStreamListener(CHANNELS.CHAT.STREAM_END),
    onError: createStreamListener(CHANNELS.CHAT.STREAM_ERROR),
  },
  
  // Ollama API
  ollama: {
    listModels: () => safeInvoke(CHANNELS.OLLAMA.LIST_MODELS),
    setModel: (modelName: string) => safeInvoke(CHANNELS.OLLAMA.SET_MODEL, modelName),
    checkConnection: () => safeInvoke(CHANNELS.OLLAMA.CHECK_CONNECTION),
  },
  
  // Utility for cleanup
  removeAllListeners: (channel?: string) => {
    if (channel) {
      ipcRenderer.removeAllListeners(channel);
    } else {
      // Remove all listeners for stream channels
      Object.values(CHANNELS.CHAT).forEach(ch => 
        ipcRenderer.removeAllListeners(ch)
      );
    }
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Expose version information for debugging
contextBridge.exposeInMainWorld('versions', {
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron,
});

// Add development helpers
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('__electronDebug', {
    listChannels: () => Object.values(CHANNELS).flatMap(obj => Object.values(obj)),
    ipcRenderer: {
      // Safe subset for debugging
      listenerCount: (channel: string) => ipcRenderer.listenerCount(channel),
    },
  });
}