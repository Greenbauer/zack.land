import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Mirrors tsconfig's "@/*" path, which route handlers import through.
  resolve: { alias: { '@': path.resolve(__dirname) } },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
});
