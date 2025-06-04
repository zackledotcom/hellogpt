export const IPC_CHANNELS = {
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
    DELETE_CONVERSATION: 'chat:delete-conversation',
  },
  APP: {
    HEALTH_CHECK: 'app:health-check'
  },
  OLLAMA: {
    LIST_MODELS: 'ollama:list-models',
    SET_MODEL: 'ollama:set-model',
    CHECK_CONNECTION: 'ollama:check-connection',
    CANCEL_LOAD: 'ollama:cancel-load',
    MODEL_LOADING_STATE_CHANGED: 'ollama:model-loading-state-changed',
    SAVE_CONFIG: 'ollama:save-config',
  },
  MEMORY: {
    INITIALIZE: 'memory:initialize',
    STORE: 'memory:store',
    SEARCH: 'memory:search',
    GET_RECENT: 'memory:get-recent',
    DELETE: 'memory:delete',
    CLEAR: 'memory:clear'
  },
  VECTOR: {
    ADD_DOCUMENT: 'vector:add-document',
    SEARCH: 'vector:search',
    GET_DOCUMENTS: 'vector:get-documents',
    ADD: 'vector:add',
    DELETE: 'vector:delete',
    CLEAR: 'vector:clear',
    CHUNK: 'vector:chunk',
    MERGE: 'vector:merge'
  },
  EMBEDDING: {
    GET_CONFIG: 'embedding:get-config',
    UPDATE_CONFIG: 'embedding:update-config',
  },
} as const;

// Type for IPC channel names
export type IpcChannel = {
  [K in keyof typeof IPC_CHANNELS]: typeof IPC_CHANNELS[K][keyof typeof IPC_CHANNELS[K]]
}[keyof typeof IPC_CHANNELS]; 