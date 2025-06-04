import { useState, useCallback } from 'react';
import type { Conversation, ChatMessage } from '@/types/ipc';
import { useMemory } from './useMemory';

export function useConversation() {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { storeMemory } = useMemory();

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const conversations = await window.electronAPI.conversation.list();
      if (conversations.length > 0) {
        setCurrentConversation(conversations[0]);
      }
      return conversations;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (title: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newConversation = await window.electronAPI.conversation.create(title);
      setCurrentConversation(newConversation);
      return newConversation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleConversationSelect = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const conversation = await window.electronAPI.conversation.get(id);
      setCurrentConversation(conversation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (message: ChatMessage) => {
    if (!currentConversation) return null;
    setIsLoading(true);
    setError(null);
    try {
      const response = await window.electronAPI.chat.sendMessage(message);
      const updatedConversation = await window.electronAPI.conversation.get(currentConversation.id);
      setCurrentConversation(updatedConversation);

      // Store user message as memory
      await storeMemory(message.content, {
        type: 'chat_message',
        source: 'user',
        timestamp: Date.now(),
        conversationId: currentConversation.id,
        conversationTitle: currentConversation.title
      });

      // Store assistant response as memory if available
      if (response.message) {
        await storeMemory(response.message.content, {
          type: 'chat_message',
          source: 'assistant',
          timestamp: Date.now(),
          conversationId: currentConversation.id,
          conversationTitle: currentConversation.title
        });
      }

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, storeMemory]);

  return {
    currentConversation,
    isLoading,
    error,
    loadConversations,
    createConversation,
    handleConversationSelect,
    sendMessage,
  };
} 