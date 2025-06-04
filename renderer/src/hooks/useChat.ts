import { useCallback } from 'react';
import type { ChatMessage, ChatResponse } from '@/types/ipc';

export function useChat() {
  const sendMessage = useCallback(async (message: ChatMessage): Promise<ChatResponse> => {
    return window.electronAPI.chat.sendMessage(message);
  }, []);

  const sendMessageStream = useCallback(async (message: ChatMessage): Promise<void> => {
    await window.electronAPI.chat.sendMessageStream(message);
  }, []);

  return {
    sendMessage,
    sendMessageStream,
  };
} 