import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { JSDOM } from 'jsdom';

// Set up DOM environment
beforeAll(() => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.window = dom.window as unknown as Window & typeof globalThis;
  global.document = dom.window.document;
});

afterAll(() => {
  (global.window as any).close();
});

// Simple component that doesn't depend on project internals
const SimpleChat = () => (
  <div>
    <input data-testid="simple-input" />
    <button data-testid="simple-button">Send</button>
  </div>
);

describe('Simple Chat Test', () => {
  test('renders input and button', () => {
    render(<SimpleChat />);
    expect(screen.getByTestId('simple-input')).toBeInTheDocument();
    expect(screen.getByTestId('simple-button')).toBeInTheDocument();
  });
});
