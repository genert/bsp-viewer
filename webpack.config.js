import webpack from 'webpack';
import config from './config';

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
    filename: config.javascripts.output
  },

  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  },

  resolve: {
    extensions: ['', '.js', '.es6'],
    modulesDirectories: [
      config.modulesDir
    ]
  },

  plugins: plugins
};
