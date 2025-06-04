import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IPC_CHANNELS, type IpcChannel } from '../ipc/channels';
import type { 
  IpcMessageMap,
  ChatMessage,
  Conversation,
  AppStatus,
  OllamaModel,
  OllamaConnectionStatus,
  Document
} from '../types/ipc';
import type { MemoryChunk } from '../services/MemoryService';

// Type-safe wrapper for IPC calls
const safeInvoke = async <T>(channel: IpcChannel, ...args: any[]): Promise<T> => {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    console.error(`Error in IPC call to ${channel}:`, error);
    throw error;
  }
};

// Stream listener with proper cleanup
const createStreamListener = (channel: IpcChannel, callback: (data: any) => void) => {
  const subscription = (_event: any, data: any) => callback(data);
  ipcRenderer.on(channel, subscription);
  return () => {
    ipcRenderer.removeListener(channel, subscription);
  };
};

// Expose a type-safe API to the renderer process
const electronAPI = {
  chat: {
    sendMessage: (message: ChatMessage) => safeInvoke<ChatMessage>(IPC_CHANNELS.CHAT.SEND_MESSAGE as IpcChannel, message),
    sendMessageStream: (message: ChatMessage) => safeInvoke<void>(IPC_CHANNELS.CHAT.SEND_MESSAGE_STREAM as IpcChannel, message),
    createConversation: (title: string) => safeInvoke<string>(IPC_CHANNELS.CHAT.CREATE_CONVERSATION as IpcChannel, title),
    getConversation: (id: string) => safeInvoke<ChatMessage[]>(IPC_CHANNELS.CHAT.GET_CONVERSATION as IpcChannel, id),
    listConversations: () => safeInvoke<Conversation[]>(IPC_CHANNELS.CHAT.GET_CONVERSATIONS as IpcChannel),
    deleteConversation: (id: string) => safeInvoke<void>(IPC_CHANNELS.CHAT.DELETE_CONVERSATION as IpcChannel, id),
    updateConversationTitle: (id: string, title: string) => safeInvoke<void>(IPC_CHANNELS.CHAT.UPDATE_CONVERSATION_TITLE as IpcChannel, id, title),
  },
  app: {
    healthCheck: () => safeInvoke<AppStatus>(IPC_CHANNELS.APP.HEALTH_CHECK as IpcChannel),
  },
  ollama: {
    listModels: () => safeInvoke<{ models: OllamaModel[] }>(IPC_CHANNELS.OLLAMA.LIST_MODELS as IpcChannel),
    setModel: (modelName: string) => safeInvoke<void>(IPC_CHANNELS.OLLAMA.SET_MODEL as IpcChannel, modelName),
    checkConnection: () => safeInvoke<OllamaConnectionStatus>(IPC_CHANNELS.OLLAMA.CHECK_CONNECTION as IpcChannel),
    cancelLoad: () => safeInvoke<void>(IPC_CHANNELS.OLLAMA.CANCEL_LOAD as IpcChannel),
  },
  vectorStore: {
    search: (query: string) => safeInvoke<Document[]>(IPC_CHANNELS.VECTOR.SEARCH as IpcChannel, query),
    add: (document: Omit<Document, 'id'>) => safeInvoke<void>(IPC_CHANNELS.VECTOR.ADD as IpcChannel, document),
    delete: (id: string) => safeInvoke<void>(IPC_CHANNELS.VECTOR.DELETE as IpcChannel, id),
    clear: () => safeInvoke<void>(IPC_CHANNELS.VECTOR.CLEAR as IpcChannel),
  },
  // Development helpers
  __dev: {
    onMessageReceived: (callback: (message: ChatMessage) => void) => createStreamListener(IPC_CHANNELS.CHAT.MESSAGE_RECEIVED as IpcChannel, callback),
    onModelLoadingStateChanged: (callback: (state: any) => void) => createStreamListener(IPC_CHANNELS.OLLAMA.MODEL_LOADING_STATE_CHANGED as IpcChannel, callback),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Add development helpers
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('__electronDebug', {
    listChannels: () => Object.values(IPC_CHANNELS).flatMap(obj => Object.values(obj)),
    ipcRenderer: {
      listenerCount: (channel: string) => ipcRenderer.listenerCount(channel),
    },
  });
}

// Memory API
const memoryAPI = {
  initialize: () => ipcRenderer.invoke('memory:initialize'),
  
  store: (content: string, metadata: Omit<MemoryChunk['metadata'], 'timestamp'>) => 
    ipcRenderer.invoke('memory:store', { content, metadata }),
  
  search: (query: string, options?: { limit?: number }) => 
    ipcRenderer.invoke('memory:search', { query, options }),
  
  getRecent: (limit?: number) => 
    ipcRenderer.invoke('memory:get-recent', { limit }),
  
  delete: (id: string) => 
    ipcRenderer.invoke('memory:delete', { id }),
  
  clear: () => 
    ipcRenderer.invoke('memory:clear'),
  
  // Event listeners
  onInitialized: (callback: () => void) => {
    ipcRenderer.on('memory:initialized', callback);
    return () => ipcRenderer.removeListener('memory:initialized', callback);
  },
  
  onStored: (callback: (memory: MemoryChunk) => void) => {
    const handler = (_: IpcRendererEvent, memory: MemoryChunk) => callback(memory);
    ipcRenderer.on('memory:stored', handler);
    return () => ipcRenderer.removeListener('memory:stored', handler);
  },
  
  onSearched: (callback: (memories: MemoryChunk[]) => void) => {
    const handler = (_: IpcRendererEvent, memories: MemoryChunk[]) => callback(memories);
    ipcRenderer.on('memory:searched', handler);
    return () => ipcRenderer.removeListener('memory:searched', handler);
  },
  
  onRecent: (callback: (memories: MemoryChunk[]) => void) => {
    const handler = (_: IpcRendererEvent, memories: MemoryChunk[]) => callback(memories);
    ipcRenderer.on('memory:recent', handler);
    return () => ipcRenderer.removeListener('memory:recent', handler);
  },
  
  onDeleted: (callback: (id: string) => void) => {
    const handler = (_: IpcRendererEvent, id: string) => callback(id);
    ipcRenderer.on('memory:deleted', handler);
    return () => ipcRenderer.removeListener('memory:deleted', handler);
  },
  
  onCleared: (callback: () => void) => {
    ipcRenderer.on('memory:cleared', callback);
    return () => ipcRenderer.removeListener('memory:cleared', callback);
  }
};

// Expose APIs to renderer process
contextBridge.exposeInMainWorld('memoryAPI', memoryAPI);

contextBridge.exposeInMainWorld('electron', {
  ipc: {
    invoke: (channel: string, ...args: any[]) => {
      const validInvokeChannels = [
        IPC_CHANNELS.CHAT.GET_CONVERSATIONS,
        IPC_CHANNELS.CHAT.GET_CONVERSATION,
        IPC_CHANNELS.CHAT.SEND_MESSAGE,
        IPC_CHANNELS.CHAT.SEND_MESSAGE_STREAM,
        IPC_CHANNELS.CHAT.CREATE_CONVERSATION,
        IPC_CHANNELS.CHAT.DELETE_CONVERSATION,
        IPC_CHANNELS.CHAT.UPDATE_CONVERSATION_TITLE,
        IPC_CHANNELS.APP.HEALTH_CHECK,
        IPC_CHANNELS.OLLAMA.LIST_MODELS,
        IPC_CHANNELS.OLLAMA.SET_MODEL,
        IPC_CHANNELS.OLLAMA.CHECK_CONNECTION,
        IPC_CHANNELS.OLLAMA.CANCEL_LOAD,
        IPC_CHANNELS.VECTOR.SEARCH,
        IPC_CHANNELS.VECTOR.ADD,
        IPC_CHANNELS.VECTOR.DELETE,
        IPC_CHANNELS.VECTOR.CLEAR
      ] as const;

      const validListenerChannels = [
        IPC_CHANNELS.CHAT.MESSAGE_RECEIVED,
        IPC_CHANNELS.OLLAMA.MODEL_LOADING_STATE_CHANGED
      ] as const;

      if (validInvokeChannels.includes(channel as typeof validInvokeChannels[number])) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error(`Invalid channel: ${channel}`));
    },
    on: (channel: string, callback: (...args: any[]) => void) => {
      const validListenerChannels = [
        IPC_CHANNELS.CHAT.STREAM_CHUNK,
        IPC_CHANNELS.CHAT.STREAM_END,
        IPC_CHANNELS.CHAT.STREAM_ERROR,
        IPC_CHANNELS.OLLAMA.MODEL_LOADING_STATE_CHANGED
      ] as const;

      if (validListenerChannels.includes(channel as typeof validListenerChannels[number])) {
        ipcRenderer.on(channel, (_event, ...args) => callback(...args));
      }
    }
  }
}); 