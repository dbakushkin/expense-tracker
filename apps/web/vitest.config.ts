import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Pure TS tests only (schemas, API). Switch to 'jsdom' if React component tests are added.
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
