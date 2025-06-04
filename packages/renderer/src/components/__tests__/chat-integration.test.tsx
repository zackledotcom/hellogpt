import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MockChatContainer } from './MockChatContainer';

describe('Chat Integration Test', () => {
  let dom: JSDOM;
  let root: HTMLElement;

  beforeAll(() => {
    dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');
    global.window = dom.window as unknown as Window & typeof globalThis;
    global.document = dom.window.document;
    root = document.getElementById('root')!;
  });

  afterAll(() => {
    (global.window as any).close();
  });

  let rootInstance: ReactDOM.Root;

  beforeAll(() => {
    rootInstance = ReactDOM.createRoot(root);
  });

  test('renders chat container', async () => {
    rootInstance.render(<MockChatContainer />);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const input = document.querySelector('[data-testid="chat-input"]');
    const button = document.querySelector('[data-testid="send-button"]');
    
    expect(input).toBeInstanceOf(dom.window.HTMLInputElement);
    expect(button).toBeInstanceOf(dom.window.HTMLButtonElement);
  });

  test('allows typing in input', async () => {
    rootInstance.render(<MockChatContainer />);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const input = document.querySelector('[data-testid="chat-input"]') as HTMLInputElement;
    input.value = 'Test message';
    expect(input.value).toBe('Test message');
  });
});
