// Generated using webpack-cli http://github.com/webpack-cli
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    static: './dist',
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      // @maxgraph/core is a dependency of this project but don't declare imports with js extension
      // use this workaround to make webpack happy: https://github.com/webpack/webpack/issues/11467#issuecomment-691873586
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
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
  ],
};
