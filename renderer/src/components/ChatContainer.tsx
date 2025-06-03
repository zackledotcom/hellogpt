import React, { useState, useRef, useLayoutEffect } from 'react';
import { ChatMessage, Role } from '../types/ipc';
import { useChat } from '../hooks/useChat';
import { useModelStatus } from '../hooks/useModelStatus';
import { ModelLoadingOverlay } from './ModelLoadingOverlay';
import { ChatInput } from './ChatInput';
import { ChatMessageList } from './ChatMessageList';

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, isStreaming } = useChat();
  const {
    isLoading,
    modelName,
    progress,
    estimatedTimeRemaining,
    error,
  } = useModelStatus();

  // Optional future-proofing for per-message state
  // const [messageStates, setMessageStates] = useState<Record<string, { isStreaming: boolean, error?: string }>>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: Role.User,
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    setInputValue('');

    try {
      const response = await sendMessage(userMessage);

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: Role.Assistant,
        content: response.content,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);

      const errorMessage: ChatMessage = {
        id: generateId(),
        role: Role.Assistant,
        content: '⚠️ Failed to generate a response.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4">
        <ChatMessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4 bg-white">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          disabled={isLoading} // streaming no longer blocks typing
        />
      </div>

      {isLoading && (
        <ModelLoadingOverlay
          modelName={modelName}
          progress={progress}
          estimatedTimeRemaining={estimatedTimeRemaining}
          error={error}
        />
      )}
    </div>
  );
};
