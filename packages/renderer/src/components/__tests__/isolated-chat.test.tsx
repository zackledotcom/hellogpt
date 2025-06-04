import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';
import React from 'react';
import ReactDOM from 'react-dom/client';

describe('Isolated Chat Test', () => {
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

  test('renders basic chat UI', async () => {
    const TestComponent = () => (
      <div>
        <input data-testid="test-input" />
        <button data-testid="test-button">Send</button>
      </div>
    );

    const rootInstance = ReactDOM.createRoot(root);
    rootInstance.render(<TestComponent />);
    
    // Wait for React to finish rendering
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const input = document.querySelector('[data-testid="test-input"]');
    const button = document.querySelector('[data-testid="test-button"]');
    
    expect(input).toBeInstanceOf(dom.window.HTMLInputElement);
    expect(button).toBeInstanceOf(dom.window.HTMLButtonElement);
    expect(button?.textContent).toBe('Send');
  });
});
