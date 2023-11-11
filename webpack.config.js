const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
  mode: 'production',
  entry: {
    inject: path.resolve(__dirname, 'src', 'inject.js'),
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
        {from: '*.css', to: '.', context: 'src'},
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
    ],
  },
  optimization: {
    minimize: false,
  },
};
