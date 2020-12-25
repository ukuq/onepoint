// 系统配置参数,运行时只读

const config = {
    PAGE_PREFIX: '$',
    PAGE_SIZE: 5,
    PATH_ADMIN: '/admin/',
    PATH_API: '/api/',
    PATH_CONFIG: '/api/sys/config',
    PATH_DOWN: '/down:',
    ADMIN_TOKEN_SALT: 'admin-token',
    LOAD_ART_TEMPLATE: true,
    themes: {
        'w.w': '.art',
        simple: '.art',
    },
    modules: {
        node_fs: null,
        onedrive: null,
    },
};

const configTemplate = {
    admin_password: 'admin',
    admin_username: 'admin',
    theme: 'w.w',
    drive_map: {},
    site_logo: 'https://www.bilibili.com/favicon.ico',
    site_name: 'DemoSite',
    site_html: '<p>Nothing,This is a html</p>',
    site_mark: '## Demo\n\n This is a demo\n\n< Just > a demo < /Just >',
    site_proxy: [],
    allow_origins: ['*'],
};
config.configTemplate = configTemplate;

const commonSParams = [
    { name: 'theme', desc: '', value: '', star: true, level: 8, select: Object.keys(config.themes) },
    { name: 'site_logo', desc: '', value: '', level: 6, placeholder: 'consume your own logo' },
    { name: 'site_name', desc: '', value: '', level: 6, placeholder: 'consume your site name' },
    { name: 'site_html', desc: '', value: '', level: 6, placeholder: 'embed html code', textarea: true },
    { name: 'site_mark', desc: '', value: '', level: 6, placeholder: 'markdown supported', textarea: true },
    { name: 'site_proxy', desc: 'proxy for download', value: [], level: 4, array: true },
    { name: 'allow_origins', desc: 'Allow CORS', value: [], level: 4, array: true },
];
commonSParams.forEach((e) => {
    e.value = configTemplate[e.name];
});
config.commonSParams = commonSParams;

const commonMParams = [
    { name: 'x_path', desc: '', value: '', star: true, level: 8, placeholder: 'mount path' },
    { name: 'x_pass', desc: '', value: '', level: 2, placeholder: 'drive password' },
    { name: 'x_mark', desc: '', value: '', level: 2, placeholder: 'markdown supported', textarea: true },
    { name: 'x_desc', desc: '', value: '', level: 2, placeholder: 'short desc' },
    { name: 'x_hidden', desc: '', value: [], level: 2, array: true },
];
config.commonMParams = commonMParams;

config.getAdminHtml = function (baseURL) {
    return `<!DOCTYPE html><html lang="en"><head><script>window.opConfig=${JSON.stringify({
        baseURL,
        PATH_ADMIN: config.PATH_ADMIN,
        PATH_API: config.PATH_API,
    })}</script><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/favicon.ico"><title>onepoint-vue</title><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/static/css/app.27450353.css" rel="preload" as="style"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/static/css/chunk-elementUI.6e808e7d.css" rel="preload" as="style"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/static/css/chunk-libs.902ebb66.css" rel="preload" as="style"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/static/js/app.2745db8e.js" rel="preload" as="script"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/static/js/chunk-elementUI.f4609c7b.js" rel="preload" as="script"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/static/js/chunk-libs.91b1a767.js" rel="preload" as="script"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/static/css/chunk-elementUI.6e808e7d.css" rel="stylesheet"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/static/css/chunk-libs.902ebb66.css" rel="stylesheet"><link href="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/static/css/app.27450353.css" rel="stylesheet"></head><body><noscript><strong>We're sorry but this app doesn't work properly without JavaScript enabled. Please enable it to continue.</strong></noscript><div id="app"></div><script>(function(e){function n(n){for(var r,c,a=n[0],f=n[1],d=n[2],i=0,h=[];i<a.length;i++)c=a[i],Object.prototype.hasOwnProperty.call(u,c)&&u[c]&&h.push(u[c][0]),u[c]=0;for(r in f)Object.prototype.hasOwnProperty.call(f,r)&&(e[r]=f[r]);l&&l(n);while(h.length)h.shift()();return o.push.apply(o,d||[]),t()}function t(){for(var e,n=0;n<o.length;n++){for(var t=o[n],r=!0,c=1;c<t.length;c++){var a=t[c];0!==u[a]&&(r=!1)}r&&(o.splice(n--,1),e=f(f.s=t[0]))}return e}var r={},c={runtime:0},u={runtime:0},o=[];function a(e){return f.p+"static/js/"+({}[e]||e)+"."+{"chunk-0590e80f":"9a3569cb","chunk-16dc62c0":"756f92a0","chunk-2cc43c4e":"2a31b6b8","chunk-2d217a0e":"716d90f5","chunk-2d230fe7":"3a84ee99","chunk-34b1a6f8":"8c42db9f","chunk-38d9e8d4":"894b87d3","chunk-472f217c":"f6967bb6","chunk-51315bef":"72afd0ef","chunk-5ceaa0fc":"b34ea691","chunk-2d0f1194":"b35a2d69","chunk-d9f54962":"da4bbe72","chunk-d230459c":"4cadd038"}[e]+".js"}function f(n){if(r[n])return r[n].exports;var t=r[n]={i:n,l:!1,exports:{}};return e[n].call(t.exports,t,t.exports,f),t.l=!0,t.exports}f.e=function(e){var n=[],t={"chunk-16dc62c0":1,"chunk-2cc43c4e":1,"chunk-472f217c":1,"chunk-51315bef":1,"chunk-d230459c":1};c[e]?n.push(c[e]):0!==c[e]&&t[e]&&n.push(c[e]=new Promise((function(n,t){for(var r="static/css/"+({}[e]||e)+"."+{"chunk-0590e80f":"31d6cfe0","chunk-16dc62c0":"2865268a","chunk-2cc43c4e":"ff233fd5","chunk-2d217a0e":"31d6cfe0","chunk-2d230fe7":"31d6cfe0","chunk-34b1a6f8":"31d6cfe0","chunk-38d9e8d4":"31d6cfe0","chunk-472f217c":"ff233fd5","chunk-51315bef":"ff233fd5","chunk-5ceaa0fc":"31d6cfe0","chunk-2d0f1194":"31d6cfe0","chunk-d9f54962":"31d6cfe0","chunk-d230459c":"5d1355f7"}[e]+".css",u=f.p+r,o=document.getElementsByTagName("link"),a=0;a<o.length;a++){var d=o[a],i=d.getAttribute("data-href")||d.getAttribute("href");if("stylesheet"===d.rel&&(i===r||i===u))return n()}var h=document.getElementsByTagName("style");for(a=0;a<h.length;a++){d=h[a],i=d.getAttribute("data-href");if(i===r||i===u)return n()}var l=document.createElement("link");l.rel="stylesheet",l.type="text/css",l.onload=n,l.onerror=function(n){var r=n&&n.target&&n.target.src||u,o=new Error("Loading CSS chunk "+e+" failed.\\n("+r+")");o.code="CSS_CHUNK_LOAD_FAILED",o.request=r,delete c[e],l.parentNode.removeChild(l),t(o)},l.href=u;var s=document.getElementsByTagName("head")[0];s.appendChild(l)})).then((function(){c[e]=0})));var r=u[e];if(0!==r)if(r)n.push(r[2]);else{var o=new Promise((function(n,t){r=u[e]=[n,t]}));n.push(r[2]=o);var d,i=document.createElement("script");i.charset="utf-8",i.timeout=120,f.nc&&i.setAttribute("nonce",f.nc),i.src=a(e);var h=new Error;d=function(n){i.onerror=i.onload=null,clearTimeout(l);var t=u[e];if(0!==t){if(t){var r=n&&("load"===n.type?"missing":n.type),c=n&&n.target&&n.target.src;h.message="Loading chunk "+e+" failed.\\n("+r+": "+c+")",h.name="ChunkLoadError",h.type=r,h.request=c,t[1](h)}u[e]=void 0}};var l=setTimeout((function(){d({type:"timeout",target:i})}),12e4);i.onerror=i.onload=d,document.head.appendChild(i)}return Promise.all(n)},f.m=e,f.c=r,f.d=function(e,n,t){f.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:t})},f.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},f.t=function(e,n){if(1&n&&(e=f(e)),8&n)return e;if(4&n&&"object"===typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(f.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var r in e)f.d(t,r,function(n){return e[n]}.bind(null,r));return t},f.n=function(e){var n=e&&e.__esModule?function(){return e["default"]}:function(){return e};return f.d(n,"a",n),n},f.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},f.p="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/",f.oe=function(e){throw console.error(e),e};var d=window["webpackJsonp"]=window["webpackJsonp"]||[],i=d.push.bind(d);d.push=n,d=d.slice();for(var h=0;h<d.length;h++)n(d[h]);var l=i;t()})([]);</script><script src="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/static/js/chunk-elementUI.f4609c7b.js"></script><script src="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/static/js/chunk-libs.91b1a767.js"></script><script src="https://cdn.jsdelivr.net/gh/ukuq/onepoint-vue@v201217/dist/static/js/app.2745db8e.js"></script></body></html>`;
};

module.exports = config;
