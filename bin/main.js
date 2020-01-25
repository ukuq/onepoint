'use strict';
const { Msg } = require('../utils/msgutils');
const { cookie, getmd5 } = require('../utils/nodeutils');
const { OneCache } = require('../utils/cacheutil');

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
    async handleEvent(event) {
        return await handleEvent(event);
    }
}
exports.OnePoint = OnePoint;

function initialize(config_json) {
    G_CONFIG = config_json['G_CONFIG'];
    DRIVE_MAP = config_json['DRIVE_MAP'];
    DOMAIN_MAP = config_json['DOMAIN_MAP'];
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
    //初始化 drive 的 cache,密码hash值
    //清除 cache
    for (let k in DRIVE_MAP) {
        DRIVE_MAP[k].cache = {};
        if (DRIVE_MAP[k].password) {
            DRIVE_MAP[k].password_date_hash = getmd5(DRIVE_MAP[k].password + time.getUTCMonth() + time.getUTCDate());
        } else {
            DRIVE_MAP[k].password = '';
            DRIVE_MAP[k].password_date_hash = 'no_password';
        }
    }
    oneCache.initDrives(Object.keys(DRIVE_MAP));
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
    let res_html = "something wrong!", res_headers = { 'Content-Type': 'text/html' }, res_headers_json = { 'Content-Type': 'application/json' };
    let responseMsg = Msg.info(0);
    console.info('p_12:' + p_12);

    //初始化 p1 p2 driveInfo
    if (p_12.startsWith('/admin/')) {
        responseMsg.dpath = '/admin/';
        driveInfo = {
            funcName: 'system_admin',
            spConfig: {
                G_CONFIG, DRIVE_MAP, DOMAIN_MAP, oneCache
            }
        };
        p1 = '/admin';
        p2 = p_12.slice(p1.length);
    } else if (p_12.startsWith('/tmp/')) {
        return endMsg(400, res_headers, "400: '/tmp/' is private");
    } else if (p_12.startsWith('/api/')) {
        if (!event.isadmin) return endMsg(401, res_headers, "401: noly admin can use this api ");
        event.useApi = true;
        if (p_12 === '/api/cmd') {
            let cmdData = event.body.cmdData;
            event.cmd = event.body.cmdType;
            if (cmdData.path) {
                responseMsg = oneCache.getMsg(cmdData.path);
                event.body.path = cmdData.path.slice(responseMsg.dpath.length - 1);//@info 此处若请求不规范可能出现 ""
                event.body.name = cmdData.name;
                event.body.content = cmdData.content;
                p_12 = cmdData.path;
                p1 = responseMsg.dpath.slice(0, -1);
                p2 = event.body.path;
            } else if (cmdData.srcPath && cmdData.desPath) {
                responseMsg = oneCache.getMsg(cmdData.srcPath);
                if (oneCache.getMsg(cmdData.desPath).dpath !== responseMsg.dpath) return endMsg(400, res_headers_json, Msg.info(400, cmdData.srcPath + " and " + cmdData.desPath + " is not in the same drive"));
                event.body.srcPath = cmdData.srcPath.slice(responseMsg.dpath.length - 1);
                event.body.desPath = cmdData.desPath.slice(responseMsg.dpath.length - 1);
            } else return endMsg(400, res_headers, "400: cmdData is invalid");
            driveInfo = DRIVE_MAP[responseMsg.dpath];
        } else return endMsg(400, res_headers, "400: no such api");
    } else {
        event.cmd = 'ls';
        responseMsg = oneCache.getMsg(p_12);
        driveInfo = DRIVE_MAP[responseMsg.dpath];
        p1 = responseMsg.dpath.slice(0, -1);
        p2 = p_12.slice(p1.length);
    }
    console.log('dpath:' + responseMsg.dpath);

    event['splitPath']['p2'] = p2;//@info 遗留问题,以后可能改用 event.body.path
    if (!event.useApi) {
        //处理云盘级密码
        if (driveInfo.password && !event.isadmin) {//有密码 且 非管理员
            //允许 query 云盘hash登录
            if (event['method'] === 'GET' && event['query']['password']) {
                if (event['query']['password'] === driveInfo.password_date_hash) {//利用分享的 password_date_hash 登录
                    res_headers['set-cookie'] = cookie.serialize('DRIVETOKEN', driveInfo.password_date_hash, { path: p0 + p1, maxAge: 3600 });
                } else {
                    responseMsg = Msg.info(401, 'token错误');
                }
            } else if (event['method'] === 'POST' && event['body']['password']) {//使用密码 登录
                if (event['body']['password'] === driveInfo.password) {//单个云盘登录
                    res_headers['set-cookie'] = cookie.serialize('DRIVETOKEN', driveInfo.password_date_hash, { path: p0 + p1, maxAge: 3600 });
                } else {//密码错误
                    responseMsg = Msg.info(401, '密码错误');
                }
                console.log('使用密码登录:' + event['body']['password']);
            } else if (event['cookie']['DRIVETOKEN']) {//使用cookie
                if (event['cookie']['DRIVETOKEN'] !== driveInfo.password_date_hash) {
                    responseMsg = Msg.info(401, 'cookie失效,请重新登录');
                }
                console.log('使用cookie登录:' + event['cookie']['DRIVETOKEN']);
            } else responseMsg = Msg.info(401, '请输入密码');
        }
        event['splitPath']['p_h0'] = ph + p0;
        event['splitPath']['p_h01'] = ph + p0 + p1;
        event['splitPath']['p_h012'] = ph + p0 + p1 + p2;
    }

    if (responseMsg.statusCode === 0 || event.useApi) {//管理员不使用cache
        try {
            responseMsg = await drive_funcs[driveInfo.funcName].func(driveInfo.spConfig, driveInfo.cache, event);
            if (event.cmd === 'ls') oneCache.addMsg(p_12, responseMsg);
        } catch (error) {
            if (error.response) {
                if (error.response.error) responseMsg = Msg.error(error.response.status, error.response.error);
                else responseMsg = Msg.error(error.response.status, { message: error.message, headers: error.response.headers, data: error.response.data });
            }
            else responseMsg = Msg.info(500, error);
            console.log(error.message);
            console.log(error.stack);
        }
    }

    //处理api部分
    if (event.useApi) return endMsg(responseMsg.statusCode, res_headers_json, JSON.stringify(responseMsg));
    //处理文件下载
    if (responseMsg.type === 0 && event.query['preview'] === undefined) return endMsg(301, { 'Location': responseMsg.data.downloadUrl }, "301:" + responseMsg.data.downloadUrl);
    //处理直接 html返回
    if (responseMsg.type === 3) return endMsg(responseMsg.statusCode, responseMsg.headers, responseMsg.data.html);

    //处理目录级密码
    if (responseMsg.type === 1 && !event.isadmin) {//文件列表 非管理员
        let pswd;
        responseMsg.data.content.filter((e) => {
            if (e.name.startsWith('.password=')) {
                pswd = e.name.slice(10);
                return false;
            }
            return true;
        });
        if (pswd) {
            if (event['method'] === 'POST' && event['body']['password']) {// post
                if (event['body']['password'] === pass) {
                    res_headers['set-cookie'] = cookie.serialize('DIRTOKEN', getmd5(pass), { path: p0 + p1 + p2, maxAge: 3600 });
                } else {
                    responseMsg = Msg.info(401, '密码错误');
                }
            } else if (event['cookie']['DIRTOKEN']) {// cookie
                if (event['cookie']['DIRTOKEN'] !== getmd5(pass)) responseMsg = Msg.info(401, 'cookie失效');
            } else responseMsg = Msg.info(401, '当前目录被加密');
        }

        let content_len = responseMsg.data.content.length;
        let pageSize = 50;
        if (!responseMsg.data.nextHref && !responseMsg.data.prevHref && content_len > pageSize) {//@info 分页功能,兼容旧接口,只有云盘模块未提供href时启用
            let page = 1;
            if (!isNaN(Number(event.query['page']))) page = Number(event.query['page']);
            responseMsg.data.content = responseMsg.data.content.slice((page - 1) * pageSize, page * pageSize);
            if (page > 1) responseMsg.data.prevHref = '?page=' + (page - 1);
            if (content_len > page * pageSize) responseMsg.data.nextHref = '?page=' + (page + 1);
        }
    }

    console.log(responseMsg);
    event.script = "";
    res_html = render_funcs[G_CONFIG.render_name].render(responseMsg, event, G_CONFIG);
    if (responseMsg.headers) for (let h in responseMsg.headers) res_headers[h] = responseMsg.headers[h];
    return endMsg(responseMsg.statusCode, res_headers, res_html);
};
