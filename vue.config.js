const fs = require('fs')
const path = require('path');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const { InjectManifest } = require('workbox-webpack-plugin')
const { ESBuildMinifyPlugin } = require('esbuild-loader');

const { gitDescribe, gitDescribeSync } = require('git-describe')
process.env.VUE_APP_GIT_HASH = gitDescribeSync().hash
process.env.VUE_APP_VERSION = require('./package.json').version
process.env.VUE_APP_BUILDTIME = (new Date()).toISOString()
process.env.VUE_APP_BUILD = `v${process.env.VUE_APP_VERSION}-${process.env.VUE_APP_GIT_HASH}-${process.env.VUE_APP_BUILDTIME}`
const injectStr = `const BUILD_VERSION = '${process.env.VUE_APP_BUILD}';\n`;

let devHttpsCert = false;
try {
    devHttpsCert = {
        key: fs.readFileSync('cert/server.key'),
        cert: fs.readFileSync('cert/server.crt'),
	}
}
catch (ex) {
	// nop
}

module.exports = {
    productionSourceMap: false,
    pages: {
        index: {
            // entry for the page
            entry: 'src/intro/js/main.js',
            // the source template
            template: 'public/index.html',
            // output as dist/map.html
            filename: 'index.html',
           // when using title option,
            // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
            title: '海域遊憩平台一站式網站',
            // chunks to include on this page, by default includes
            // extracted common chunks and vendor chunks.
            // chunks: ['chunk-vendors', 'chunk-common', 'index']
        },
        map: {
            // entry for the page
            entry: 'src/main.js',
            // the source template
            template: 'public/map.html',
            // output as dist/map.html
            filename: 'map.html',
           // when using title option,
            // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
            title: '海域整合資訊',
            // chunks to include on this page, by default includes
            // extracted common chunks and vendor chunks.
            // chunks: ['chunk-vendors', 'chunk-common', 'index']
        },
    },
    configureWebpack: config => {},
    chainWebpack: config => {
        config.resolve.modules
            .add(path.resolve('src/intro/js/'))
            .add(path.resolve('src/intro/scss/'))
            .add(path.resolve('src/intro/img/'))
            // .add(path.resolve('src/assets/intro/'))

        config.devtool('eval');
        if (process.env.NODE_ENV === 'production') {
            config.devtool('hidden-source-map');

            config.plugins.delete('preload');
            config.plugins.delete('prefetch');
            config.optimization.minimize(true);
            config.optimization.splitChunks({
                chunks: 'async'
            })
            config.optimization.minimizers.delete('terser');
            config.optimization.minimizer('esbuild')
            .use(ESBuildMinifyPlugin, [{
                target: 'es2015', // es2015, es2020, esnext
                css: true,
            }])


            config.plugin('InjectManifest')
                .use(InjectManifest, [{
                    swSrc: './src/sw-manifest.js',
                    compileSrc: false,
                    maximumFileSizeToCacheInBytes: 99999999
                }])

            config.plugin('sw-copy')
                .use(require('copy-webpack-plugin'), [
                    [{
                        from: 'src/sw.js',
                        to: 'sw.js',
                        transform(content, path) {
                            return injectStr + content;
                        },
                    }]
                ])

            config.plugin('FaviconsWebpackPlugin')
                .use(FaviconsWebpackPlugin, [{
                    inject: true,
                    cache: true,
                    mode: 'webapp',
                    devMode: 'webapp',
                    prefix: './img/icons',
                    outputPath: './img/icons',
                    publicPath: './',
                    logo: "./src/assets/logoOCA.png",
                    favicons: {
                        appName: "海域整合資訊",
                        appShortName: "海域整合資訊",
                        appDescription: "海域遊憩活動一站式資訊平臺",
                        lang: "zh-Hant",
                        developerName: "詮華",
                        display: "standalone",
                        manifestRelativePaths: "./",
                        start_url: `../../`,
                        scope: `../../`, // because 'prefix' == './img/icons'
                        icons: {
                            // Platform Options:
                            // - offset - offset in percentage
                            // - background:
                            //   * false - use default
                            //   * true - force use default, e.g. set background for Android icons
                            //   * color - set background for the specified icons
                            //   * mask - apply mask in order to create circle icon (applied by default for firefox). `boolean`
                            //   * overlayGlow - apply glow effect after mask has been applied (applied by default for firefox). `boolean`
                            //   * overlayShadow - apply drop shadow after mask has been applied .`boolean`
                            //
                            android: true,              // Create Android homescreen icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                            appleIcon: true,            // Create Apple touch icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                            appleStartup: true,         // Create Apple startup images. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                            coast: false,                // Create Opera Coast icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                            favicons: true,             // Create regular favicons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                            firefox: true,              // Create Firefox OS icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                            windows: true,              // Create Windows 8 tile icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                            yandex: false,                // Create Yandex browser icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                        },
                    }
                }])
        }
        config.module.rule('pug')
            .test(/\.pug$/)
            .use('pug-html-loader')
            .loader('pug-html-loader')
            .end()
        config.module.rule('worker')
            .test(/\.worker\.ts$/)
            .use('worker-loader')
            .loader('worker-loader')
            .end()

        // seems bug @ element-ui/lib/locale/index.js not exist
        // config.module.rule('js').uses.delete('cache-loader')
        // config.module.rule('js').uses.delete('babel-loader')
        // config.module.rule('js').uses.delete('thread-loader')
        // config.module.rule('js').use('swc-loader')
        //     .loader('swc-loader')
        //     .options({
        //         jsc: {
        //             target: "es5", // es5 es2015(es6)
        //             parser: {
        //                 syntax: "ecmascript",
        //             },
        //             //loose: true,
        //         },
        //     })

        // use map.html
        // config.plugin('html').tap((opts) => {
        //     opts[0].filename = './map.html';
        //     opts[0].template = "./public/map.html"
        //     return opts;
        // });
        // // copy exist index.html
        // config.plugin('copy').tap((opts) => {
        //     opts[0][0].ignore.forEach(opt => {
        //         if (opt.glob === 'index.html') {
        //             opt.glob = 'map.html';
        //         }
        //         return opt;
        //     });
        //     return opts;
        // });
    },
    devServer: {
        disableHostCheck: true, // fix socket err
        // host: 'lvh.me',
        public: 'lvh.me',
        sockHost: 'lvh.me', // not work!!!!
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        http2: !!devHttpsCert,
        https: devHttpsCert,
        writeToDisk: false
    },
    css: {
        loaderOptions: {
            sass: { // global style
                // data: `@import "~@/custom.scss";`,
                data: (loaderContext) => {
                    // More information about available properties https://webpack.js.org/api/loaders/
                    const { resourcePath, rootContext } = loaderContext;
                    const relativePath = path.relative(rootContext, resourcePath);
                    // console.log('[scss]', relativePath, resourcePath);
                    if (relativePath === "src/intro/scss/style.scss") { // skip intro page
                        return '';
                    }
                    return `@import "~@/custom.scss";`;
                  },
            },
        }
    },
    publicPath: './',
}
