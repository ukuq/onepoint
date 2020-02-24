const { Msg } = require('../utils/msgutils');
const { cookie } = require('../utils/nodeutils');
const fs = require('fs');
const path = require('path');
let G_CONFIG, DRIVE_MAP, oneCache, onepoint;
let _event;
const ajax_funcs = [];

//@flag 比较凌乱,以后再修改

//ajax 登录时需要同时提供账号,原有的401只需要输入密码,考虑兼容性问题暂不移除(以后会去除,只支持ajax) @flag @flag @flag
exports.func = async (spConfig, cache, event) => {
    let p2 = event.p2;
    if(p2=='/')return Msg.html(200,vue_html);
    G_CONFIG = spConfig['G_CONFIG'];
    DRIVE_MAP = spConfig['DRIVE_MAP'];
    oneCache = spConfig['oneCache'];
    onepoint = spConfig['onepoint'];
    _event = event;
    if (p2 === '/event') return Msg.html_json(200, event);
    let res_headers = { 'Content-Type': 'text/html' };
    if (!event.isadmin && p2 !== '/ajax/login') {
        if (p2 !== '/login') return Msg.html(302, '401', { 'location': event.splitPath.p0 + '/admin/login' });
        if (event['method'] === 'POST' && event['body']['adminpass']) {//管理员登录 ,只允许密码
            console.log("admin password:" + event['body']['adminpass']);
            if (event['body']['adminpass'] !== G_CONFIG.admin_password) return Msg.info(401, 'adminpass:管理员密码错误');
            res_headers['set-cookie'] = cookie.serialize('ADMINTOKEN', G_CONFIG.admin_password_date_hash, { path: event.splitPath.p0 + '/', maxAge: 3600, sameSite: 'none' });
            res_headers['location'] = event.splitPath.p0 + '/admin/';
            return Msg.html(302, 'success', res_headers);
        } else return Msg.info(401, 'adminpass:请输入管理员密码');
    }
    if (p2 === '/ajax/login') {
        event.noRender = true;
        if (event.isadmin || event['method'] === 'POST' && event['body']['password'] === G_CONFIG.admin_password && event['body']['username'] === G_CONFIG.admin_username)
            return Msg.info(200, "success", { 'set-cookie': cookie.serialize('ADMINTOKEN', G_CONFIG.admin_password_date_hash, { path: event.splitPath.p0 + '/',sameSite: 'none'}) });
        else return Msg.info(403, "账号或密码错误");
    }
    if (p2 === '/logout') {
        res_headers['set-cookie'] = cookie.serialize('ADMINTOKEN', '0', { path: event.splitPath.p0 + '/', maxAge: 3600 });
        res_headers['location'] = event.splitPath.p0 + '/';
        return Msg.html(302, "logout", res_headers);
    }
    //if (event.query.sp !== undefined) return Msg.html_json(200, oneCache.root_sp);
    if (t = /\/ajax\/([^/]+)/.exec(p2)) {
        event.noRender = true;
        return ajax_funcs[t[1]]();
    }

    if (t = /\/([^/]+)/.exec(p2)) return getHtmlFromFs(t[1]);

    return Msg.html(200, '>_<', res_headers);

    function getHtmlFromFs(name) {
        name = name.charAt(0);
        return Msg.html(200, fs.readFileSync(path.resolve(__dirname, `../html/admin/admin_${name}.html`), 'utf-8'), res_headers);
    }
}

ajax_funcs['dashboard'] = () => {
    let drivesInfos = [];
    for (let i in DRIVE_MAP) {
        drivesInfos.push({
            path: i,
            funcName: DRIVE_MAP[i]['funcName'],
            password: DRIVE_MAP[i]['password']
        });
    }
    return Msg.html_json(200, {
        runInfo: {
            createTime: oneCache.createTime,
            initTime: oneCache.initTime,
            normal: oneCache.eventlog[0].length,
            api: oneCache.eventlog[1].length,
            admin: oneCache.eventlog[3].length
        },
        drivesInfos: drivesInfos
    });
}

//@flag 此处需要隐去密码相关信息
ajax_funcs['setting'] = () => {
    return Msg.html_json(200, {
        G_CONFIG, DRIVE_MAP
    });
}

ajax_funcs['cache'] = () => {
    let cache = _event.query.raw === undefined ? oneCache.exportDataArr() : oneCache;
    return Msg.html_json(200, cache);
}

ajax_funcs['event'] = () => {
    return Msg.html_json(200, _event);
}

ajax_funcs['logs'] = () => {
    return Msg.html_json(200, oneCache.eventlog[Number(_event.query.type) || 0]);
}

ajax_funcs['save'] = async () => {
    onepoint.updateConfig(_event.body);//body is a object
    let f = onepoint.adapter_funcs.writeConfig;
    if (f) {
        await f(onepoint.config);
        return Msg.info(200, '保存成功');
    } else return Msg.info(200, '不支持保存操作,但已写入系统');
}

const vue_html =`
<!DOCTYPE html>
<html lang=en>

<head>
    <meta charset=utf-8>
    <meta http-equiv=X-UA-Compatible content="IE=edge">
    <meta name=viewport content="width=device-width,initial-scale=1">
    <link rel=icon href=https://cdn.onesrc.cn/uploads/images/onepoint_30.png> <title>vue1</title>
    <link href=https://cdn.jsdelivr.net/gh/ukuq/point-vue@200224-5/dist/css/app.16834194.css rel=preload as=style>
    <link href=https://cdn.jsdelivr.net/gh/ukuq/point-vue@200224-5/dist/css/chunk-vendors.2207af0d.css rel=preload as=style>
    <link href=https://cdn.jsdelivr.net/gh/ukuq/point-vue@200224-5/dist/js/app.7fe68977.js rel=preload as=script>
    <link href=https://cdn.jsdelivr.net/gh/ukuq/point-vue@200224-5/dist/js/chunk-vendors.d50fc110.js rel=preload as=script>
    <link href=https://cdn.jsdelivr.net/gh/ukuq/point-vue@200224-5/dist/css/chunk-vendors.2207af0d.css rel=stylesheet>
    <link href=https://cdn.jsdelivr.net/gh/ukuq/point-vue@200224-5/dist/css/app.16834194.css rel=stylesheet>
</head>

<body><noscript><strong>We're sorry but vue1 doesn't work properly without JavaScript enabled. Please enable it to
            continue.</strong></noscript>
    <div id=app></div>
    <script src=https://cdn.jsdelivr.net/gh/ukuq/point-vue@200224-5/dist/js/chunk-vendors.d50fc110.js> </script> <script src=https://cdn.jsdelivr.net/gh/ukuq/point-vue@200224-5/dist/js/app.7fe68977.js> </script> </body> </html>`