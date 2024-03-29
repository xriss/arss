const path = require('path');

const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");
var ZipPlugin = require('zip-webpack-plugin');


let dd=new Date()
let da=new Date(dd.getFullYear(), 0, 0)
let db=new Date(dd.getFullYear()+1, 0, 0)
let dd_yy=(dd.getFullYear()-2000)
let dd_dd=Math.floor( 100000 * (dd-da) / (db-da) )
let dd_version=dd_yy+"."+( ("0000"+dd_dd).slice(-5) )

console.log("VERSION == "+dd_version)

module.exports = {
  devtool: false,
  plugins: [
	new webpack.DefinePlugin({
		__VERSION__: JSON.stringify(dd_version)
	}),
    new CopyPlugin({
      patterns: [
        { from: "static/manifest.json",        to: "manifest.json" },
        { from: "static/index.html",        to: "index.html" },
        { from: "static/index.js",          to: "index.js" },
        { from: "static/arss.css",          to: "arss.css" },
        { from: "static/arss.worker.js",    to: "arss.worker.js" },
      ],
    }),
    new ZipPlugin({
      filename: 'arss.extension.zip',
    }),
  ],
  entry: './js/arss.js',
  resolve: {
    fallback : {
      fs: false,
//      fetch: require.resolve('cross-fetch'),
      buffer: require.resolve('buffer'),
      stream: require.resolve("stream-browserify"),
    },
  },
  performance: {
    hints: false,
    maxEntrypointSize: 555555,
    maxAssetSize: 555555,
  },
  experiments: {
    outputModule: true,
  },
  output: {
    path: path.resolve(__dirname, '../plated/source/'),
    filename: 'arss.js',
    globalObject: 'this',
    library: {
      type: 'module',
    },
  },
};

