import path from 'path';
import { env as $env } from 'gulp-util';

// Common paths used throughout the Gulp pipeline.
const sourceDir = path.join(__dirname, 'source');
const buildDir = path.join(__dirname, 'public');
const modulesDir = path.join(__dirname, 'node_modules');

// Supported CLI options.
const env = {
  debug: !!($env.env === 'debug' || process.env.NODE_ENV === 'development')
};

// Exported configuration object.
export default {
  env: env,

  buildDir: buildDir,
  sourceDir: sourceDir,
  modulesDir: modulesDir,

  images: {
    entry: path.join(sourceDir, 'images', '**', '*.{jpg,jpeg,gif,png,svg,ico}'),
    output: path.join(buildDir, 'assets', 'images')
  },

  javascripts: {
    entry: path.join(sourceDir, 'javascript', 'main.js'),
    output: path.join(buildDir, 'assets', 'javascript', 'bundle.js')
  },

  stylesheets: {
    entry: path.join(sourceDir, 'stylesheet', 'main.{css,scss,sass}'),
    output: path.join(buildDir, 'assets', 'stylesheet'),
    sass: {
      outputStyle: env.debug ? 'nested' : 'compressed',
      precision: 3,
      includePaths: [
        path.join(sourceDir, 'stylesheet')
      ]
    },
    autoprefixer: {
      browsers: ['> 1%', 'IE 8']
    }
  },

  html: {
    entry: path.join(sourceDir, 'html', '*.{pug,html}'),
    output: path.join(buildDir)
  },

  rev: {
    entry: path.join(buildDir, '**', '*.{css,jpg,jpeg,gif,png,svg,js,eot,svg,ttf,woff,woff2,ogv,mp4}'),
    output: buildDir,
    manifestFile: 'rev-manifest.json',
    replace: path.join(buildDir, '**', '*.{css,scss,sass,js,html}')
  },

  watch: {
    entries: [{
      files: path.join('images', '**', '*.{jpg,jpeg,gif,png,svg}'),
      tasks: ['images']
    }, {
      files: path.join('stylesheet', '**', '*.{css,scss,sass}'),
      tasks: ['stylesheets']
    }, {
      files: path.join('html', '**', '*.{pug,html}'),
      tasks: ['html']
    }]
  }
};
