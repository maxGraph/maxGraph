const path = require('path');
const { merge } = require('webpack-merge');
const base = require('../../webpack.config');

module.exports = merge(base, {
  resolve: {
    alias: {
      '@maxgraph/core': path.resolve(__dirname, '../core/src'),
      '@maxgraph/css': path.resolve(__dirname, '../core/css'),
    },
  },
});
