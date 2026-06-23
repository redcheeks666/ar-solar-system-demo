import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Gesture logic is pure + headless: no DOM/WebGL/camera needed.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
