import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { JSDOM } from 'jsdom';
import '@testing-library/jest-dom/vitest';

// Set up a basic DOM environment
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost'
});

(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).navigator = dom.window.navigator;

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Clean up after all tests
afterAll(() => {
  dom.window.close();
});
