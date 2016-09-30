var gulp = require('gulp'),
  cleanCSS = require('gulp-clean-css'),
  uglify = require('gulp-uglify'),
  eslint = require('gulp-eslint'),
  babel = require('gulp-babel');

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
gulp.task('css', function() {
  gulp.src(['src/spa.css'])
  .pipe(cleanCSS())
  .pipe(gulp.dest('dist'));
});

// DIST任务
gulp.task('default', function() {
  gulp.start('babel', 'css');
});
