import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import styles from 'rollup-plugin-styles';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import {emptyDir} from 'rollup-plugin-empty-dir';

import {chromeExtension} from 'rollup-plugin-chrome-extension';

export default {
  input: 'src/manifest.json',
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    chromeExtension(),
    resolve({browser: true}),
    styles({
      mode: 'inject',
      sass: {
        includePaths: ['node_modules/'],
      },
    }),
    commonjs(),
    nodePolyfills(),
    typescript(),
    emptyDir(),
  ],
};
