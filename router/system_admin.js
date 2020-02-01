const { Msg, formatDate } = require('../utils/msgutils');
const { cookie } = require('../utils/nodeutils');
const fs = require('fs');
const path = require('path');
let G_CONFIG, DRIVE_MAP, oneCache;


//@flag 比较凌乱,以后再修改

exports.func = async (spConfig, cache, event) => {
    let p2 = event.splitPath.p2;
    G_CONFIG = spConfig['G_CONFIG'];
    DRIVE_MAP = spConfig['DRIVE_MAP'];
    oneCache = spConfig['oneCache'];
    let res_headers = { 'Content-Type': 'text/html' };
    if (event['method'] === 'POST') {//管理员登录 ,只允许密码
        console.log("admin password:" + event['body']['password']);
        if (event['body']['password'] !== G_CONFIG.admin_password) return Msg.info(401, '管理员密码错误');
        res_headers['set-cookie'] = cookie.serialize('ADMINTOKEN', G_CONFIG.admin_password_date_hash, { path: event.splitPath.p0 + '/', maxAge: 3600 });
    } else if (!event.isadmin) {
        return Msg.info(401, '请输入管理员密码');
    }
    if (p2 === '/cache') {
        if (event.query['raw'] !== undefined) return Msg.html(200, JSON.stringify(oneCache), { 'Content-Type': 'application/json' });
        else if (event.query['export'] !== undefined) return Msg.html(200, JSON.stringify(oneCache.exportDataArr()), { 'Content-Type': 'application/json' });
        else return Msg.html(200, fs.readFileSync(path.resolve(__dirname, '../html/admin/cache.html'), 'utf-8'), res_headers);
    } else if (p2 === '/event') {
        return Msg.html(200, jsonPage(event), res_headers);
    } else if (p2 === '/files') {
        return Msg.html(200, fs.readFileSync(path.resolve(__dirname, '../html/admin/file2.html'), 'utf-8'), res_headers);
    } else if (p2.startsWith('/logs')) {
        let type = Number(p2.slice(5)) || 0;
        return Msg.html(200, jsonPage(oneCache.eventlog[type]), res_headers);
    } else if (p2 === '/logout') {
        res_headers['set-cookie'] = cookie.serialize('ADMINTOKEN', '0', { path: event.splitPath.p0 + '/', maxAge: 3600 });
        res_headers['location'] = event.splitPath.p0 + '/';
        return Msg.html(301, "logout", res_headers);
    } else if (p2 === '/setting') return Msg.html(200, settingPage(), res_headers);
    return Msg.html(200, mainPage(), res_headers);
}

function jsonPage(json) {
    return `<head><script src="https://cdn.bootcss.com/highlight.js/9.15.10/highlight.min.js"></script>
    <link href="//cdn.bootcss.com/highlight.js/9.10.0/styles/xcode.min.css" rel="stylesheet"></head>
    <body style="font-size: 15px;"><pre><code>${JSON.stringify(json, null, 2)}</code></pre><script>hljs.highlightBlock(document.body);</script></body>`;
}

function mainPage() {
    return `<!doctype html>
    <html lang="zh-CN">
    
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <link type="text/css" rel="stylesheet" href="https://unpkg.com/bootstrap/dist/css/bootstrap.min.css" />
    </head>
    
    <body>
        <nav class="navbar sticky-top navbar-dark bg-dark navbar-expand-lg">
            <div class="container"><a target="_self" href="#" class="navbar-brand"><img
                        src="https://i.loli.net/2020/01/31/H4BJUywjxf5GoZO.png" alt="logo" crossorigin="anonymous"
                        class="d-inline-block align-top">
                    ONEPOINT
                </a>
                <div id="nav-collapse" class="navbar-collapse collapse" style="display: none;">
                    <ul class="navbar-nav">
                        <li class="nav-item"><a target="_self" href="../" class="nav-link">Home</a></li>
                        <li class="nav-item"><a target="_self" href="files" class="nav-link">Files</a></li>
                        <li class="nav-item"><a target="_self" href="setting" class="nav-link">Setting</a></li>
                        <li class="nav-item"><a target="_self" href="cache" class="nav-link">Cache</a></li>
                        <li class="nav-item"><a target="_self" href="./" class="nav-link active">Dashboard</a></li>
                    </ul>
                </div>
            </div>
        </nav>
        <div class="container">
            <div class="card mt-3">
                <div class="card-header">
                    Featured
                </div>
                <div class="card-body row">
                    <div class="col-6"
                        style="display: flex;justify-content: center;flex-direction: column;align-items: center;">
                        <h5 class="card-title">createTime: ${formatDate(oneCache.createTime)}</h5>
                        <h5 class="card-title">initTime: ${formatDate(oneCache.initTime)}</h5>
                    </div>
                    <div class="list-group col-6">
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            normal
                            <span class="badge badge-primary badge-pill">${oneCache.eventlog[0].length}</span></div>
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            api
                            <span class="badge badge-primary badge-pill">${oneCache.eventlog[1].length}</span></div>
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            admin
                            <span class="badge badge-primary badge-pill">${oneCache.eventlog[3].length}</span></div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    
    </html>
    `
}

function settingPage() {
    return `<!doctype html>
    <html lang="zh-CN">
    
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <link type="text/css" rel="stylesheet" href="https://unpkg.com/bootstrap/dist/css/bootstrap.min.css" />
    </head>
    
    <body>
        <nav class="navbar sticky-top navbar-dark bg-dark navbar-expand-lg">
            <div class="container"><a target="_self" href="#" class="navbar-brand"><img
                        src="https://i.loli.net/2020/01/31/H4BJUywjxf5GoZO.png" alt="logo" crossorigin="anonymous"
                        class="d-inline-block align-top">
                    ONEPOINT
                </a>
                <div id="nav-collapse" class="navbar-collapse collapse" style="display: none;">
                    <ul class="navbar-nav">
                        <li class="nav-item"><a target="_self" href="../" class="nav-link">Home</a></li>
                        <li class="nav-item"><a target="_self" href="files" class="nav-link">Files</a></li>
                        <li class="nav-item"><a target="_self" href="setting" class="nav-link active">Setting</a></li>
                        <li class="nav-item"><a target="_self" href="cache" class="nav-link">Cache</a></li>
                        <li class="nav-item"><a target="_self" href="./" class="nav-link">Dashboard</a></li>
                    </ul>
                </div>
            </div>
        </nav>
        <div class="container">
            <pre><code>${JSON.stringify(G_CONFIG, null, 2)}</code></pre>
            <pre><code>${JSON.stringify(DRIVE_MAP, null, 2)}</code></pre>
        </div>
    </body>
    
    </html>
    `
}