'use strict';
const { Msg } = require('../utils/msgutils');
const { getmd5 } = require('../utils/nodeutils');
const { OneCache } = require('../utils/cacheutil');
const _url = require('url');
const _cookie = require('cookie');
const querystring = require('querystring');

const drive_funcs = {};//云盘模块
drive_funcs['linux_scf'] = require("../router/linux_scf");
drive_funcs['onedrive_graph'] = require("../router/onedrive_graph");
drive_funcs['onedrive_sharepoint'] = require("../router/onedrive_sharepoint");
drive_funcs['gdrive_goindex'] = require("../router/gdrive_goindex");
drive_funcs['system_admin'] = require("../router/system_admin");
drive_funcs['system_phony'] = require("../router/system_phony");

const render_funcs = {};//渲染模块
render_funcs['simple'] = require("../views/simple");
render_funcs['w.w'] = require("../views/w.w");

let G_CONFIG, DRIVE_MAP, DOMAIN_MAP;

let oneCache = new OneCache();//cache管理模块

/**
 * onepoint ukuq
 * time:20200123
 */


class OnePoint {//@info 暂时这样处理,对外接口不变
    initialize(config) {
        return initialize(config);
    }

    genEvent(method, url, headers, body, adapter, sourceIp, p0, query, cookie) {
        return genEvent(method, url, headers, body, adapter, sourceIp, p0, query, cookie);
    }

    async handleEvent(event) {
        return await handleEvent(event);
    }

    async handleRaw(method, url, headers, body, adapter, sourceIp, p0, query, cookie) {
        return await this.handleEvent(genEvent(method, url, headers, body, adapter, sourceIp, p0, query, cookie));
    }
}
exports.OnePoint = OnePoint;

function initialize(config_json) {
    G_CONFIG = config_json['G_CONFIG'];
    DRIVE_MAP = config_json['DRIVE_MAP'];
    DOMAIN_MAP = config_json['DOMAIN_MAP'] || {};
    console.log(DRIVE_MAP);
    refreshCache();
    console.log("initialize success");
}

/**
 * 清除所有cache, 为密码增加hash值,默认一天更新一次
 */
function refreshCache() {
    //设置管理员密码 hash 值
    let time = new Date();
    G_CONFIG.initTime = time;
    G_CONFIG.admin_password_date_hash = getmd5(G_CONFIG.admin_password + time.getUTCMonth() + time.getUTCDate());
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
    console.log('start_time:' + event.start_time.toLocaleString(), 'utf-8');
    if (event.start_time.getUTCDate() !== G_CONFIG.initTime.getUTCDate()) refreshCache();

    if (DOMAIN_MAP[event['sourceIp']]) {//eg: www.example.com/point
        let domain_path = DOMAIN_MAP[event['sourceIp']];
        event.splitPath.ph = domain_path.domain;
        event.splitPath.p0 = domain_path.path;
    }

    if (event['cookie']['ADMINTOKEN'] === G_CONFIG.admin_password_date_hash) event.isadmin = true;


    console.log(event);
    let { ph, p0, p_12 } = event['splitPath'];
    let p1, p2, driveInfo;
    let res_headers = { 'Content-Type': 'text/html' }, res_headers_json = { 'Content-Type': 'application/json' };
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
                G_CONFIG, DRIVE_MAP, DOMAIN_MAP, oneCache
            }
        };
        // p1 = '/admin';
        // p2 = p_12.slice(p1.length);
    } else if (p_12.startsWith('/tmp/')) {
        return endMsg(400, res_headers, "400: '/tmp/' is private");
    } else if (p_12.startsWith('/api/')) {
        oneCache.addEventLog(event, 1);
        event.noRender = true;
        if (p_12 === '/api/public/ls') {
            event.cmd = 'ls';
            event.spPage = event.query.spPage || 0;
            p_12 = event.query.path || '/';
            drivePath = oneCache.getDrivePath(p_12);
            driveInfo = DRIVE_MAP[drivePath];
        } else if (p_12 === '/api/cmd') {
            if (!event.isadmin) return endMsg(401, res_headers, "401: noly admin can use this api ");
            event.useApi = true;
            let cmdData = event.body.cmdData;
            event.cmd = event.body.cmdType;
            event.cmdData = event.body.cmdData;
            if (cmdData.path) {
                p_12 = cmdData.path;
                drivePath = oneCache.getDrivePath(p_12);
                event.spPage = cmdData.spPage || 0;
            } else if (cmdData.srcPath && cmdData.desPath) {
                p_12 = cmdData.srcPath;
                drivePath = oneCache.getDrivePath(p_12);
                if (oneCache.getDrivePath(cmdData.desPath) !== drivePath) return endMsg(400, res_headers_json, Msg.info(400, cmdData.srcPath + " and " + cmdData.desPath + " is not in the same drive"));
                event.p2_des = cmdData.desPath.slice(drivePath.length - 1);
            } else return endMsg(400, res_headers, "400: cmdData is invalid");
            driveInfo = DRIVE_MAP[drivePath];
        } else return endMsg(400, res_headers, "400: no such api");
    } else {
        oneCache.addEventLog(event, 0);
        event.cmd = 'ls';
        event.spPage = event.query.spPage || 0;
        drivePath = oneCache.getDrivePath(p_12);
        driveInfo = DRIVE_MAP[drivePath];
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
                res_headers['set-cookie'] = _cookie.serialize('DRIVETOKEN', driveInfo.password_date_hash, { path: encodeURI(p0 + p1), maxAge: 3600 });
            } else {
                responseMsg = Msg.info(401, 'drivepass:云盘token无效');
            }
        } else if (event['method'] === 'POST' && drivepass) {//使用密码 登录
            if (drivepass === driveInfo.password) {//单个云盘登录
                res_headers['set-cookie'] = _cookie.serialize('DRIVETOKEN', driveInfo.password_date_hash, { path: encodeURI(p0 + p1), maxAge: 3600 });
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

    if (!responseMsg && !event.useApi) responseMsg = oneCache.getMsg(p_12, event.spPage);
    if (!responseMsg || drivePath === '/admin/') {//管理员不使用cache
        try {
            responseMsg = await drive_funcs[driveInfo.funcName].func(driveInfo.spConfig, oneCache.driveCache[drivePath], event);
            if (event.cmd === 'ls') {
                responseMsg.spPage = event.spPage;
                oneCache.addMsg(p_12, responseMsg, event.spPage);
            } else if (event.cmd === 'find') responseMsg.parentPath = drivePath;
        } catch (error) {
            if (error.response) {
                if (error.response.error) responseMsg = Msg.error(error.response.status, error.response.error);
                else responseMsg = Msg.error(error.response.status, { message: error.message, headers: error.response.headers, data: error.response.data });
            }
            else responseMsg = Msg.error(500, { message: error.message, stack: error.stack });
            console.log(error.message);
            console.log(error.stack);
        }
    }

    //处理目录级密码
    if (responseMsg.type === 1 && !event.isadmin) {//文件列表 非管理员
        let pass;//目录级加密
        responseMsg.data.content = responseMsg.data.content.filter((e) => {
            if (e.name.startsWith('.password')) {
                pass = e.name.slice(10);
                return false;
            }
            return true;
        });
        if (pass) {
            let dirpass = event['body']['dirpass'];
            if (event['method'] === 'POST' && dirpass) {// post
                if (dirpass === pass) {
                    res_headers['set-cookie'] = _cookie.serialize('DIRTOKEN', getmd5(pass), { path: encodeURI(p0 + p1 + p2), maxAge: 3600 });
                } else {
                    responseMsg = Msg.info(401, 'dirpass:目录密码错误');
                }
            } else if (event['cookie']['DIRTOKEN']) {// cookie
                if (event['cookie']['DIRTOKEN'] !== getmd5(pass)) responseMsg = Msg.info(401, 'dirpass:目录cookie无效');
            } else responseMsg = Msg.info(401, 'dirpass:当前目录被加密');
        }

        let pageSize = 50;//分页功能
        if (responseMsg.type === 1 && responseMsg.spPage === 0 && !responseMsg.data.nextHrefToken && responseMsg.data.content.length > pageSize) {//@info 分页功能,兼容旧接口,只有云盘模块未提供href时启用
            let content_len = responseMsg.data.content.length;
            let page = 1;
            if (!isNaN(Number(event.query['page']))) page = Number(event.query['page']);
            responseMsg.data.content = responseMsg.data.content.slice((page - 1) * pageSize, page * pageSize);
            if (page > 1) responseMsg.data.prevHref = '?page=' + (page - 1);
            if (content_len > page * pageSize) responseMsg.data.nextHref = '?page=' + (page + 1);
        }
    }

    //处理直接 html返回
    if (responseMsg.type === 3) return endMsg(responseMsg.statusCode, responseMsg.headers, responseMsg.data.html);
    //处理api部分
    if (event.noRender) return endMsg(responseMsg.statusCode, res_headers_json, JSON.stringify(responseMsg.data));
    //处理文件下载
    if (responseMsg.type === 0 && event.query['preview'] === undefined) return endMsg(302, { 'Location': responseMsg.data.downloadUrl }, "302:" + responseMsg.data.downloadUrl);
    console.log(responseMsg);

    if (responseMsg.data.nextHrefToken) responseMsg.data.nextHref = '?spPage=' + responseMsg.data.nextHrefToken;
    let res_body = render_funcs[G_CONFIG.render_name].render(responseMsg, event, G_CONFIG);
    if (responseMsg.headers) for (let h in responseMsg.headers) res_headers[h] = responseMsg.headers[h];
    return endMsg(responseMsg.statusCode, res_headers, res_body);
};


function genEvent(method, url, headers, body, adapter, sourceIp = '0.0.0.0', p0 = '', query, cookie) {
    if (!body) body = {};
    else if (typeof body === 'string') {
        if (headers['content-type']) {
            if (headers['content-type'].startsWith('application/x-www-form-urlencoded')) {
                body = querystring.parse(body);
            } else if (headers['content-type'].startsWith('application/json')) {
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