import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['init_chrome_stub.ts', 'node_modules/axe-core/axe.min.js'],
    // ... Specify options here.
  },
});
