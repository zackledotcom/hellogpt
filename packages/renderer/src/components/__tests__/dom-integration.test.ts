import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';

describe('DOM Integration Test', () => {
  let dom: JSDOM;

  beforeAll(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="root"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      runScripts: 'dangerously'
    });

    global.window = dom.window as unknown as Window & typeof globalThis;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
  });

  afterAll(() => {
    dom.window.close();
  });

  test('can create and query DOM elements', () => {
    const div = document.createElement('div');
    div.id = 'test-element';
    document.body.appendChild(div);
    
    const found = document.getElementById('test-element');
    expect(found).toBeDefined();
    expect(found?.id).toBe('test-element');
  });
});
