'use strict';
const { G_CONFIG, DRIVE_MAP, DOMAIN_MAP, RENDER } = require("./config");
const { urlSpCharEncode } = require('./function').funcs;
const DRIVE_MAP_KEY = [];
const DRIVES_IN_DIR = {};

/**
 * onepoint ukuq
 * time:191029
 */

initialize();
function initialize() {
    for (let k in DRIVE_MAP) {
        DRIVE_MAP[k].cache = {};
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
}
console.log(DRIVE_MAP_KEY);
console.log(DRIVE_MAP);

/**
 * 返回, 一些清理工作可放这里
 * @param {*} statusCode 
 * @param {*} headers 
 * @param {*} body 
 * @param {*} isBase64Encoded 
 */
function endMsg(statusCode, headers, body, isBase64Encoded) {
    console.log("main end ..." + statusCode + ":" + new Date().toLocaleString(), 'utf-8');
    return {
        'isBase64Encoded': isBase64Encoded || false,
        'statusCode': statusCode,
        'headers': headers,
        'body': body
    }
}

exports.main_handler = async (event, context, callback) => {
    event['path'] = decodeURIComponent(event['path']);//处理中文字符
    console.log(event);
    let event_path = event['path'];
    let host = event['headers']['host'];
    let reqPath, p0;
    let requestContext_path = event['requestContext']['path'];
    if (requestContext_path.endsWith('/')) requestContext_path = requestContext_path.slice(0, -1);// / or /abc/
    if (event['headers']['host'].startsWith(event['requestContext']['serviceId'])) {//长域名
        p0 = `/${event['requestContext']['stage']}${requestContext_path}`;
        reqPath = event_path.slice(requestContext_path.length) || '/';//  只有scf网关不规范 ,例如 /abc 前者才为假
    } else {
        p0 = DOMAIN_MAP[host] || "";
        reqPath = event_path.slice(p0.length) || '/';
    }
    console.log(new Date().toLocaleString(), 'utf-8');
    console.info('reqPath:' + reqPath);
    let driveMap, p1, p2;
    for (let i in DRIVE_MAP_KEY) {
        let dm = DRIVE_MAP_KEY[i];
        if (reqPath.startsWith(dm)) {
            console.log("映射路径为:" + dm);
            driveMap = DRIVE_MAP[dm];
            p1 = dm.slice(0, -1);
            p2 = reqPath.slice(dm.length - 1);
            break;
        }
    }
    if (!p2) throw 'no such cast found';
    let responseMsg = await driveMap.func(driveMap.spConfig, driveMap.cache, p2, event['queryString'], event['body']);//spConfig, dataCache, p2, query, body
    let rHtml = "something wrong!", rHeaders = { 'Content-Type': 'text/html' }, rStatusCode = 200;
    let splitPath = { host: "//" + host, p0: urlSpCharEncode(p0), p1: urlSpCharEncode(p1), p2: urlSpCharEncode(p2) };
    switch (responseMsg.statusCode) {//200  301 302 401 403 404 500,
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
                rHtml = RENDER.r200_list(responseMsg.data, responseMsg.readMe, responseMsg.script, splitPath, G_CONFIG);
            } else if (responseMsg.type === 0) {//文件
                if (event['queryString']['preview'])
                    rHtml = RENDER.r200_file(responseMsg.data.fileInfo, responseMsg.readMe, responseMsg.script, splitPath, G_CONFIG);//预览模式
                else {
                    rStatusCode = 301;
                    rHeaders['location'] = responseMsg.data.fileInfo.downloadUrl;
                    rHtml = "redirecting to :" + rHeaders['location'];
                }
            } else if (responseMsg.type === 3) {
                rHtml = RENDER.rxxx_info(responseMsg.statusCode, responseMsg.info, responseMsg.readMe, responseMsg.script, splitPath, G_CONFIG);
                rStatusCode = responseMsg.statusCode;
            }
            break;
        case 301:
        case 302:
            rStatusCode = responseMsg.statusCode;
            rHeaders['location'] = responseMsg.redirectUrl;
            rHtml = responseMsg.info || "redirecting to :" + rHeaders['location'];
            break;
        case 401:
        case 403:
        case 404:
        case 500:
            rHtml = RENDER.rxxx_info(responseMsg.statusCode, responseMsg.info, responseMsg.readMe, responseMsg.script, splitPath, G_CONFIG);
            rStatusCode = responseMsg.statusCode;
            break;
        default:
            break;
    }
    return endMsg(rStatusCode, rHeaders, rHtml);
};

//exports.main_handler({ path: '/onepoint', queryString: {} });//spPage: undefined, isJson: true 
exports.main_handler({ path: '/', headers: { host: "idid000.com" }, requestContext: { path: "/", serviceId: "idid", stage: 'release' }, queryString: {} });//nextPage: undefined, isJson: true 
