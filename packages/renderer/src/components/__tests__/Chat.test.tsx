import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { MockChatContainer } from './MockChatContainer';

// Set up DOM environment
beforeAll(() => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.window = dom.window as unknown as Window & typeof globalThis;
  global.document = dom.window.document;
});

afterAll(() => {
  (global.window as any).close();
});


// Set up basic DOM environment before tests
beforeAll(() => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost'
  });
  
  (global as any).window = dom.window;
  (global as any).document = dom.window.document;
  (global as any).navigator = dom.window.navigator;
});

// Clean up after tests
afterAll(() => {
  (global as any).window.close();
});

describe('Chat component', () => {
  test('renders input and send button', async () => {
    render(<MockChatContainer />);
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for React render
    const input = screen.getByTestId('chat-input');
    const button = screen.getByTestId('send-button');
    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  test('allows user to type in input', async () => {
    render(<MockChatContainer />);
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for React render
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(input).toHaveValue('Hello');
  });
});
