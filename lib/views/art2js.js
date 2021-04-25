//https://github.com/kangax/html-minifier/issues/1076
require('art-template/node_modules/html-minifier').minify = require('html-minifier-terser').minify;

const fs = require('fs');
const path = require('path');
const ART_PATH = path.join(__dirname, 'art/');
const JS_PATH = path.join(__dirname, 'js/');
const art = require('art-template');
const artOpt = {debug: false};
module.exports.watch = function (flag) {
    fs.readdirSync(ART_PATH).forEach(e => {
        const src = ART_PATH + e;
        const des = JS_PATH + e + '.js';
        if (!fs.existsSync(des) || fs.statSync(src).mtimeMs > fs.statSync(des).mtimeMs) {
            console.log("update: " + e);
            const r = art.compile(fs.readFileSync(src, 'utf-8'), artOpt);
            fs.writeFileSync(des, `const $imports = require('../art-runtime');module.exports={name:"${e}"};module.exports.render=` + r.toString(), {encoding: 'utf-8'});
            console.log("update success: " + e);
            require(des).render = r;
        } else {
            console.log("ignore: " + e);
        }
        //@important 仅为方便测试使用，release前需要手动运行一次，将数据写入js。
        const desJs = require(des);
        flag && fs.watchFile(src, stats => {
            desJs.render = art.compile(fs.readFileSync(src, 'utf-8'), artOpt);
            console.log('update file:' + e + ', ' + stats.mtime.toLocaleString());
        });
    });
};