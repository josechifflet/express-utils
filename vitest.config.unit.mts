import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.unit.test.ts'],
    coverage: {
      exclude: ['lib'],
    },
  },
  resolve: {
    // "@/*": ["./src/*"],
    alias: [{ find: '@', replacement: resolve(__dirname, './src') }],
  },
});
