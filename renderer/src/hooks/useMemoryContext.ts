import { useState, useEffect, useCallback } from 'react';
import { useMemory } from './useMemory';
import { Conversation } from '@/types/ipc';

export function useMemoryContext(currentConversation: Conversation | null) {
  const { searchMemory } = useMemory();
  const [relevantMemories, setRelevantMemories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRelevantMemories = useCallback(async (query: string) => {
    if (!currentConversation) return;

    setIsLoading(true);
    try {
      // Search for memories related to the current conversation
      const conversationMemories = await searchMemory(query, {
        limit: 5
      });

      // Filter memories by relevance to the current conversation
      const relevant = conversationMemories.filter(memory => 
        memory.metadata.conversationId === currentConversation.id ||
        memory.metadata.tags?.includes('chat')
      );

      setRelevantMemories(relevant);
    } catch (err) {
      setError('Failed to search relevant memories');
      console.error('Error searching memories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, searchMemory]);

  // Clear relevant memories when conversation changes
  useEffect(() => {
    setRelevantMemories([]);
  }, [currentConversation?.id]);

  return {
    relevantMemories,
    isLoading,
    error,
    searchRelevantMemories
  };
} 