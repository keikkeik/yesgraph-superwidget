"use strict";
var gulp = require("gulp");
var debug = require('gulp-debug');
var jshint = require('gulp-jshint');
var reporter = require('../jshint-reporter');
var config = require("../config");

gulp.task("lint", function(){
    return gulp.src(config.tasks.lint.files, {base: config.src.root})
        .pipe(debug({ title: "lint" }))
        .pipe(jshint(config.tasks.lint.options))
        .pipe(jshint.reporter(reporter, {outputFile: config.tasks.lint.reportFile}))
        .pipe(jshint.reporter("fail"));
});
