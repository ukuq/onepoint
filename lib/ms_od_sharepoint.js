'use strict';
const https = require("https");
const zlib = require('zlib');
const url = require('url');

/**
 * onepoint ukuq
 * time:191029
 */

let { Msg_file, Msg_info, Msg_list, formatSize, getExtByName, formatDate, urlSpCharEncode } = require('../function').tool_funcs;
let dataCache, cookieMap;

const POST_OPTIONS = {
    method: "POST",
    headers: {
        "accept": "application/json;odata=verbose",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN",
        "cache-control": "no-cache",
        "content-type": "application/json;odata=verbose",
        "origin": "",
        "pragma": "no-cache",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-serviceworker-strategy": "CacheFirst",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0",
        "Cookie": ""
    }
}




/**
 * 传入一个 / 开头的路径字符串,返回值为 {urlType:"文件(夹)",rDatas:"子节点信息", url:"reqPath",reqPathspItemUrl:"本节点信息url",PrevHref,NextHref}
 * @param {*} reqPath 相对于pathPrefix的路径
 * @param {*} postUrl 需要发送post请求的完整url
 * @param {*} refreshForce 强制刷新,不接受缓存信息
 * @param {*} spPage 请求某节点后的下一页数据
 */
function getDirList(reqPath, postUrl, refreshForce, spPage) {
    console.log('getDirList---------------------------------------------------------------------');
    console.log('reqPath:' + reqPath);
    console.log('spPage:' + spPage);
    reqPath = reqPath || '/';
    if (!reqPath.startsWith('/')) { throw "403: wrong format"; }
    //if (reqPath.endsWith('/') && reqPath.length > 1) reqPath = reqPath.slice(0, -1);//合并 目录 加斜线的情况  (reqPath通常已提前处理,这里为其他api保留)
    console.log("getting data from cache ...");
    if (!refreshForce) {//请求没有要求刷新,且有缓存,直接返回
        if (!spPage && dataCache[reqPath]) return dataCache[reqPath];
        else if (spPage && dataCache[reqPath + "?" + spPage]) return dataCache[reqPath + "?" + spPage];
    }
    console.log("getting data from net ...");
    if (!spPage) postUrl = `${postUrl}&TryNewExperienceSingle=TRUE`;
    else postUrl = `${postUrl}&TryNewExperienceSingle=TRUE&${spPage}`;
    return new Promise((resolve) => {
        let tmpurl = url.parse(postUrl);
        POST_OPTIONS.path = tmpurl.path;
        POST_OPTIONS.hostname = tmpurl.hostname;
        POST_OPTIONS.headers.origin = `https://${tmpurl.hostname}`;
        //POST_OPTIONS.headers.Cookie = cookieMap[postUrl];
        console.info(tmpurl.path);
        console.info(tmpurl.hostname);
        const req = https.request(POST_OPTIONS, (res) => {
            console.log(`Got response: ${res.statusCode}`);
            //console.log(res.headers);
            if (!res.headers["content-encoding"]) res.headers["content-encoding"] = 'utf-8';
            if (res.statusCode === 200) {
                const parseBody = (bodyString) => {
                    const g_listData = JSON.parse(bodyString);
                    //console.log(g_listData);
                    let jsonData = { urlType: 1, rDatas: [] };//urlType 1为文件夹,0为文件或空文件夹, 空文件夹后续会纠正
                    if (spPage) jsonData.spPage = encodeURIComponent(spPage);
                    let rDatas = jsonData.rDatas;
                    let encodePath = urlSpCharEncode(reqPath);
                    g_listData.ListData.Row.forEach(e => {
                        let rData = {};
                        rData['nodeType'] = e['FSObjType'];
                        //rData['otherInfo']['id'] = e['ID'];
                        rData['name'] = e['FileLeafRef'];
                        if (e['FSObjType'] == 1) {
                            rData['size'] = Number(e['ItemChildCount']) + Number(e['FolderChildCount']) + " items";
                            rData['url_p2'] = encodePath + urlSpCharEncode(rData['name']) + "/";
                        }
                        else {
                            rData['size'] = formatSize(e['FileSizeDisplay']);
                            rData['url_p2'] = encodePath + urlSpCharEncode(rData['name']);
                            dataCache[reqPath + "/" + rData.name] = {
                                urlType: 0, spItemUrl: e['.spItemUrl']
                            };
                        }
                        rData['modified'] = e['Modified.'];
                        rData['fileType'] = e['.fileType'];
                        rDatas.push(rData);
                        console.log("push---" + rData.name + "---" + rData.size);
                    });
                    if (rDatas.length === 0) {
                        jsonData.urlType = 0;//为文件或者空文件夹
                        jsonData.spItemUrl = g_listData.ListData.CurrentFolderSpItemUrl;//空文件夹 或 文件
                    }
                    let next = nextInfoFilter(g_listData.ListData['PrevHref']);
                    if (next) jsonData['PrevHref'] = encodePath + "?spPage=" + next + "&";
                    next = nextInfoFilter(g_listData.ListData['NextHref']);
                    if (next) jsonData['NextHref'] = encodePath + "?spPage=" + next + "&";
                    console.log("prev:" + jsonData['PrevHref']);
                    console.log("next:" + jsonData['NextHref']);
                    if (!spPage) dataCache[reqPath] = jsonData;//只在请求第一页数据时写入缓存
                    else dataCache[reqPath + "?" + spPage] = jsonData;
                    resolve(jsonData);
                }
                let chunks = [];//默认gzip
                res.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                res.on('end', () => {
                    let buffer = Buffer.concat(chunks);
                    if (res.headers['content-encoding'] === 'gzip') {
                        zlib.gunzip(buffer, (err, decoded) => {
                            if (err) throw err;
                            console.log("content-encoding:gzip");
                            parseBody(decoded.toString());
                        });
                    } else if (res.headers["content-encoding"] === 'utf-8') {
                        let rawData = '';
                        chunks.forEach(e => rawData += e);
                        console.log("content-encoding:utf-8");
                        parseBody(rawData);
                    } else {
                        throw "data is not gziped";
                    }
                });
            } else if (res.statusCode === 404) {
                let jsonData = { urlType: 404 };//文件不存在
                resolve(jsonData);
            } else if (res.statusCode === 403) {
                POST_OPTIONS.headers.Cookie = '';
                console.log("token is required");
                let jsonData = { urlType: 403 };
                resolve(jsonData);//云函数 , 文件保存时间短, cookie几乎不会失效.
            } else {
                throw "Wrong:" + res.statusCode;
            }
        }).on('error', (e) => {
            console.log(`Got error: ${e.message}`);
            throw e;
        });//{"parameters":{"__metadata":{"type":"SP.RenderListDataParameters"},"RenderOptions":464647,"AllowMultipleValueFilterForTaxonomyFields":true,"AddRequiredFields":true}}
        const POSTBODY_DIR = '{ "parameters": { "__metadata": { "type": "SP.RenderListDataParameters" }, "RenderOptions": 136967, "AllowMultipleValueFilterForTaxonomyFields": true, "AddRequiredFields": true } }';
        req.write(POSTBODY_DIR);
        req.end();
    });
}

/**
 * 获取节点信息, 文件包含下载链接,文件夹不包含;不进行缓存, 下载链接可能会过期
 * @param {*} spItemUrl 获取节点信息
 */
function getFileInfo(spItemUrl) {
    return new Promise((resolve) => {
        let tmpurl = url.parse(spItemUrl);
        https.get({
            path: tmpurl.path,
            hostname: tmpurl.hostname,
            headers: {
                'User-Agent': POST_OPTIONS.headers["User-Agent"],
                'Cookie': POST_OPTIONS.headers.Cookie,
            }
        }, (res) => {
            console.log(`get download url from net: ${res.statusCode}`);
            let rawData = "";
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                //console.log(rawData);
                const fileInfo = JSON.parse(rawData);
                //console.log(fileInfo['@content.downloadUrl']);
                resolve(fileInfo);
            });
        }).on('error', (e) => {
            throw e;
        });
    });
}




/**
 * 获取cookie,成功返回true
 * @param {*} shareUrl 对应的实际分享链接
 */
function getCookie(shareUrl) {
    if (!cookieMap[shareUrl]) return false;
    POST_OPTIONS.headers.Cookie = cookieMap[shareUrl]['set-cookie'];
    return true;//非空 success
}

/**
 * 刷新cookie, 异步保存文件
 * @param {*} shareUrl 
 */
function refreshCookie(shareUrl) {
    console.log('refreshing cookie from net...');
    console.log('shareUrl:' + shareUrl);
    return new Promise((resolve) => {
        https.get(shareUrl, (res) => {
            console.log(`refresh cookie from net: ${res.statusCode}`);
            //console.log(res.headers['set-cookie']);
            cookieMap[shareUrl] = res.headers;
            POST_OPTIONS.headers.Cookie = res.headers['set-cookie'];
            resolve();
        }).on('error', (e) => {
            throw e;
        });
    });
}

function nextInfoFilter(url) {
    if (!url) return url;
    console.log(url);
    return encodeURIComponent(url.slice(1).split('&').filter(e => { return e.startsWith("Paged") || e.startsWith('p_SortBehavior') || e.startsWith('p_FileLeafRef') || e.startsWith('p_Modified') || e.startsWith('p_ID') || e.startsWith("PageFirstRow") || e.startsWith('View') }).join('&'));
}


exports.func = async (spConfig, cache, request) => {
    let p2 = request.url_p2;
    let query = request.queryString;
    if (!cache['dataCache']) cache['dataCache'] = {};
    dataCache = cache['dataCache'];
    if (!cache['cookieMap']) cache['cookieMap'] = {};
    cookieMap = cache['cookieMap'];

    if (!spConfig.postRawUrl) {
        let tmp = /https:\/\/([^/]*)\/:f:\/g\/personal\/([^/]*)/.exec(spConfig.shareUrl);
        let t2 = encodeURIComponent(tmp[2]);
        let tmppost = (spConfig.postRawDir !== undefined) ? spConfig.postRawDir : '/share';
        spConfig.postRawUrl = `https://${tmp[1]}/personal/${tmp[2]}/_api/web/GetList(@a1)/RenderListDataAsStream?@a1=%27%2Fpersonal%2F${t2}%2FDocuments%27&RootFolder=%2Fpersonal%2F${t2}%2FDocuments${encodeURIComponent(tmppost)}`;
    }

    if (!getCookie(spConfig.shareUrl)) await refreshCookie(spConfig.shareUrl);
    spConfig['postUrl'] = spConfig.postRawUrl + encodeURIComponent(p2);
    let jsonData = await getDirList(p2, spConfig.postUrl, query['refresh'], query['spPage']);

    if (jsonData.urlType === 403) {
        await refreshCookie(msurl.shareUrl);//刷新一次, 不再回退避免死循环
        return Msg_info(403, "cookie refreshed, try again");
    } else if (jsonData.urlType === 404) {//404
        return Msg_info(404, "404 NOT FOUND :-(");
    } else if (jsonData.urlType === 0) {//空文件夹 或者 文件
        let fileInfo = await getFileInfo(jsonData.spItemUrl);
        let turl = fileInfo['@content.downloadUrl'];//可能具有时效性, 不缓存该项
        if (turl) {
            console.log("url:" + turl);
            console.log(JSON.stringify(fileInfo, null, 4));
            return Msg_file({
                fileType: getExtByName(fileInfo['name']),//文件类型，不带点
                downloadUrl: fileInfo['@content.downloadUrl'],//直链
                name: fileInfo['name'],//"文件名",
                url_p2: p2,//以p2为基准的根目录
                size: formatSize(fileInfo['size']),//"文件大小 MB，文件夹 XX个项目 或 MB",
                modified: formatDate(fileInfo['lastModifiedDateTime'])//"最近修改日期，文件夹或云盘可为空",
            });
        } else {
            jsonData.urlType = 1;//纠正 ,空文件夹
            console.log("empty directory");
        }
    }
    return Msg_list(jsonData.rDatas, jsonData.PrevHref, jsonData.NextHref);
};

