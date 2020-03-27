'use strict';
const { Msg } = require('../utils/msgutils');
const { getmd5 } = require('../utils/nodeutils');
const { OneCache } = require('../utils/cacheutil');
const _url = require('url');
const _cookie = require('cookie');
const querystring = require('querystring');

const drive_funcs = {};//云盘模块
['linux_scf', 'onedrive_graph', 'onedrive_sharepoint', 'gdrive_goindex', 'system_admin', 'system_phony', 'system_webdav'].forEach((e) => {
    drive_funcs[e] = require(`../router/${e}`);
});
const render_funcs = {};//渲染模块,目前建议使用w.w
['w.w', 'simple', 'oneindex_like', 'xysk_like'].forEach((e) => {
    render_funcs[e] = require(`../views/${e}`);
});
let G_CONFIG, DRIVE_MAP, DOMAIN_MAP;

let oneCache = new OneCache();//cache管理模块

/**
 * onepoint ukuq
 * time:20200123
 */

class OnePoint {//@info 暂时这样处理,对外接口不变
    initialize(adapter_funcs) {
        this.adapter_funcs = adapter_funcs;
        console.log('running...');
    }

    genEvent(method, url, headers, body, adapter, sourceIp, p0, query, cookie) {
        return genEvent(method, url, headers, body, adapter, sourceIp, p0, query, cookie);
    }

    updateConfig(config) {
        this.config = config;
        initialize(config);
    }

    async handleEvent(event) {
        if (!this.config) this.updateConfig(await this.adapter_funcs.readConfig());
        return await handleEvent(event);
    }

    async handleRaw(method, url, headers, body, adapter, sourceIp, p0, query, cookie) {
        return await this.handleEvent(genEvent(method, url, headers, body, adapter, sourceIp, p0, query, cookie));
    }
}
var onepoint = new OnePoint();
exports.op = onepoint;
function initialize(config_json) {
    G_CONFIG = config_json['G_CONFIG'];
    DRIVE_MAP = config_json['DRIVE_MAP'];
    DOMAIN_MAP = config_json['DOMAIN_MAP'] || {};
    console.log(DRIVE_MAP);
    refreshCache();
    console.log("initialize success");
    //@info 此处用于兼容配置文件, 以后可能会剔除 @flag
    G_CONFIG.access_origins = G_CONFIG.access_origins || [];
    G_CONFIG.admin_username = G_CONFIG.admin_username || 'admin';
}

/**
 * 清除所有cache, 为密码增加hash值,默认一天更新一次
 */
function refreshCache() {
    //设置管理员密码 hash 值
    let time = new Date();
    G_CONFIG.initTime = time;
    G_CONFIG.admin_password_date_hash = getmd5(G_CONFIG.admin_password + time.getUTCMonth() + time.getUTCDate() + G_CONFIG.admin_username);
    oneCache.initDrives(Object.keys(DRIVE_MAP));
    for (let k in DRIVE_MAP) {
        oneCache.driveCache[k] = {};
        if (DRIVE_MAP[k].password) DRIVE_MAP[k].password_date_hash = getmd5(DRIVE_MAP[k].password + time.getUTCMonth() + time.getUTCDate());
    }
    console.log('cache is cleared');
}

/**
 * 返回, 一些清理工作可放这里
 * @param {*} statusCode 
 * @param {*} headers 
 * @param {*} body 
 * @param {*} isBase64Encoded 
 */
function endMsg(statusCode, headers, body, isBase64Encoded) {
    headers = Object.assign({ 'Content-Type': 'text/html' }, headers);
    let o = onepoint.event.headers.origin;
    if (o && G_CONFIG.access_origins.includes(o)) {
        if (onepoint.event.method === 'OPTIONS' && onepoint.event.headers['access-control-request-headers']) {
            statusCode = 204;
            headers = {
                'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '1728000'
            };
            body = "";
        }
        headers['Access-Control-Allow-Origin'] = o;
        headers['Access-Control-Allow-Credentials'] = true;
        onepoint.event['set_cookie'].forEach((e => {
            if (!e.o) return;
            e.o.sameSite = "none";
            e.o.secure = true;
        }));
    }
    headers['Set-Cookie'] = onepoint.event['set_cookie'].map((e => {
        return _cookie.serialize(e.n, e.v, e.o);
    }));
    console.log('end_time:' + new Date().toLocaleString(), 'utf-8');
    return {
        'isBase64Encoded': isBase64Encoded || false,
        'statusCode': statusCode,
        'headers': headers,
        'body': body
    }
}

/**
 * 这里不管辣么多了, 放权
 * event:{
 *  method
 *  headers
 *  body
 *  cookie
 *  query
 *  sourceIp
 *  splitPath:{
 *      ph,p0,p_12
 *  }
 * }
 */
async function handleEvent(event) {
    event['start_time'] = new Date();
    event['set_cookie'] = [];
    console.log('start_time:' + event.start_time.toLocaleString(), 'utf-8');

    onepoint.event = event;

    if (event.start_time.getUTCDate() !== G_CONFIG.initTime.getUTCDate()) refreshCache();

    if (DOMAIN_MAP[event['sourceIp']]) {//eg: www.example.com/point
        let domain_path = DOMAIN_MAP[event['sourceIp']];
        event.splitPath.ph = domain_path.ph;
        event.splitPath.p0 = domain_path.p0;
    }

    if (event['cookie']['ADMINTOKEN'] === G_CONFIG.admin_password_date_hash) event.isadmin = true;


    console.log(JSON.stringify(event));
    let { p0, p_12 } = event['splitPath'];
    let p1, p2, driveInfo;
    let responseMsg;
    let drivePath;
    console.info('p_12:' + p_12);

    //初始化 p_12 drivePath driveInfo 
    if (p_12.startsWith('/admin/')) {
        oneCache.addEventLog(event, 3);
        drivePath = '/admin/';
        driveInfo = {
            funcName: 'system_admin',
            spConfig: {
                G_CONFIG, DRIVE_MAP, DOMAIN_MAP, oneCache, onepoint
            }
        };
    } else if (p_12.startsWith('/tmp/')) {
        return endMsg(400, {}, "400: '/tmp/' is private");
    } else if (p_12.startsWith('/api/')) {
        oneCache.addEventLog(event, 1);
        event.noRender = true;
        if (p_12 === '/api/cmd') {
            if (!event.isadmin) return endMsg(401, {}, "401: noly admin can use this api ");
            let cmdData = event.body.cmdData;
            event.cmd = event.body.cmdType;
            event.cmdData = event.body.cmdData;
            if (cmdData.path) {
                p_12 = cmdData.path;
                drivePath = oneCache.getDrivePath(p_12);
                event.sp_page = cmdData.sp_page || 0;
            } else if (cmdData.srcPath && cmdData.desPath) {
                p_12 = cmdData.srcPath;
                drivePath = oneCache.getDrivePath(p_12);
                if (oneCache.getDrivePath(cmdData.desPath) !== drivePath) return endMsg(400, { 'Content-Type': 'application/json' }, Msg.info(400, cmdData.srcPath + " and " + cmdData.desPath + " is not in the same drive"));
                event.p2_des = cmdData.desPath.slice(drivePath.length - 1);
            } else return endMsg(400, {}, "400: cmdData is invalid");
            driveInfo = DRIVE_MAP[drivePath];
        } else return endMsg(400, {}, "400: no such api");
    } else {
        oneCache.addEventLog(event, 0);
        event.cmd = event.query.download === undefined ? 'ls' : 'download';
        event.sp_page = event.query.sp_page || 0;
        drivePath = oneCache.getDrivePath(p_12);
        driveInfo = DRIVE_MAP[drivePath];
        event.isNormal = true;
        event.noRender = event.query.json !== undefined;
    }
    p1 = drivePath.slice(0, -1);
    p2 = p_12.slice(p1.length);
    event.p2 = p2;
    console.log('drivePath:' + drivePath + ', p2:' + p2);

    //处理云盘级密码
    if (driveInfo.password && !event.isadmin) {//有密码 且 非管理员
        //允许 query 云盘hash登录
        let drivepass = event['body']['drivepass'];
        if (event['method'] === 'GET' && event['query']['token'] && event['query']['expiresdate']) {
            if (!isNaN(Number(event['query']['expiresdate'])) && (new Date(Number(event['query']['expiresdate'])) > new Date()) && (event['query']['token'] === getmd5(driveInfo.password + event['query']['expiresdate']))) {//利用分享的 password_date_hash 登录
                event['set_cookie'].push({ n: 'DRIVETOKEN', v: driveInfo.password_date_hash, o: { path: encodeURI(p0 + p1), maxAge: 3600 } });
            } else {
                responseMsg = Msg.info(401, 'drivepass:云盘token无效');
            }
        } else if (event['method'] === 'POST' && drivepass) {//使用密码 登录
            if (drivepass === driveInfo.password) {//单个云盘登录
                event['set_cookie'].push({ n: 'DRIVETOKEN', v: driveInfo.password_date_hash, o: { path: encodeURI(p0 + p1), maxAge: 3600 } });
            } else {//密码错误
                responseMsg = Msg.info(401, 'drivepass:云盘密码错误');
            }
            console.log('使用密码登录:' + drivepass);
        } else if (event['cookie']['DRIVETOKEN']) {//使用cookie
            if (event['cookie']['DRIVETOKEN'] !== driveInfo.password_date_hash) {
                responseMsg = Msg.info(401, 'drivepass:云盘cookie失效');
            }
            console.log('使用cookie登录:' + event['cookie']['DRIVETOKEN']);
        } else responseMsg = Msg.info(401, 'drivepass:请输入云盘密码');
    }

    if (!responseMsg && event.isNormal && event.cmd === 'ls') responseMsg = oneCache.getMsg(p_12, event.sp_page);
    if (!responseMsg) {//管理员不使用cache
        try {
            console.log('trying...');
            responseMsg = await drive_funcs[driveInfo.funcName].func(driveInfo.spConfig, oneCache.driveCache[drivePath], event);
            if (event.cmd === 'ls') {
                responseMsg.sp_page = event.sp_page;
                oneCache.addMsg(p_12, responseMsg, event.sp_page);
            }
        } catch (error) {
            //@info 这一部分看起来有点繁琐，但为了提取出一些有用的错误信息，还是很有必要的。
            let info = error.message;
            let errcode = 400;
            if (error.response) {
                if (error.response.data) {
                    if (error.response.data.error) info = error.response.data.error.message;
                    else info = error.response.data.message;
                    info = info || error.response.data.pipe ? error.message : JSON.stringify(error.response.data);
                }
                if (error.response.status === 404) { errcode = 404; info = '404:' + info; }
            }
            responseMsg = Msg.info(errcode, info);
            console.log(error);
        }
    }

    //处理目录级密码
    if (responseMsg.type === 1 && event.isNormal) {//文件列表 非管理员api
        let pass;//目录级加密
        if (!event.isadmin) {//管理员cookie忽略密码
            responseMsg.data.list = responseMsg.data.list.filter((e) => {
                if (e.name.startsWith('.password')) {
                    pass = e.name.slice(10);
                    return false;
                }
                return true;
            });
        }
        if (pass) {
            let dirpass = event['body']['dirpass'];
            if (event['method'] === 'POST' && dirpass) {// post
                if (dirpass === pass) {
                    event['set_cookie'].push({ n: 'DIRTOKEN', v: getmd5(pass), o: { path: encodeURI(p0 + p1 + p2), maxAge: 3600 } });
                } else {
                    responseMsg = Msg.info(401, 'dirpass:目录密码错误');
                }
            } else if (event['cookie']['DIRTOKEN']) {// cookie
                if (event['cookie']['DIRTOKEN'] !== getmd5(pass)) responseMsg = Msg.info(401, 'dirpass:目录cookie无效');
            } else responseMsg = Msg.info(401, 'dirpass:当前目录被加密');
        }

        let pageSize = 50;//分页功能
        if (responseMsg.type === 1 && event.sp_page === 0 && !responseMsg.data.nextToken && responseMsg.data.list.length > pageSize) {//@info 分页功能,兼容旧接口,只有云盘模块未提供href时启用
            let content_len = responseMsg.data.list.length;
            let page = 1;
            if (!isNaN(Number(event.query['page']))) page = Number(event.query['page']);
            responseMsg.data.list = responseMsg.data.list.slice((page - 1) * pageSize, page * pageSize);
            if (page > 1) responseMsg.data.prev = '?page=' + (page - 1);
            if (content_len > page * pageSize) responseMsg.data.next = '?page=' + (page + 1);
        }
    }
    if (responseMsg.data.nextToken) responseMsg.data.next = '?sp_page=' + responseMsg.data.nextToken;
    //处理直接 html返回
    if (responseMsg.type === 3) return endMsg(responseMsg.statusCode, responseMsg.headers, responseMsg.data.html);
    //处理cookie设置的代理,代理程序参考 https://www.onesrc.cn/p/using-cloudflare-to-write-a-download-assistant.html
    if (responseMsg.type === 0 && event.cookie.proxy) responseMsg.data.url = event.cookie.proxy + '?url=' + encodeURIComponent(responseMsg.data.url);
    //处理api部分
    if (event.noRender) return endMsg(responseMsg.statusCode, Object.assign({}, responseMsg.headers, { 'Content-Type': 'application/json' }), JSON.stringify(responseMsg.data));
    //处理文件下载
    if (responseMsg.type === 0 && event.query['preview'] === undefined) return endMsg(302, { 'Location': responseMsg.data.url }, "302:" + responseMsg.data.url);
    console.log(JSON.stringify(responseMsg));
    let res_body = render_funcs[G_CONFIG.render_name].render(responseMsg, event, G_CONFIG);
    return endMsg(responseMsg.statusCode, responseMsg.headers, res_body);
};


function genEvent(method, url, headers, body, adapter, sourceIp = '0.0.0.0', p0 = '', query, cookie) {
    if (!body) body = {};
    else if (typeof body === 'string') {
        if (headers['content-type']) {
            if (headers['content-type'].includes('application/x-www-form-urlencoded')) {
                body = querystring.parse(body);
            } else if (headers['content-type'].includes('application/json')) {
                body = JSON.parse(body);
            }
        }
    }
    let event = {
        method, url, headers, body, adapter, sourceIp,
        query: query || querystring.parse(_url.parse(url).query),
        cookie: cookie || (headers['cookie'] ? _cookie.parse(headers['cookie']) : {}),
        splitPath: {
            ph: '//' + headers.host,
            p0: p0,
            p_12: decodeURIComponent(_url.parse(url).pathname.slice(p0.length) || '/')
        }
    }
    return event;
}