import { useState, useCallback, useEffect } from 'react';
import { Conversation, ChatMessage } from '../types';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const loadedConversations = await window.electronAPI.listConversations();
      setConversations(loadedConversations);
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error loading conversations:', err);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const loadedMessages = await window.electronAPI.getConversation(id);
      const conversation = conversations.find(c => c.id === id);
      if (conversation) {
        setCurrentConversation(conversation);
        setMessages(loadedMessages);
      }
    } catch (err) {
      setError('Failed to load conversation');
      console.error('Error loading conversation:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversations]);

  const createConversation = useCallback(async (title: string) => {
    try {
      const id = await window.electronAPI.createConversation(title);
      await loadConversations();
      return id;
    } catch (err) {
      setError('Failed to create conversation');
      console.error('Error creating conversation:', err);
      throw err;
    }
  }, [loadConversations]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await window.electronAPI.deleteConversation(id);
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
      await loadConversations();
    } catch (err) {
      setError('Failed to delete conversation');
      console.error('Error deleting conversation:', err);
    }
  }, [currentConversation, loadConversations]);

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    try {
      await window.electronAPI.updateConversationTitle(id, title);
      await loadConversations();
      if (currentConversation?.id === id) {
        setCurrentConversation(prev => prev ? { ...prev, title } : null);
      }
    } catch (err) {
      setError('Failed to update conversation title');
      console.error('Error updating conversation title:', err);
    }
  }, [currentConversation, loadConversations]);

  const addMessage = useCallback(async (message: ChatMessage) => {
    try {
      setMessages(prev => [...prev, message]);
    } catch (err) {
      setError('Failed to add message');
      console.error('Error adding message:', err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    loadConversation,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    addMessage,
  };
}; 