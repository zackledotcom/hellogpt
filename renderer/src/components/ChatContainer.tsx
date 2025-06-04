import React, { useState, useCallback } from 'react';
import { ChatInput } from './ChatInput';
import { ChatMessageList } from './ChatMessageList';
import { useConversation } from '@/hooks/useConversation';
import type { Conversation, ChatMessage } from '@/types/ipc';
import { Role } from '@/types/ipc';

interface ChatContainerProps {
  currentConversation: Conversation | null;
  onSendMessage: (content: string) => Promise<void>;
}

export function ChatContainer({ currentConversation, onSendMessage }: ChatContainerProps) {
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleMessageSent = useCallback((message: ChatMessage) => {
    setIsThinking(true);
  }, []);

  const handleStreamComplete = useCallback(() => {
    setIsThinking(false);
    setIsStreaming(false);
  }, []);

  const handleStopStream = useCallback(() => {
    setIsStreaming(false);
    setIsThinking(false);
  }, []);

  const handleSendMessage = async (content: string) => {
    setIsStreaming(true);
    try {
      await onSendMessage(content);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <ChatMessageList 
          messages={currentConversation?.messages || []} 
          isThinking={isThinking}
          isTyping={isTyping}
        />
      </div>
      <div className="border-t border-gray-200 p-4">
        <ChatInput 
          onSendMessage={handleSendMessage}
          onMessageSent={handleMessageSent}
          onStreamComplete={handleStreamComplete}
          isStreaming={isStreaming}
          onStopStream={handleStopStream}
        />
      </div>
    </div>
  );
}
