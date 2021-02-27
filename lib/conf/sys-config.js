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
    html: '<div>这是一段自定义html，你也可以在这里放置一些脚本文件</div>',
    logo: 'https://www.bilibili.com/favicon.ico',
    name: 'DemoSite',
    readme: `## 部署成功

看到此选项说明你已经成功安装了OnePoint

接下来你要做的就是修改配置了！

修改地址：[管理页面](/admin/)

默认账号：admin

默认密码：admin

### 基础配置

为了保证能够正确读写配置同时为了安全性，建议修改此项、修改账号密码，然后再保存

如果保存成功再进行下一步，否则就可能是OnePoint出了问题

### 云盘配置

测试读写无误后，请添加云盘`,
    cors: ['*'],
    proxy: [],
    theme: config.THEMES[0],
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

config.getAdminHtml = function (baseURL) {
    return `<!DOCTYPE html><html lang="en"><head><script>window.opConfig=${JSON.stringify({
        baseURL,
        PATH_ADMIN: config.PATH_ADMIN,
        PATH_API: config.PATH_API,
    })}</script><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="https://cdn.onesrc.cn/uploads/images/onepoint_30.png"><title>onepoint-vue</title><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/static/css/app.7d79bc9c.css" rel="preload" as="style"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/static/css/chunk-elementUI.6e808e7d.css" rel="preload" as="style"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/static/css/chunk-libs.902ebb66.css" rel="preload" as="style"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/static/js/app.2a977b27.js" rel="preload" as="script"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/static/js/chunk-elementUI.f4609c7b.js" rel="preload" as="script"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/static/js/chunk-libs.82066325.js" rel="preload" as="script"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/static/css/chunk-elementUI.6e808e7d.css" rel="stylesheet"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/static/css/chunk-libs.902ebb66.css" rel="stylesheet"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/static/css/app.7d79bc9c.css" rel="stylesheet"></head><body><noscript><strong>We're sorry but this app doesn't work properly without JavaScript enabled. Please enable it to continue.</strong></noscript><div id="app"></div><script>(function(e){function t(t){for(var r,c,a=t[0],f=t[1],i=t[2],d=0,l=[];d<a.length;d++)c=a[d],Object.prototype.hasOwnProperty.call(o,c)&&o[c]&&l.push(o[c][0]),o[c]=0;for(r in f)Object.prototype.hasOwnProperty.call(f,r)&&(e[r]=f[r]);s&&s(t);while(l.length)l.shift()();return u.push.apply(u,i||[]),n()}function n(){for(var e,t=0;t<u.length;t++){for(var n=u[t],r=!0,c=1;c<n.length;c++){var a=n[c];0!==o[a]&&(r=!1)}r&&(u.splice(t--,1),e=f(f.s=n[0]))}return e}var r={},c={runtime:0},o={runtime:0},u=[];function a(e){return f.p+"static/js/"+({}[e]||e)+"."+{"chunk-16dc62c0":"ce33ee0e","chunk-2d20f3b2":"b7d30a50","chunk-2d217a0e":"7527d65d","chunk-2d230fe7":"3a84ee99","chunk-659ffd48":"78e3cc29","chunk-8f126b80":"725be589","chunk-67d75bbc":"28e07854","chunk-2d0f1194":"e61f934c","chunk-e64bfb8a":"a15689d0","chunk-f762f54c":"2b0008c0"}[e]+".js"}function f(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,f),n.l=!0,n.exports}f.e=function(e){var t=[],n={"chunk-16dc62c0":1,"chunk-8f126b80":1};c[e]?t.push(c[e]):0!==c[e]&&n[e]&&t.push(c[e]=new Promise((function(t,n){for(var r="static/css/"+({}[e]||e)+"."+{"chunk-16dc62c0":"2865268a","chunk-2d20f3b2":"31d6cfe0","chunk-2d217a0e":"31d6cfe0","chunk-2d230fe7":"31d6cfe0","chunk-659ffd48":"31d6cfe0","chunk-8f126b80":"5d1355f7","chunk-67d75bbc":"31d6cfe0","chunk-2d0f1194":"31d6cfe0","chunk-e64bfb8a":"31d6cfe0","chunk-f762f54c":"31d6cfe0"}[e]+".css",o=f.p+r,u=document.getElementsByTagName("link"),a=0;a<u.length;a++){var i=u[a],d=i.getAttribute("data-href")||i.getAttribute("href");if("stylesheet"===i.rel&&(d===r||d===o))return t()}var l=document.getElementsByTagName("style");for(a=0;a<l.length;a++){i=l[a],d=i.getAttribute("data-href");if(d===r||d===o)return t()}var s=document.createElement("link");s.rel="stylesheet",s.type="text/css",s.onload=t,s.onerror=function(t){var r=t&&t.target&&t.target.src||o,u=new Error("Loading CSS chunk "+e+" failed.\\n("+r+")");u.code="CSS_CHUNK_LOAD_FAILED",u.request=r,delete c[e],s.parentNode.removeChild(s),n(u)},s.href=o;var h=document.getElementsByTagName("head")[0];h.appendChild(s)})).then((function(){c[e]=0})));var r=o[e];if(0!==r)if(r)t.push(r[2]);else{var u=new Promise((function(t,n){r=o[e]=[t,n]}));t.push(r[2]=u);var i,d=document.createElement("script");d.charset="utf-8",d.timeout=120,f.nc&&d.setAttribute("nonce",f.nc),d.src=a(e);var l=new Error;i=function(t){d.onerror=d.onload=null,clearTimeout(s);var n=o[e];if(0!==n){if(n){var r=t&&("load"===t.type?"missing":t.type),c=t&&t.target&&t.target.src;l.message="Loading chunk "+e+" failed.\\n("+r+": "+c+")",l.name="ChunkLoadError",l.type=r,l.request=c,n[1](l)}o[e]=void 0}};var s=setTimeout((function(){i({type:"timeout",target:d})}),12e4);d.onerror=d.onload=i,document.head.appendChild(d)}return Promise.all(t)},f.m=e,f.c=r,f.d=function(e,t,n){f.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},f.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},f.t=function(e,t){if(1&t&&(e=f(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(f.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)f.d(n,r,function(t){return e[t]}.bind(null,r));return n},f.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return f.d(t,"a",t),t},f.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},f.p="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/",f.oe=function(e){throw console.error(e),e};var i=window["webpackJsonp"]=window["webpackJsonp"]||[],d=i.push.bind(i);i.push=t,i=i.slice();for(var l=0;l<i.length;l++)t(i[l]);var s=d;n()})([]);</script><script src="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/static/js/chunk-elementUI.f4609c7b.js"></script><script src="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/static/js/chunk-libs.82066325.js"></script><script src="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v210219/dist/static/js/app.2a977b27.js"></script></body></html>`;
};

module.exports = config;
