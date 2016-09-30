var gulp = require('gulp'),
  cleanCSS = require('gulp-clean-css'),
  uglify = require('gulp-uglify'),
  eslint = require('gulp-eslint'),
  clean = require('gulp-clean'),
  babel = require('gulp-babel');

// 清空资源
gulp.task('clean', function() {
  return gulp.src('dist/js').pipe(clean());
});
gulp.task('clean-css', function() {
  return gulp.src('dist/css').pipe(clean());
});

// 压缩modules文件
gulp.task('babel', function() {
  gulp.src(['src/spa.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(babel())
    .pipe(uglify({
      mangle: {
        except: ['require', 'exports', 'module', '$']
      }
    }))
    .pipe(gulp.dest('dist'));
});

// 压缩CSS
gulp.task('css', ['clean-css'], function() {
  gulp.src(['src/css/spa.css'])
  .pipe(cleanCSS())
  .pipe(gulp.dest('dist/css'));
});

// DIST任务
gulp.task('default', ['clean'], function() {
  gulp.start('babel', 'css');
});
