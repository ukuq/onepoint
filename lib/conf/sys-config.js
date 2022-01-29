// 系统配置参数,运行时只读
const config = {
    PORT: 8020,
    NODE_ENV: 'production',

    SIGN_DELIMITER: '.',
    PAGE_SIZE: 200,

    ID_SIGN_LEN: 7,
    PAGE_SIGN_LEN: 7,

    CACHE_TIME_FILE: 15 * 60 * 1000,
    CACHE_TIME_LIST: 30 * 60 * 1000,

    AC_PASS_FILE: '.password=',

    PATH_ADMIN: '/admin/',
    PATH_API: '/api/',
    PATH_DOWN: '/down:',
    PATH_SHARE: '/s/',

    THEMES: ['w.w.art', 'simple.art'],
    MODULES: ['node_fs', 'onedrive', 'coding', 'teambition', 'googledrive', 'alidrive', 'phony'],
};

const configTemplate = {
    html: '<div>这是一段自定义html，你也可以在这里放置一些脚本文件</div>',
    logo: 'https://cdn.onesrc.cn/uploads/images/onepoint_30.png',
    name: 'DemoSite',
    readme: `## 部署成功

恭喜部署成功，但这并不意味着系统能使用了

接下来，你需要进入 [admin](/admin/) 页面，完成一些必须的配置

要注意，某些平台的配置参数，可能需要你在平台上自行配置

配置完成后，就可以添加云盘了
`,
    cors: ['*'],
    proxy: [],
    theme: config.THEMES[0],
    share_aeskey: 'password_len==16',
};
config.configTemplate = configTemplate;

const { _P } = require('../utils/node');

const commonSParams = [
    _P('theme', '', '', 8, config.THEMES, false, false),
    _P('logo', '', '', 6, 'consume your own logo', false, false),
    _P('name', '', '', 6, 'consume your site name', false, false),
    _P('html', '', '', 6, 'embed html code', true, false),
    _P('readme', '', '', 6, 'markdown supported', true, false),
    _P('proxy', [], 'proxy for download', 4, '', false, false),
    _P('cors', [], 'Allow CORS', 4, '', false, false),
    _P('share_aeskey', 'password_len==16', 'share link encryption key', 4, '', true, false),
];
commonSParams.forEach((e) => {
    e.value = configTemplate[e.name];
});
config.commonSParams = commonSParams;

const commonMParams = [
    _P('path', '', '', 8, 'mount path', false, true),
    _P('module', '', '', 8, config.MODULES, false, true),
    _P('password', '', '', 2, 'drive password', false, false),
    _P('readme', '', '', 2, 'markdown supported', true, false),
    // _P('desc', '', '', 2, 'short desc', false, false),
    _P('hidden', [], '當前想要隱藏的文件或文件夾，例如 /images/today, /video/something.mp4', 2, '', false, false),
];
config.commonMParams = commonMParams;

config.getAdminHtml = function (baseURL, version) {
    return `<!DOCTYPE html><html lang="en"><head><script>window.opConfigVersion=${version};window.opConfig=${JSON.stringify({
        baseURL,
        PATH_ADMIN: config.PATH_ADMIN,
        PATH_API: config.PATH_API,
    })}</script><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="same-origin"><link rel="icon" href="https://cdn.onesrc.cn/uploads/images/onepoint_30.png"><title>Just One Point</title><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/static/css/app.820c0513.css" rel="preload" as="style"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/static/css/chunk-elementUI.6e808e7d.css" rel="preload" as="style"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/static/css/chunk-libs.1fd47c5d.css" rel="preload" as="style"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/static/js/app.1397f3a6.js" rel="preload" as="script"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/static/js/chunk-elementUI.46046ffc.js" rel="preload" as="script"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/static/js/chunk-libs.e78b2083.js" rel="preload" as="script"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/static/css/chunk-elementUI.6e808e7d.css" rel="stylesheet"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/static/css/chunk-libs.1fd47c5d.css" rel="stylesheet"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/static/css/app.820c0513.css" rel="stylesheet"></head><body><noscript><strong>We're sorry but this app doesn't work properly without JavaScript enabled. Please enable it to continue.</strong></noscript><div id="app"></div><script>(function(e){function t(t){for(var n,i,l=t[0],p=t[1],a=t[2],c=0,s=[];c<l.length;c++)i=l[c],Object.prototype.hasOwnProperty.call(o,i)&&o[i]&&s.push(o[i][0]),o[i]=0;for(n in p)Object.prototype.hasOwnProperty.call(p,n)&&(e[n]=p[n]);f&&f(t);while(s.length)s.shift()();return u.push.apply(u,a||[]),r()}function r(){for(var e,t=0;t<u.length;t++){for(var r=u[t],n=!0,l=1;l<r.length;l++){var p=r[l];0!==o[p]&&(n=!1)}n&&(u.splice(t--,1),e=i(i.s=r[0]))}return e}var n={},o={runtime:0},u=[];function i(t){if(n[t])return n[t].exports;var r=n[t]={i:t,l:!1,exports:{}};return e[t].call(r.exports,r,r.exports,i),r.l=!0,r.exports}i.m=e,i.c=n,i.d=function(e,t,r){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},i.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(i.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)i.d(r,n,function(t){return e[t]}.bind(null,n));return r},i.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/";var l=window["webpackJsonp"]=window["webpackJsonp"]||[],p=l.push.bind(l);l.push=t,l=l.slice();for(var a=0;a<l.length;a++)t(l[a]);var f=p;r()})([]);</script><script src="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/static/js/chunk-elementUI.46046ffc.js"></script><script src="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/static/js/chunk-libs.e78b2083.js"></script><script src="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210503/dist/static/js/app.1397f3a6.js"></script></body></html>`;
};

module.exports = config;
