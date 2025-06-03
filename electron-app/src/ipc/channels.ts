export const IPC_CHANNELS = {
  CHAT: {
    SEND_MESSAGE: 'chat:send-message',
    SEND_MESSAGE_STREAM: 'chat:send-message-stream',
    STREAM_CHUNK: 'chat:stream-chunk',
    STREAM_END: 'chat:stream-end',
    STREAM_ERROR: 'chat:stream-error'
  },
  APP: {
    HEALTH_CHECK: 'app:health-check'
  },
  OLLAMA: {
    LIST_MODELS: 'ollama:list-models',
    SET_MODEL: 'ollama:set-model',
    CHECK_CONNECTION: 'ollama:check-connection'
  }
} as const; 