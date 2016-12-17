import webpack from 'webpack';
import config from './config';
import path from 'path';

let plugins = [];

if (!config.env.debug) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    output: {
      'comments': false
    }
  }));
}

export default {
  cache: config.env.debug,
  debug: config.env.debug,
  entry: config.javascripts.entry,

  output: {
    path: config.javascripts.output,
    filename: '[name].bundle.js'
  },

  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }, {
      test: /\.(glsl|vs|fs|frag|vert)$/,
      loader: 'shader'
    }]
  },

  resolve: {
    extensions: ['', '.js', '.es6'],
    modulesDirectories: [
      config.modulesDir
    ]
  },

  glsl: {
    chunkPath: path.join(__dirname, '/source/chunks')
  },

  plugins: plugins
};
