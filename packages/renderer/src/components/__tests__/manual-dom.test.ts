import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Manual DOM tests', () => {
  let dom: JSDOM;

  beforeAll(() => {
    // Create a basic DOM environment
    dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost'
    });

    // Assign to global scope
    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).navigator = dom.window.navigator;
  });

  afterAll(() => {
    // Clean up
    dom.window.close();
  });

  test('document exists', () => {
    expect(document).toBeDefined();
    expect(document.createElement).toBeDefined();
  });

  test('can create and append elements', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    document.body.appendChild(div);
    
    const found = document.querySelector('div');
    expect(found).toBeDefined();
    expect(found?.textContent).toBe('Hello World');
    
    document.body.removeChild(div);
  });
});
