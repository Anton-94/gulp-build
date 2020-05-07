let project_dir = 'dist';
let source_dir = 'src';
let fs = require('fs');

let path = {
    build: {
        html: project_dir + "/",
        css: project_dir + "/css/",
        js: project_dir + "/js/",
        img: project_dir + "/img/",
        fonts: project_dir + "/fonts/",
    },
    src: {
        html: [source_dir + "/*.html", "!" + source_dir + "/_*.html"],
        css: source_dir + "/scss/style.scss",
        js: source_dir + "/js/script.js",
        img: source_dir + "/img/**/*.{jpg,png,ico,webp,gif,svg}",
        fonts: source_dir + "/fonts/*.ttf",
    },
    watch: {
        html: source_dir + "/**/*.html",
        css: source_dir + "/scss/**/*.scss",
        js: source_dir + "/js/**/*.js",
        img: source_dir + "/img/**/*.{jpg,png,ico,webp,gif,svg}"
    },
    clean: "./" + project_dir + "/"
};

let {src, dest} = require('gulp'),
    gulp = require('gulp'),
    browsersync = require('browser-sync').create()
    fileinclude = require('gulp-file-include')
    del = require('del'),
    scss = require('gulp-sass')
    autoprefixer = require('gulp-autoprefixer'),
    group_media = require('gulp-group-css-media-queries'),
    clean_css = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify-es').default,
    imagemin = require('gulp-imagemin'),
    webp = require('gulp-webp'),
    webp_html = require('gulp-webp-html'),
    webp_css = require('gulp-webpcss'),
    svg_sprite = require('gulp-svg-sprite'),
    ttf2woff2 = require('gulp-ttf2woff2'),
    ttf2woff = require('gulp-ttf2woff'),
    fonter = require('gulp-fonter');

function browserSync() {
    browsersync.init({
        server: {
            baseDir: "./" + project_dir + "/"
        },
        port: 3000,
        notify: false
    });
}

function html() {
    return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webp_html())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

function css() {
    return src(path.src.css)
    .pipe(
        scss({
            outputStyle: "expanded"
        })
    )
    .pipe(group_media())
    .pipe(autoprefixer({
        overrideBrowserlist: ["last 5 versions"],
        cascade: true
    }))
    .pipe(webp_css())
    .pipe(dest(path.build.css))
    .pipe(clean_css())
    .pipe(rename({
        extname: ".min.css"
    }))
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

function js() {
    return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(rename({
        extname: ".min.js"
    }))
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}

function images() {
    return src(path.src.img)
    .pipe(webp({
        quality: 70
    }))
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3
    }))
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}

function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean() {
    return del(path.clean);
}

gulp.task('svgSprite', function () {
    return gulp.src([source_dir + '/iconsprite/*.svg'])
        .pipe(svg_sprite({
            mode: {
                stack: {
                    sprite: "../icons/icons.svg",
                }
            }
        }))
        .pipe(dest(path.build.img))
});


gulp.task('otf2ttf', function () {
    return src([source_dir + "/fonts/*.otf"])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest('./' + source_dir + '/fonts/'))
});

function includeFonts() {
    let file_content = fs.readFileSync(source_dir + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_dir + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_dir + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() {

}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
            .pipe(ttf2woff2())
            .pipe(dest(path.build.fonts))
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), includeFonts);
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.includeFonts = includeFonts;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
