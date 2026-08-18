// Generated using webpack-cli http://github.com/webpack-cli
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { RsdoctorWebpackPlugin } = require('@rsdoctor/webpack-plugin');

// hack to get the webpack mode
const isDevMode = !process.argv.includes('--mode=production');
// Rsdoctor slows the build down, so only analyze the production bundle when explicitly asked for it: see 'build:analyze'
const isBundleAnalysisEnabled = !isDevMode && process.env.ANALYZE === 'true';

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  // Rsdoctor needs a source map to attribute the bytes of the minified bundle to individual modules, which is what the
  // 'Parsed Size' of a module is. 'hidden-source-map' emits the map without adding a sourceMappingURL comment to the
  // bundle, so the analyzed bundle stays byte for byte the one that the regular build produces. The key is only set
  // when analyzing, to keep the webpack defaults everywhere else, in particular the source maps of the dev server.
  ...(isBundleAnalysisEnabled ? { devtool: 'hidden-source-map' } : {}),
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
  ]
    .concat(isDevMode ? [] : [new MiniCssExtractPlugin()])
    .concat(isBundleAnalysisEnabled ? [new RsdoctorWebpackPlugin()] : []),
  // Fail the production build when the bundle grows, which is the signal that something new was pulled in.
  // Sizes are in bytes, rounded up to the next kB from the current build: update them when an increase is intended.
  // Development bundles are not minified, so no budget is enforced there, and an analyze run is a diagnostic:
  // reporting a size error there would only add noise to the report that was asked for to understand the size.
  performance: {
    hints: isDevMode || isBundleAnalysisEnabled ? false : 'error',
    maxAssetSize: 467_000,
    maxEntrypointSize: 473_000,
  },
};
