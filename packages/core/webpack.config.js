const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const base = require('../../webpack.config');
const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = merge(base, {
  entry: './src/index.ts',
  output: {
    filename: 'maxgraph.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'maxgraph',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
        loader: 'url-loader',
        options: {
          name: 'images/[hash].[ext]',
          limit: 10000,
        },
      },
    ],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new CircularDependencyPlugin({
      // exclude detection of files based on a RegExp
      exclude: /a\.js|node_modules/,
      // include specific files based on a RegExp
      // include: /dir/,
      // add errors to webpack instead of warnings
      failOnError: true,
      // allow import cycles that include an asyncronous import,
      // e.g. via import(/* webpackMode: "weak" */ './file.js')
      allowAsyncCycles: false,
      // set the current working directory for displaying module paths
      cwd: process.cwd(),
    }),
  ],
});
