import '@testing-library/jest-dom';
import { vi } from 'vitest';
import './electronMocks';

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});

// Global test teardown
afterEach(() => {
  vi.resetAllMocks();
}); 