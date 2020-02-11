const { Msg } = require('../utils/msgutils');
const { cookie } = require('../utils/nodeutils');
const fs = require('fs');
const path = require('path');
let G_CONFIG, DRIVE_MAP, oneCache;
let _event;
const ajax_funcs = [];

//@flag 比较凌乱,以后再修改

exports.func = async (spConfig, cache, event) => {
    let p2 = event.p2;
    G_CONFIG = spConfig['G_CONFIG'];
    DRIVE_MAP = spConfig['DRIVE_MAP'];
    oneCache = spConfig['oneCache'];
    _event = event;

    let res_headers = { 'Content-Type': 'text/html' };
    //if (event.query.sp !== undefined) return Msg.html_json(200, oneCache.root_sp);
    if (event['method'] === 'POST') {//管理员登录 ,只允许密码
        console.log("admin password:" + event['body']['adminpass']);
        if (event['body']['adminpass'] !== G_CONFIG.admin_password) return Msg.info(401, 'adminpass:管理员密码错误');
        res_headers['set-cookie'] = cookie.serialize('ADMINTOKEN', G_CONFIG.admin_password_date_hash, { path: event.splitPath.p0 + '/', maxAge: 3600 });
    } else if (!event.isadmin) {
        return Msg.info(401, 'adminpass:请输入管理员密码');
    }

    if (p2 === '/logout') {
        res_headers['set-cookie'] = cookie.serialize('ADMINTOKEN', '0', { path: event.splitPath.p0 + '/', maxAge: 3600 });
        res_headers['location'] = event.splitPath.p0 + '/';
        return Msg.html(301, "logout", res_headers);
    }

    if (t = /\/ajax\/([^/]+)/.exec(p2)) return ajax_funcs[t[1]]();

    if (p2 === '/') p2 = '/dashboard';

    if (t = /\/([^/]+)/.exec(p2)) return getHtmlFromFs(t[1]);

    return Msg.html(200, '>_<', res_headers);

    function getHtmlFromFs(name) {
        if (name === 'files') name = 'file2';
        else if (name === 'dashboard') name = 'main';
        return Msg.html(200, fs.readFileSync(path.resolve(__dirname, `../html/admin/${name}.html`), 'utf-8'),res_headers);
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