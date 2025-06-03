export const IPC_CHANNELS = {
  CHAT: {
    SEND_MESSAGE: 'chat:sendMessage',
    SEND_MESSAGE_STREAM: 'chat:sendMessageStream',
    STREAM_CHUNK: 'chat:streamChunk',
    STREAM_END: 'chat:streamEnd',
    STREAM_ERROR: 'chat:streamError',
  },
  APP: {
    HEALTH_CHECK: 'app:healthCheck',
    GET_STATUS: 'app:getStatus',
  },
  OLLAMA: {
    LIST_MODELS: 'ollama:listModels',
    SET_MODEL: 'ollama:setModel',
    CHECK_CONNECTION: 'ollama:checkConnection',
  },
} as const;

// Type for all possible channel names
export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS][keyof typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS]];

// Type guard to validate channel names at runtime
export function isValidIpcChannel(channel: string): channel is IpcChannel {
  return Object.values(IPC_CHANNELS).some(category => 
    Object.values(category).includes(channel as any)
  );
} 