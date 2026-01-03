import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['init_chrome_stub.ts', 'node_modules/axe-core/axe.min.js'],
    mockReset: true,
    browser: {
      viewport: {width: 600, height: 600},
    },
    // ... Specify options here.
  },
  assetsInclude: ['popup/src/app/testdata/*.html'],
});
