// 系统配置参数,运行时只读

const config = {
    SIGN_DELIMITER: '.',
    PAGE_SIZE: 200,

    ID_SIGN_LEN: 7,
    PAGE_SIGN_LEN: 7,

    CACHE_TIME_FILE: 15 * 60 * 1000,
    CACHE_TIME_LIST: 30 * 60 * 1000,

    AC_PASS_FILE: '.password=',

    PATH_ADMIN: '/admin/',
    PATH_API: '/api/',
    PATH_CONFIG: '/api/sys/config',
    PATH_DOWN: '/down:',
    ADMIN_TOKEN_SALT: 'admin-token',
    LOAD_ART_TEMPLATE: true,

    THEMES: ['w.w.art', 'simple.art'],
    MODULES: ['node_fs', 'onedrive', 'coding', 'teambition', 'googledrive'],
    themes: {},
    modules: {},
};

const configTemplate = {
    html: '<div>如果你看到此项，说明部署成功。请前往 <a href="/admin/">/admin/<a>页面先修改此项，看看是否可以保存。如果可以，请再添加云盘 并配置相关参数</div>',
    logo: 'https://www.bilibili.com/favicon.ico',
    name: 'DemoSite',
    readme: '## Demo\n\n This is a demo\n\n< Just > a demo < /Just >',
    cors: [],
    proxy: [],
    theme: 'w.w',
};
config.configTemplate = configTemplate;

const {_P} = require('../utils/node');

const commonSParams = [
    _P('theme', '', '', 8, config.THEMES, false, false),
    _P('logo', '', '', 6, 'consume your own logo', false, false),
    _P('name', '', '', 6, 'consume your site name', false, false),
    _P('html', '', '', 6, 'embed html code', true, false),
    _P('readme', '', '', 6, 'markdown supported', true, false),
    _P('proxy', [], 'proxy for download', 4, '', false, false),
    _P('cors', [], 'Allow CORS', 4, '', false, false),
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
    _P('desc', '', '', 2, 'short desc', false, false),
    _P('hidden', [], '', 2, '', false, false)
];
config.commonMParams = commonMParams;

config.getAdminHtml = function (baseURL) {
    return `<!DOCTYPE html><html lang="en"><head><script>window.opConfig=${JSON.stringify({
        baseURL,
        PATH_ADMIN: config.PATH_ADMIN,
        PATH_API: config.PATH_API,
    })}</script><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="https://cdn.onesrc.cn/uploads/images/onepoint_30.png"><title>onepoint-vue</title><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/static/css/app.dbeb02b4.css" rel="preload" as="style"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/static/css/chunk-elementUI.6e808e7d.css" rel="preload" as="style"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/static/css/chunk-libs.902ebb66.css" rel="preload" as="style"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/static/js/app.e86b1a30.js" rel="preload" as="script"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/static/js/chunk-elementUI.f4609c7b.js" rel="preload" as="script"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/static/js/chunk-libs.bd8f42e8.js" rel="preload" as="script"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/static/css/chunk-elementUI.6e808e7d.css" rel="stylesheet"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/static/css/chunk-libs.902ebb66.css" rel="stylesheet"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/static/css/app.dbeb02b4.css" rel="stylesheet"></head><body><noscript><strong>We're sorry but this app doesn't work properly without JavaScript enabled. Please enable it to continue.</strong></noscript><div id="app"></div><script>(function(e){function t(t){for(var r,c,a=t[0],f=t[1],i=t[2],d=0,l=[];d<a.length;d++)c=a[d],Object.prototype.hasOwnProperty.call(o,c)&&o[c]&&l.push(o[c][0]),o[c]=0;for(r in f)Object.prototype.hasOwnProperty.call(f,r)&&(e[r]=f[r]);s&&s(t);while(l.length)l.shift()();return u.push.apply(u,i||[]),n()}function n(){for(var e,t=0;t<u.length;t++){for(var n=u[t],r=!0,c=1;c<n.length;c++){var a=n[c];0!==o[a]&&(r=!1)}r&&(u.splice(t--,1),e=f(f.s=n[0]))}return e}var r={},c={runtime:0},o={runtime:0},u=[];function a(e){return f.p+"static/js/"+({}[e]||e)+"."+{"chunk-0ce8e18e":"d74a2c08","chunk-d230459c":"517436c9","chunk-16dc62c0":"2159ff7c","chunk-2d20f3b2":"f3d3cfce","chunk-2d217a0e":"716d90f5","chunk-2d230fe7":"3a84ee99","chunk-5ceaa0fc":"b34ea691","chunk-2d0f1194":"b35a2d69","chunk-789dc562":"d5684286","chunk-e64bfb8a":"56c1b435"}[e]+".js"}function f(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,f),n.l=!0,n.exports}f.e=function(e){var t=[],n={"chunk-d230459c":1,"chunk-16dc62c0":1};c[e]?t.push(c[e]):0!==c[e]&&n[e]&&t.push(c[e]=new Promise((function(t,n){for(var r="static/css/"+({}[e]||e)+"."+{"chunk-0ce8e18e":"31d6cfe0","chunk-d230459c":"5d1355f7","chunk-16dc62c0":"2865268a","chunk-2d20f3b2":"31d6cfe0","chunk-2d217a0e":"31d6cfe0","chunk-2d230fe7":"31d6cfe0","chunk-5ceaa0fc":"31d6cfe0","chunk-2d0f1194":"31d6cfe0","chunk-789dc562":"31d6cfe0","chunk-e64bfb8a":"31d6cfe0"}[e]+".css",o=f.p+r,u=document.getElementsByTagName("link"),a=0;a<u.length;a++){var i=u[a],d=i.getAttribute("data-href")||i.getAttribute("href");if("stylesheet"===i.rel&&(d===r||d===o))return t()}var l=document.getElementsByTagName("style");for(a=0;a<l.length;a++){i=l[a],d=i.getAttribute("data-href");if(d===r||d===o)return t()}var s=document.createElement("link");s.rel="stylesheet",s.type="text/css",s.onload=t,s.onerror=function(t){var r=t&&t.target&&t.target.src||o,u=new Error("Loading CSS chunk "+e+" failed.\\n("+r+")");u.code="CSS_CHUNK_LOAD_FAILED",u.request=r,delete c[e],s.parentNode.removeChild(s),n(u)},s.href=o;var h=document.getElementsByTagName("head")[0];h.appendChild(s)})).then((function(){c[e]=0})));var r=o[e];if(0!==r)if(r)t.push(r[2]);else{var u=new Promise((function(t,n){r=o[e]=[t,n]}));t.push(r[2]=u);var i,d=document.createElement("script");d.charset="utf-8",d.timeout=120,f.nc&&d.setAttribute("nonce",f.nc),d.src=a(e);var l=new Error;i=function(t){d.onerror=d.onload=null,clearTimeout(s);var n=o[e];if(0!==n){if(n){var r=t&&("load"===t.type?"missing":t.type),c=t&&t.target&&t.target.src;l.message="Loading chunk "+e+" failed.\\n("+r+": "+c+")",l.name="ChunkLoadError",l.type=r,l.request=c,n[1](l)}o[e]=void 0}};var s=setTimeout((function(){i({type:"timeout",target:d})}),12e4);d.onerror=d.onload=i,document.head.appendChild(d)}return Promise.all(t)},f.m=e,f.c=r,f.d=function(e,t,n){f.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},f.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},f.t=function(e,t){if(1&t&&(e=f(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(f.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)f.d(n,r,function(t){return e[t]}.bind(null,r));return n},f.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return f.d(t,"a",t),t},f.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},f.p="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/",f.oe=function(e){throw console.error(e),e};var i=window["webpackJsonp"]=window["webpackJsonp"]||[],d=i.push.bind(i);i.push=t,i=i.slice();for(var l=0;l<i.length;l++)t(i[l]);var s=d;n()})([]);</script><script src="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/static/js/chunk-elementUI.f4609c7b.js"></script><script src="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/static/js/chunk-libs.bd8f42e8.js"></script><script src="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210127/dist/static/js/app.e86b1a30.js"></script></body></html>`;
};

module.exports = config;
