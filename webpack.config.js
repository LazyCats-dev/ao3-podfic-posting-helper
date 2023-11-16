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
  // {
  //   entry: {
  //     popup: path.resolve(__dirname, 'src', 'popup.scss'),
  //   },
  //   output: {
  //     path: path.join(__dirname, 'dist/'),
  //     filename: '[name]_css.js',
  //     iife: false,
  //   },
  //   module: {
  //     rules: [
  //       {
  //         test: /\.scss$/,
  //         use: [
  //           {
  //             loader: 'file-loader',
  //             options: {
  //               name: 'popup.css',
  //             },
  //           },
  //           {loader: 'extract-loader'},
  //           {loader: 'css-loader'},
  //           {
  //             loader: 'sass-loader',
  //             options: {
  //               // Prefer Dart Sass
  //               implementation: require('sass'),

  //               // See https://github.com/webpack-contrib/sass-loader/issues/804
  //               webpackImporter: false,
  //               sassOptions: {
  //                 includePaths: ['./node_modules'],
  //               },
  //             },
  //           },
  //         ],
  //       },
  //     ],
  //   },
  //   optimization: {
  //     minimize: false,
  //   },
  // },
  // {
  //   entry: {
  //     options: path.resolve(__dirname, 'src', 'options.scss'),
  //   },
  //   output: {
  //     path: path.join(__dirname, 'dist/'),
  //     filename: '[name]_css.js',
  //     iife: false,
  //   },
  //   module: {
  //     rules: [
  //       {
  //         test: /\.scss$/,
  //         use: [
  //           {
  //             loader: 'file-loader',
  //             options: {
  //               name: 'options.css',
  //             },
  //           },
  //           {loader: 'extract-loader'},
  //           {loader: 'css-loader'},
  //           {
  //             loader: 'sass-loader',
  //             options: {
  //               // Prefer Dart Sass
  //               implementation: require('sass'),

  //               // See https://github.com/webpack-contrib/sass-loader/issues/804
  //               webpackImporter: false,
  //               sassOptions: {
  //                 includePaths: ['./node_modules'],
  //               },
  //             },
  //           },
  //         ],
  //       },
  //     ],
  //   },
  //   optimization: {
  //     minimize: false,
  //   },
  // },
];
