const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
  mode: 'production',
  entry: {
    inject: path.resolve(__dirname, 'src', 'inject.js'),
    popup: path.resolve(__dirname, 'src', 'popup.js'),
    options: path.resolve(__dirname, 'src', 'options.js'),
    'google-analytics': path.resolve(__dirname, 'src', 'google-analytics.js'),
    'init-components': path.resolve(__dirname, 'src', 'init-components.js'),
    utils: path.resolve(__dirname, 'src', 'utils.js'),
  },
  output: {
    path: path.join(__dirname, 'dist/js'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{from: '.', to: '.', context: 'public'}],
    }),
  ],
  optimization: {
    minimize: false,
  },
};
