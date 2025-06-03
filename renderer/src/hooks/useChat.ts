import { useState, useCallback } from 'react';
import type { ChatMessage, ChatResponse } from '../types/ipc';

export function useChat() {
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (message: ChatMessage): Promise<ChatResponse> => {
    return window.electronAPI.sendMessage(message);
  }, []);

  const sendMessageStream = useCallback(async (message: ChatMessage): Promise<void> => {
    setIsStreaming(true);
    try {
      await window.electronAPI.sendMessageStream(message);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return {
    sendMessage,
    sendMessageStream,
    isStreaming
  };
} 