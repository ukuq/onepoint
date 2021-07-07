//修改文件后 可以通过此脚本重新编译发布
const {readdirSync, writeFileSync} = require('fs');
const ncc = require('@vercel/ncc');

const APP_PATH = require('path').resolve(__dirname, '../lib');
const DIST_PATH = require('path').resolve(__dirname, '../ncc');

readdirSync(APP_PATH + '/starters').forEach(name => {
    if (name.startsWith('local')) {
        return;
    }
    ncc(APP_PATH + '/starters/' + name, {
        // provide a custom cache path or disable caching
        cache: false,
        // externals to leave as requires of the build
        externals: [],
        // directory outside of which never to emit assets
        filterAssetBase: APP_PATH, // default
        minify: false, // default
        sourceMap: false, // default
        sourceMapBasePrefix: '../', // default treats sources as output-relative
        // when outputting a sourcemap, automatically include
        // source-map-support in the output file (increases output by 32kB).
        sourceMapRegister: true, // default
        watch: false, // default
        license: '', // default does not generate a license file
        v8cache: false, // default
        quiet: false, // default
        debugLog: false // default
    }).then(({code}) => {
        if (name.startsWith('cf')) {
            code = 'globalThis.__dirname="";\n' + code;
        }
        writeFileSync(DIST_PATH + '/ncc_' + name, code);
    });
});


