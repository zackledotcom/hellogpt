import React, { useState } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { OllamaTest } from './components/OllamaTest';
import { ServiceStatusManager } from './components/ServiceStatusManager';
import { Conversation, ChatMessage, Role } from './types/ipc';

export const App: React.FC = () => {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  const handleSendMessage = async (content: string) => {
    if (!currentConversation) {
      // Create a new conversation if none exists
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
      };
      setCurrentConversation(newConversation);
    }

    // Add the user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: Role.User,
      content,
      timestamp: Date.now()
    };

    // Update the conversation with the new message
    setCurrentConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, userMessage],
        updatedAt: Date.now()
      };
    });

    // TODO: Implement actual message sending to the backend
    // This is where you would call your IPC method to send the message
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ServiceStatusManager />
      <div className="container mx-auto py-8">
        <OllamaTest />
        <ChatContainer
          currentConversation={currentConversation}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}; 