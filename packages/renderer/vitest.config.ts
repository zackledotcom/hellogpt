import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'classic'
  })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**'],
    server: {
      deps: {
        inline: ['react', 'react-dom']
      }
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      provider: 'istanbul'
    }
  }
});
