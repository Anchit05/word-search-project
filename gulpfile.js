'use strict';

var gulp = require('gulp');

// load plugins
var $ = require('gulp-load-plugins')({
  pattern: [
    'gulp-*',
    'main-bower-files',
    'browser-sync',
    'jshint-stylish',
    'merge-stream',
    'wiredep'
  ]}
);

var paths = {
  app: 'app/',
  bower: 'app/libs/',
  viewsFolder: 'template/',
  dist: 'dist/'
};


var onError = function (err) {
  $.util.log($.util.colors.red(err));
};
var sass = require('gulp-ruby-sass');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('styles', function () {
  return sass([
      'app/styles/{,*/}*.scss', 
      './node_modules/bootstrap-sass/assets/stylesheets/'])
    .on('error', sass.logError)
    .pipe(gulp.dest('./app/css/'))
    .pipe($.browserSync.reload({stream:true}))
    .pipe($.size());
});

gulp.task('scripts', function () {
  return gulp.src([
        paths.app + 'js/**/*.js',
        'gulpfile.js'])
      .pipe($.cached('js'))
      .pipe($.jshint())
      .pipe($.jshint.reporter($.jshintStylish))
      .pipe($.size());
});

gulp.task('html', ['styles', 'scripts', 'wiredep'], function () {
  var jsFilter = $.filter('**/*.js', {restore: true}),
      htmlFilter = $.filter('*.html', {restore: true}),
      cssFilter = $.filter('**/*.css' , {restore: true});

  /**
   * FIXME: Temporarily replacing csso with minifyCss due to an issue
   * https://github.com/css/csso/issues/214
   *
   * Use csso once this has been resolved
   * */
  return gulp.src(paths.app + '*.html', {cwd: '.'})
      .pipe($.using())
      .pipe($.useref({searchPath: '{app}'}))
      .pipe($.rev())
      .pipe(jsFilter)
      .pipe($.uglify())
      .pipe(jsFilter.restore)
      .pipe(cssFilter)
      .pipe($.minifyCss())
      .pipe(cssFilter.restore)
      .pipe($.useref())
      .pipe($.revReplace())
      .pipe(htmlFilter)
      .pipe($.minifyHtml({
        empty: true,
        spare: true,
        quotes: true,
        comments: true
      }))
      .pipe(htmlFilter.restore)
      .pipe(gulp.dest(paths.dist))
      .pipe($.size());
});

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  return gulp.src(paths.app + '*.html')
      .pipe($.plumber(onError))
      .pipe(wiredep({
        directory: paths.bower
      }))
      .pipe(gulp.dest(paths.app));
});

gulp.task('clear', function (done) {
  return $.cache.clearAll(done);
});

gulp.task('clean', function () {
  return gulp.src([paths.dist], {read: false})
      .pipe($.clean());
});

gulp.task('images', function () {
  return gulp.src(paths.app + 'img/**/*.{png,jpg,jpeg,gif}')
      //.pipe($.cache($.imagemin({
      //  optimizationLevel: 3,
      //  progressive: true,
      //  interlaced: true
      //})))
      .pipe(gulp.dest(paths.dist + 'img/'))
      .pipe($.size());
});

gulp.task('fonts', function () {
  var fileStream = $.mergeStream(
      gulp.src($.mainBowerFiles()),
      gulp.src(paths.app + 'fonts/*'));

  return fileStream
      .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
      .pipe($.flatten())
      .pipe(gulp.dest(paths.dist + 'fonts/'))
      .pipe($.size());
});

gulp.task('build', ['html', 'images', 'fonts']);


gulp.task('default', ['clean', 'clear'], function () {
  gulp.start('build');
});

function browserSyncInit(baseDir, files, browser, open) {
  browser = browser === undefined ? 'default' : browser;
  open = open === undefined ? 'local' : open;

  $.browserSync.instance = $.browserSync.init(files, {
    server: {
      baseDir: baseDir
    },
    port: 8000,
    browser: browser,
    open: open
  });

}

gulp.task('server', ['watch'], function() {
  browserSyncInit([
    paths.app
  ], [
    paths.app + 'images/**/*',
    paths.app + '*.html',
    paths.app + 'template/**/*.html',
    paths.app + 'js/**/*.js'
  ]);
});

gulp.task('server:dist', ['default', 'watch'], function() {
  browserSyncInit([
    paths.dist
  ], [
    paths.dist + 'images/**/*',
    paths.dist + '*.html',
    paths.dist + 'template/*.html',
    paths.dist + 'scripts/**/*.js'
  ]);
});

gulp.task('server:e2e', function () {
  browserSyncInit([
    paths.app
  ], null, null, false);
});

gulp.task('watch', ['wiredep', 'scripts', 'styles'], function () {
  gulp.watch(paths.app + 'styles/**/*.scss', ['styles']);
  gulp.watch('bower.json', ['wiredep']);
});
