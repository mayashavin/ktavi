import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/providers/storage/cloudinaryStorageProvider.integration.test.ts'],
  },
});
