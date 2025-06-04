import React, { FC } from 'react';

interface MockChatContainerProps {
  testId?: string;
}

export const MockChatContainer: FC<MockChatContainerProps> = ({ testId = 'mock-chat' }) => {
  return (
    <div data-testid={testId}>
      <input 
        data-testid="chat-input"
        placeholder="type your message"
      />
      <button data-testid="send-button">
        Send
      </button>
    </div>
  );
};
