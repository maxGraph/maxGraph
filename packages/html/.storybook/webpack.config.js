const {merge} = require('webpack-merge');
const custom = require('../webpack.config');

module.exports = ({ config }) => {
  return merge(custom, config);
};