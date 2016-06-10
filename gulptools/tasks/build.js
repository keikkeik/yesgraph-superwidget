var gulp = require("gulp");
var config = require("../config");

gulp.task("build", ["minify"], function(){
    return gulp.src(config.tasks.build.files, {base: config.src.root})
        .pipe(gulp.dest(config.dest.root));
});
