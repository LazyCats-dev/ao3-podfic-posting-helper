import path from 'path';

import typescript from '@rollup/plugin-typescript';

import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import {chromeExtension, simpleReloader} from 'rollup-plugin-chrome-extension';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import styles from 'rollup-plugin-styler';
import zip from 'rollup-plugin-zip';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'src/manifest.json',
  output: {
    dir: 'dist',
    format: 'esm',
    chunkFileNames: path.join('chunks', '[name]-[hash].js'),
    sourcemap: true,
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': isProduction
        ? JSON.stringify('production')
        : JSON.stringify('development'),
      preventAssignment: true,
    }),
    chromeExtension(),
    // Adds a Chrome extension reloader during watch mode
    simpleReloader(),
    typescript(),
    styles({
      mode: 'inject',
      sass: {
        includePaths: ['node_modules/'],
      },
    }),
    resolve({browser: true}),
    commonjs(),
    nodePolyfills(),
    // Outputs a zip file in ./releases
    isProduction && zip({dir: 'releases'}),
  ],
};
