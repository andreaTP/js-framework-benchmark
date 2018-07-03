'use strict';
var path = require('path')
var cache = {};
var loaders = [
	{
		test: /\.js$/,
		loader: 'babel-loader'
	},
	{
		test: /\.css$/,
		loader: 'style-loader!css-loader'
	}
];
var extensions = [
	'.js', '.jsx', '.es6.js'
];

module.exports = [{
	cache: cache,
	mode: "production",
	entry: {
		main: './src/Main.js',
		page: './src/Page.js'
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: '[name].js'
	},
	resolve: {
		extensions: extensions,
		modules: [
			__dirname,
			path.resolve(__dirname, "src"),
			"node_modules"
		],
		alias: {
		}
	},
	module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  }
}];