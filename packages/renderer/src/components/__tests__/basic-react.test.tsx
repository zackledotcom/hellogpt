import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';
import React from 'react';
import ReactDOM from 'react-dom/client';

describe('Basic React Test', () => {
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

  test('can render basic React component', async () => {
    const TestComponent = () => <div data-testid="test-div">Hello</div>;
    
    const rootInstance = ReactDOM.createRoot(root);
    rootInstance.render(<TestComponent />);
    
    // Wait for React to finish rendering
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const testDiv = document.querySelector('[data-testid="test-div"]');
    expect(testDiv).toBeDefined();
    expect(testDiv?.textContent).toBe('Hello');
  });
});
