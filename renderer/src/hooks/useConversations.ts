import { useState, useEffect } from 'react';
import type { Conversation, ChatMessage, ChatResponse } from '../types/ipc';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const loadedConversations = await window.electron.ipc.invoke('conversation:list', undefined);
      setConversations(loadedConversations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      setIsLoading(true);
      const conversation = await window.electron.ipc.invoke('conversation:get', { id });
      setCurrentConversation(conversation);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async (title: string) => {
    try {
      setIsLoading(true);
      const conversation = await window.electron.ipc.invoke('conversation:create', { title });
      setConversations(prev => [...prev, conversation]);
      setCurrentConversation(conversation);
      setError(null);
      return conversation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      setIsLoading(true);
      await window.electron.ipc.invoke('conversation:delete', { id });
      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    try {
      setIsLoading(true);
      const updated = await window.electron.ipc.invoke('conversation:update', { id, title });
      setConversations(prev => prev.map(conv => conv.id === id ? updated : conv));
      if (currentConversation?.id === id) {
        setCurrentConversation(updated);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update conversation title');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: ChatMessage) => {
    if (!currentConversation) {
      throw new Error('No active conversation');
    }

    try {
      setIsLoading(true);
      const response = await window.electron.ipc.invoke('chat:send-message', message);
      const updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, message, response.message]
      };
      setCurrentConversation(updatedConversation);
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation.id ? updatedConversation : conv
      ));
      setError(null);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();

    const unsubscribe = window.electron.ipc.on('conversation:updated', (conversation: Conversation) => {
      setConversations(prev => prev.map(conv => conv.id === conversation.id ? conversation : conv));
      if (currentConversation?.id === conversation.id) {
        setCurrentConversation(conversation);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentConversation?.id]);

  return {
    conversations,
    currentConversation,
    isLoading,
    error,
    loadConversations,
    loadConversation,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    sendMessage
  };
} 