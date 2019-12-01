const { Msg_file, Msg_info, Msg_list, formatSize, formatDate, getExtByName, urlSpCharEncode } = require('../bin/util').tool_funcs;

const https = require("https");

const spConfig_example = {
    "password": "index",
    "cfurl": "goindex.onesrc.workers.dev"
}

/**
 * 空格 url
 * 文件列表
 * @param {*} p2 
 * @param {*} cfurl 
 * @param {*} pass 
 */
function proxy(p2, cfurl, pass) {
    return new Promise((resolve) => {
        const req = https.request({ method: "post", hostname: cfurl, path: encodeURI(p2) },
            (res) => {
                console.log(`Got response: ${res.statusCode}`);//默认utf8
                if (res.statusCode !== 200) {
                    resolve(Msg_info(500, `别问, 问就是 ${res.statusCode} !`));
                    return;
                }
                let data = "";
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    console.log(data);
                    if (!data) {
                        resolve(Msg_info(404, "404 一片空白"));
                    } else {
                        let jsonData = JSON.parse(data);
                        let p2_encode = urlSpCharEncode(p2);
                        if (!jsonData.files) {//文件
                            let e = jsonData;
                            if (e['size'] === undefined) {//其实是 文件夹节点信息
                                resolve(Msg_info(403, "请规范化文件夹路径"));
                            }
                            let fileinfo = {
                                downloadUrl: 'https://' + cfurl + p2_encode,
                                nodeType: 0,//type: 0_file 
                                name: e['name'],//文件名
                                fileType: getExtByName(e['name']),//文件类型，不带点
                                url_p2: p2_encode,//以p2为基准的根目录
                                size: formatSize(e['size']),//文件大小xx.xx MB, 保留两位小数，中间空格不可少
                                modified: formatDate(e['modifiedTime']),//最近修改日期，固定格式
                                otherInfo: {}//此项不用，留给开发者存放其他信息 可为 undefined
                            };
                            resolve(Msg_file(fileinfo));
                        } else {//dir
                            let rDatas = [];
                            jsonData.files.forEach(e => {
                                let rData = {
                                    nodeType: 0,
                                    name: e['name'],//文件名
                                    fileType: getExtByName(e['name']),//文件类型，不带点
                                    url_p2: p2_encode + urlSpCharEncode(e['name']),//以p2为基准的根目录
                                    size: formatSize(e['size']) || 'x items',//文件大小xx.xx MB, 保留两位小数，中间空格不可少
                                    modified: formatDate(e['modifiedTime']),//最近修改日期，固定格式
                                    otherInfo: {}//此项不用，留给开发者存放其他信息 可为 undefined
                                };
                                if (e['mimeType'].endsWith('folder')) {
                                    rData.nodeType = 1;
                                    rData.url_p2 += '/';
                                }
                                rDatas.push(rData);
                            });
                            resolve(Msg_list(rDatas));
                        }
                    }
                });
            });
        req.write(JSON.stringify({ "password": pass }));
        req.end();
    });
}

exports.func = async (spConfig, cache, event) => {
    let p2 = event.splitPath.p2;
    let query = event.query;
    if (!cache['listCache']) cache['listCache'] = {};
    if (!query['refresh'] && cache['listCache'][p2]) return cache['listCache'][p2];
    let res = await proxy(p2, spConfig['cfurl'], spConfig['password']);
    if (res.statusCode === 200) cache['listCache'][p2] = res;
    console.log(JSON.stringify(res, null, 2));
    return res;
}
