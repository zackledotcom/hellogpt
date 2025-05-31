import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    exclude: ['tests/**', '**/*.e2e.ts', '**/*.e2e.tsx'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      provider: 'istanbul',
      all: true,
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: ['node_modules/', 'tests/'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
