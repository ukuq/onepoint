'use strict';
const cookie = require('../local_modules/cookie');
const fs = require('fs');
const path = require('path');

const { Msg_info, urlSpCharEncode, getmd5 } = require('./util').tool_funcs;

const drive_funcs = {};
drive_funcs['ms_od_sharepoint'] = require("../lib/ms_od_sharepoint");
drive_funcs['ms_od_graph'] = require("../lib/ms_od_graph");
drive_funcs['goo_gd_goindex'] = require("../lib/goo_gd_goindex");
drive_funcs['oth_linux_scf'] = require("../lib/oth_linux_scf");
drive_funcs['oth_sys_none'] = require("../lib/oth_sys_none");
drive_funcs['oth_sys_admin'] = require("../lib/oth_sys_admin");
const render_funcs = {};
render_funcs['oneindex_like'] = require("../views/oneindex_like");
render_funcs['xysk_like'] = require("../views/xysk_like");
let G_CONFIG, DRIVE_MAP, DOMAIN_MAP, RENDER;
const DRIVE_MAP_KEY = [];
const DRIVES_IN_DIR = {};
/**
 * onepoint ukuq
 * time:191201
 */

initialize();
/**
 * 初始化 drivemap,完成虚拟云盘的排序 和虚拟云盘在目录列表下的添加
 */
function initialize() {
    let config_json = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config.json'), 'utf8'));
    G_CONFIG = config_json['G_CONFIG'];
    DRIVE_MAP = config_json['DRIVE_MAP'];
    DOMAIN_MAP = config_json['DOMAIN_MAP'];
    RENDER = render_funcs[G_CONFIG.render_name].render;
    console.log(DRIVE_MAP);
    refreshCache();
    //初始化key的集合, 倒序排列方便匹配
    for (let k in DRIVE_MAP) {
        DRIVE_MAP_KEY.push(k);
    }
    DRIVE_MAP_KEY.sort((a, b) => { return b.localeCompare(a) });//逆序
    DRIVE_MAP_KEY.forEach(
        k => {
            let last = k.lastIndexOf('/');
            while (last > 0) {// eg:k = /mmx/a/b/
                last = k.lastIndexOf('/', last - 1);
                let driveNode = {
                    nodeType: 3,//type: 3_drive 
                    name: k.slice(last + 1, -1),//文件名
                    fileType: "",//文件类型，不带点
                    url_p2: k.slice(last),//以p2为基准的根目录
                    size: "drive",//文件大小xx.xx MB, 保留两位小数，中间空格不可少
                    modified: "",//最近修改日期，固定格式
                    otherInfo: {}//此项不用，留给开发者存放其他信息 可为 undefined
                };
                k = k.slice(0, last + 1); ///m = /mmx/a/
                if (!DRIVES_IN_DIR[k]) {//首个一定不重复
                    DRIVES_IN_DIR[k] = [];
                    DRIVES_IN_DIR[k].push(driveNode);
                } else {//可能重复,需要遍历决定添加与否
                    let isHave = 0;
                    DRIVES_IN_DIR[k].forEach(e => { if (e.name === driveNode.name) isHave = 1 });
                    if (!isHave) DRIVES_IN_DIR[k].push(driveNode);
                }
            }
        }
    );
    console.log("initialize success");
}

/**
 * 清除所有cache, 为密码增加hash值,默认一天更新一次
 */
function refreshCache() {
    //设置过了 UTCDate ,并且时间和今天一致, 无需更新
    if (new Date().getUTCDate() === G_CONFIG.UTCDate) return;
    //设置管理员密码 hash 值
    let time = new Date();
    G_CONFIG.UTCDate = time.getUTCDate();
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
exports.main_func = async (event, context, callback) => {
    const start_time = new Date();
    console.log('start_time:' + start_time.toLocaleString(), 'utf-8');
    console.log(event);
    let { ph, p0, p_12 } = event['splitPath'];
    let p1, p2, driveMap;
    let res_html = "something wrong!", res_headers = { 'Content-Type': 'text/html' }, res_statusCode = 200;
    let responseMsg;

    let domain_path = DOMAIN_MAP[event['sourceIp']];
    if (domain_path) {//eg: www.example.com/point
        ph = '//' + domain_path.domain;
        p0 = domain_path.path;
    }

    console.info('p_12:' + p_12);

    refreshCache();

    let isadmin;
    if (event['cookie']['ADMINTOKEN'] === G_CONFIG.admin_password_date_hash) isadmin = true;

    //域名映射
    for (let i = 0; i < DRIVE_MAP_KEY.length; i++) {
        let dm = DRIVE_MAP_KEY[i];
        if (p_12.startsWith(dm)) {
            console.log("映射路径为:" + dm);
            driveMap = DRIVE_MAP[dm];
            p1 = dm.slice(0, -1);
            p2 = p_12.slice(dm.length - 1);
            break;
        }
    }
    if (!p2) throw 'no such cast found';
    if (p_12.startsWith('/admin/')) {
        driveMap = {};
        driveMap.funcName = 'oth_sys_admin';
        driveMap.spConfig = {
            G_CONFIG, DRIVE_MAP, DRIVE_MAP_KEY
        }
        driveMap.cache = {};
        p1 = '/admin';
        p2 = p_12.slice(p1.length);
    }
    event['splitPath']['p_h01'] = ph + p0 + p1;
    event['splitPath']['p2'] = p2;

    if (driveMap.password && !isadmin) {//有密码 非管理员
        //允许 query 云盘hash登录
        if (event['method'] === 'GET' && event['query']['password']) {
            if (event['query']['password'] === driveMap.password_date_hash) {//利用分享的 password_date_hash 登录
                res_headers['set-cookie'] = cookie.serialize('DRIVETOKEN', driveMap.password_date_hash, { path: p0 + p1, maxAge: 3600 });
            } else {
                responseMsg = Msg_info(401, 'token错误');
            }
        } else if (event['method'] === 'POST' && event['body']['password']) {//使用密码 登录
            if (event['body']['password'] === driveMap.password) {//单个云盘登录
                res_headers['set-cookie'] = cookie.serialize('DRIVETOKEN', driveMap.password_date_hash, { path: p0 + p1, maxAge: 3600 });
            } else {//密码错误
                responseMsg = Msg_info(401, '密码错误');
            }
            console.log('使用密码登录:' + event['body']['password']);
        } else if (event['cookie']['DRIVETOKEN']) {//使用cookie
            if (event['cookie']['DRIVETOKEN'] !== driveMap.password_date_hash) {
                responseMsg = Msg_info(401, 'cookie失效,请重新登录');
            }
            console.log('使用cookie登录:' + event['cookie']['DRIVETOKEN']);
        } else responseMsg = Msg_info(401, '请输入密码');
    }

    if (!responseMsg) responseMsg = await drive_funcs[driveMap.funcName].func(driveMap.spConfig, driveMap.cache, event);

    //直接返回html
    if (responseMsg.noRender) return endMsg(responseMsg.statusCode, responseMsg.headers, responseMsg.html);

    if (responseMsg.type === 1 && !isadmin) {//文件列表 非管理员
        let len = responseMsg.data.content.length;
        for (let i = 0; i < len; i++) {
            let e = responseMsg.data.content[i];
            if (e.name.startsWith('.password=')) {
                let pass = e.name.slice(10);//'.password='
                if (event['method'] === 'POST' && event['body']['password']) {// post
                    if (event['body']['password'] === pass) {
                        res_headers['set-cookie'] = cookie.serialize('DIRTOKEN', getmd5(pass), { path: p0 + p1 + p2, maxAge: 3600 });
                    } else {
                        responseMsg = Msg_info(401, '密码错误');
                    }
                } else if (event['cookie']['DIRTOKEN']) {// cookie
                    if (event['cookie']['DIRTOKEN'] !== getmd5(pass)) responseMsg = Msg_info(401, 'cookie失效');
                } else responseMsg = Msg_info(401, '当前目录被加密');
                break;
            }
        }
    }

    //list file info
    res_statusCode = responseMsg.statusCode;
    responseMsg.script += `<script>console.log("path:${p_12}, time:${new Date().valueOf() - start_time.valueOf()}ms")</script>`;

    let splitPathEncoded = { ph: ph, p0: urlSpCharEncode(p0), p1: urlSpCharEncode(p1), p2: urlSpCharEncode(p2) };
    console.log(splitPathEncoded);

    switch (res_statusCode) {//200  301 302 401 403 404 500,
        case 200:
            if (responseMsg.type === 1) {//文件夹 
                let p_12 = p1 + p2;
                if (DRIVES_IN_DIR[p_12] && DRIVES_IN_DIR[p_12].length > 0) {//映射盘目录下发现网盘
                    if (responseMsg.data.content.length === 0 || responseMsg.data.content[0].nodeType !== 3) {//为空或者首位不是网盘节点,则添加该节点
                        DRIVES_IN_DIR[p_12].forEach(e => {
                            responseMsg.data.content.unshift(e);
                        });
                    }
                }
                res_html = RENDER.r200_list(responseMsg.data, responseMsg.readMe, responseMsg.script, splitPathEncoded, G_CONFIG);
            } else if (responseMsg.type === 0) {//文件
                if (event['query']['preview'] !== undefined)
                    res_html = RENDER.r200_file(responseMsg.data.fileInfo, responseMsg.readMe, responseMsg.script, splitPathEncoded, G_CONFIG);//预览模式
                else {
                    res_statusCode = 301;
                    res_headers['location'] = responseMsg.data.fileInfo.downloadUrl;
                    res_html = "redirecting to :" + res_headers['location'];
                }
            } else if (responseMsg.type === 3) {//info
                res_html = RENDER.rxxx_info(responseMsg.info, responseMsg.readMe, responseMsg.script, splitPathEncoded, G_CONFIG);
            }
            break;
        case 401:
            res_html = RENDER.r401_auth(responseMsg.info, responseMsg.readMe, responseMsg.script, splitPathEncoded, G_CONFIG);
            break;
        default:
            res_html = RENDER.rxxx_info(responseMsg.info, responseMsg.readMe, responseMsg.script, splitPathEncoded, G_CONFIG);
            break;
    }
    if (Object.prototype.toString.call(responseMsg.headers) === '[object Object]') {
        for (let h in responseMsg.headers) res_headers[h] = responseMsg.headers[h];
    }
    return endMsg(res_statusCode, res_headers, res_html);
};