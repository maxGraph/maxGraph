// Generated using webpack-cli http://github.com/webpack-cli
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {
  withBundleAnalysisAndSizeBudget,
} = require('../../scripts/webpack/bundle-analysis.cjs');

// hack to get the webpack mode
const isDevMode = !process.argv.includes('--mode=production');

const config = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  devServer: {
    static: './dist',
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [isDevMode ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: './favicon.svg', to: 'favicon.svg' }],
    }),
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
  ].concat(isDevMode ? [] : [new MiniCssExtractPlugin()]),
};

module.exports = withBundleAnalysisAndSizeBudget(
  { isDevMode, maxAssetSize: 240_000, maxEntrypointSize: 241_000 },
  config
);
