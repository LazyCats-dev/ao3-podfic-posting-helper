import {esbuildPlugin} from '@web/dev-server-esbuild';
import {jasmineTestRunnerConfig} from 'web-test-runner-jasmine';
import {playwrightLauncher} from '@web/test-runner-playwright';
import {sassPlugin} from 'esbuild-sass-plugin';

export default {
  ...jasmineTestRunnerConfig(),
  plugins: [
    esbuildPlugin({
      ts: true,
      target: 'auto',
      sourceMap: true,
      plugins: [sassPlugin()],
    }),
  ],
  groups: [
    {
      name: 'unit-tests-all-browsers',
      files: 'tests/**/*.test.ts',
      browsers: [
        playwrightLauncher({product: 'chromium'}),
        playwrightLauncher({product: 'firefox'}),
      ],
    },
  ],
};
