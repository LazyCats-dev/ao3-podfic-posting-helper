import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['init_chrome_stub.ts', 'node_modules/axe-core/axe.min.js'],
    mockReset: true,
    // ... Specify options here.
  },
  assetsInclude: ['popup/src/app/testdata/*.html'],
});
