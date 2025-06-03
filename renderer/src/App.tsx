import React from 'react';
import { ChatContainer } from './components/ChatContainer';

export const App: React.FC = () => {
  return (
    <div className="h-screen bg-gray-100">
      <ChatContainer />
    </div>
  );
}; 