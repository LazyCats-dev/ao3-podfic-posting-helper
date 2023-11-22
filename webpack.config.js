const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = [
  {
    mode: 'production',
    entry: {
      inject: path.resolve(__dirname, 'src', 'inject.ts'),
      popup: path.resolve(__dirname, 'src', 'popup.ts'),
      options: path.resolve(__dirname, 'src', 'options.ts'),
    },
    output: {
      path: path.join(__dirname, 'dist/'),
      filename: '[name].js',
      iife: false,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {from: '.', to: '.', context: 'public'},
          {from: '*.html', to: '.', context: 'src'},
          {
            from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js',
            to: 'resources/.',
          },
        ],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            'style-loader',
            // Translates CSS into CommonJS
            'css-loader',
            // Compiles Sass to CSS
            'sass-loader',
          ],
        },
      ],
    },
    optimization: {
      minimize: false,
    },
  },
];
