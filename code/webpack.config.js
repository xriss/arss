const path = require('path');

module.exports = {
  entry: './js/arss.js',
  resolve: {
    fallback : {
      fs: false,
      fetch: require.resolve('cross-fetch'),
      buffer: require.resolve('buffer'),
      stream: require.resolve("stream-browserify"),
    },
  },
  performance: {
    hints: false,
    maxEntrypointSize: 555555,
    maxAssetSize: 555555,
  },
  output: {
    path: path.resolve(__dirname, '../plated/source/js/'),
    filename: 'arss.js',
    globalObject: 'this',
    library: {
      name: 'arss',
      type: 'umd',
    },
  },
};

