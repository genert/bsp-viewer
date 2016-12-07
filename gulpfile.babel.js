import config from './config';
import webpackConfig from './webpack.config';
import path from 'path';
import _ from 'lodash';
import gulp from 'gulp';
import webpack from 'webpack';
import rimraf from 'rimraf-promise';
import sequence from 'run-sequence';
import $plumber from 'gulp-plumber';
import $sass from 'gulp-sass';
import $sourcemaps from 'gulp-sourcemaps';
import $pug from 'gulp-pug';
import $util from 'gulp-util';
import $rev from 'gulp-rev';
import $replace from 'gulp-replace';
import $prefixer from 'gulp-autoprefixer';
import $size from 'gulp-size';
import $imagemin from 'gulp-imagemin';
import $changed from 'gulp-changed';

// Set environment variable.
process.env.NODE_ENV = config.env.debug ? 'development' : 'production';

// Create browserSync.
const browserSync = require('browser-sync').create();

// Rewrite gulp.src for better error handling.
let gulpSrc = gulp.src;
gulp.src = function () {
  return gulpSrc(...arguments)
    .pipe($plumber((error) => {
      const { plugin, message } = error;
      $util.log($util.colors.red(`Error (${plugin}): ${message}`));
      this.emit('end');
    }));
};

// Create server.
gulp.task('server', () => {
  browserSync.init({
    notify: false,
    server: {
      baseDir: config.buildDir
    }
  });
});

// Compiles and deploys images.
gulp.task('images', () => {
  return gulp.src(config.images.entry)
  .pipe($changed(config.images.output))
  .pipe($imagemin())
  .pipe($size({ title: '[images]', gzip: true }))
  .pipe(gulp.dest(config.images.output));
});


// Compiles and deploys stylesheets.
gulp.task('stylesheets', () => {
  if (config.env.debug) {
    return gulp.src(config.stylesheets.entry)
      .pipe($sourcemaps.init())
      .pipe($sass(config.stylesheets.sass).on('error', $sass.logError))
      .pipe($prefixer(config.stylesheets.autoprefixer))
      .pipe($sourcemaps.write('/'))
      .pipe(gulp.dest(config.stylesheets.output))
      .pipe($size({ title: '[stylesheets]', gzip: true }))
      .pipe(browserSync.stream({ match: '**/*.css' }));
  } else {
    return gulp.src(config.stylesheets.entry)
      .pipe($sass(config.stylesheets.sass).on('error', $sass.logError))
      .pipe($prefixer(config.stylesheets.autoprefixer))
      .pipe(gulp.dest(config.stylesheets.output))
      .pipe($size({ title: '[stylesheets]', gzip: true }));
  }
});

// Compiles and deploys javascript files.
gulp.task('javascripts', (callback) => {
  let guard = false;

  if (config.env.debug) {
    webpack(webpackConfig).watch(100, build(callback));
  } else {
    webpack(webpackConfig).run(build(callback));
  }

  function build (done) {
    return (err, stats) => {
      if (err) {
        throw new $util.PluginError('webpack', err);
      } else {
        $util.log($util.colors.green('[webpack]'), stats.toString());
      }

      if (!guard && done) {
        guard = true;
        done();
      }
    };
  }
});

// Compiles and deploys HTML files.
gulp.task('html', () => {
  return gulp.src(config.html.entry)
    .pipe($pug())
    .pipe(gulp.dest(config.html.output));
});

// Files revision.
gulp.task('rev', (callback) => {
  gulp.src(config.rev.entry)
    .pipe($rev())
    .pipe(gulp.dest(config.rev.output))
    .pipe($rev.manifest(config.rev.manifestFile))
    .pipe(gulp.dest(config.rev.output))
    .on('end', () => {
      const manifestFile = path.join(config.rev.output, config.rev.manifestFile);
      const manifest = require(manifestFile);
      let removables = [];
      let pattern = (_.keys(manifest)).join('|');

      for (let v in manifest) {
        if (v !== manifest[v]) {
          removables.push(path.join(config.rev.output, v));
        }
      }

      removables.push(manifestFile);

      rimraf(`{${removables.join(',')}}`)
        .then(() => {
          if (!_.isEmpty(config.cdn)) {
            gulp.src(config.rev.replace)
              .pipe($replace(new RegExp(`((?:\\.?\\.\\/?)+)?([\\/\\da-z\\.-]+)(${pattern})`, 'gi'), (m) => {
                let k = m.match(new RegExp(pattern, 'i'))[0];
                let v = manifest[k];
                return m.replace(k, v).replace(/^((?:\.?\.?\/?)+)?/, _.endsWith(config.cdn, '/') ? config.cdn : `${config.cdn}/`);
              }))
              .pipe(gulp.dest(config.rev.output))
              .on('end', callback)
              .on('error', callback);
          } else {
            gulp.src(config.rev.replace)
              .pipe($replace(new RegExp(`${pattern}`, 'gi'), (m) => (manifest[m])))
              .pipe(gulp.dest(config.rev.output))
              .on('end', callback)
              .on('error', callback);
          }
        });
    })
    .on('error', callback);
});

// Watch for file changes.
gulp.task('watch', () => {
  config.watch.entries.map((entry) => {
    gulp.watch(entry.files, { cwd: config.sourceDir }, entry.tasks);
  });

  gulp.watch([
    'public/**/*.html',
    'public/**/*.js'
  ]).on('change', () => {
    browserSync.reload();
  });
});

gulp.task('default', () => {
  let seq = [
    'images',
    'javascripts',
    'stylesheets',
    'html'
  ];

  if (config.env.debug) {
    seq.push('server');
    seq.push('watch');
  }

  rimraf(config.buildDir)
    .then(() => {
      sequence(...seq);
    })
    .catch((error) => {
      throw error;
    });
});
