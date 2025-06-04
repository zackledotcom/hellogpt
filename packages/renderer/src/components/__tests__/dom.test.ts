import { describe, test, expect } from 'vitest';

describe('Basic DOM tests', () => {
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
