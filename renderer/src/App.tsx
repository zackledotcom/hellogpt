import React from 'react';
import { ChatContainer } from './components/ChatContainer';
import { OllamaTest } from './components/OllamaTest';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <OllamaTest />
        <ChatContainer />
      </div>
    </div>
  );
}; 