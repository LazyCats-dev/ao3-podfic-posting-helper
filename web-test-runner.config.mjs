import {esbuildPlugin} from '@web/dev-server-esbuild';
import {jasmineTestRunnerConfig} from 'web-test-runner-jasmine';
import {playwrightLauncher} from '@web/test-runner-playwright';

export default {
  ...jasmineTestRunnerConfig(),
  plugins: [esbuildPlugin({ts: true, target: 'auto', sourceMap: true})],
  groups: [
    {
      name: 'unit-tests-all-browsers',
      files: 'tests/utils.test.ts',
      browsers: [
        playwrightLauncher({product: 'chromium'}),
        playwrightLauncher({product: 'firefox'}),
      ],
    },
  ],
};
