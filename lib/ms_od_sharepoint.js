'use strict';
const { Msg_file, Msg_info, Msg_list, formatSize, formatDate, getExtByName, urlSpCharEncode } = require('../function').tool_funcs;
const { request: _request, get } = require('https');
const { gunzip } = require('zlib');
const { parse } = require('url');

/**
 * onepoint ukuq
 * time:191113
 * sp:无需 graph api
 */

const spConfig_example = {
    shareUrl: "https://lovelearn-my.sharepoint.com/:f:/g/personal/admin_share_onesrc_cc/Es6CMetI4fJCr4GqWZ3uvA0BEnzJxxb4CU-iQr04VYomLQ?e=C9K35U",
    postRawDir: "/image"
}

let listCache, spItemUrlCache, shareUrl;

const POST_OPTIONS = {
    method: "POST",
    headers: {
        "accept": "application/json;odata=verbose",
        "accept-encoding": "gzip, deflate, br",//一般都是gzip
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


function getDirList(p2, postUrl, spPage) {
    if (spPage) postUrl = postUrl + '&' + spPage;
    console.log('p2:' + p2);
    console.log('spPage:' + spPage);
    console.log('postUrl:' + postUrl);
    return new Promise((resolve) => {
        let tmpurl = parse(postUrl);
        POST_OPTIONS.path = tmpurl.path;
        POST_OPTIONS.hostname = tmpurl.hostname;
        POST_OPTIONS.headers.origin = `https://${tmpurl.hostname}`;
        const req = _request(POST_OPTIONS, (res) => {
            console.log(`Got response: ${res.statusCode}`);
            if (!res.headers["content-encoding"]) res.headers["content-encoding"] = 'utf-8';
            if (res.statusCode === 200) {
                const parseBody = (bodyString) => {
                    const g_listData = JSON.parse(bodyString);
                    let content = [];
                    if (!p2.endsWith('/')) p2 += '/';
                    let p2_encode = urlSpCharEncode(p2);
                    g_listData.ListData.Row.forEach(e => {
                        let nodeData = {};
                        nodeData['nodeType'] = Number(e['FSObjType']);
                        nodeData['name'] = e['FileLeafRef'];
                        if (e['FSObjType'] == 1) {
                            nodeData['size'] = Number(e['ItemChildCount']) + Number(e['FolderChildCount']) + " items";
                            nodeData['url_p2'] = p2_encode + urlSpCharEncode(nodeData['name']) + "/";
                        }
                        else {
                            nodeData['size'] = formatSize(e['FileSizeDisplay']);
                            nodeData['url_p2'] = p2_encode + urlSpCharEncode(nodeData['name']);
                            //超前存储, 请求文件时减少一次http, 注意此项只保存文件的spItemUrl
                            spItemUrlCache[p2 + "/" + nodeData.name] = e['.spItemUrl'];
                        }
                        nodeData['modified'] = e['Modified.'];
                        nodeData['fileType'] = e['.fileType'];
                        content.push(nodeData);
                        console.log("push---" + nodeData.name + "---" + nodeData.size);
                    });
                    spItemUrlCache['CurrentFolderSpItemUrl'] = g_listData.ListData.CurrentFolderSpItemUrl;//存储当前SpItemUrl,便与后续区别 空文件夹 和 文件
                    let next = nextInfoFilter(g_listData.ListData['PrevHref']);
                    let prevHref, nextHref;
                    if (next) prevHref = p2_encode + "?spPage=" + next + "&";
                    next = nextInfoFilter(g_listData.ListData['NextHref']);
                    if (next) nextHref = p2_encode + "?spPage=" + next + "&";
                    console.log("prev:" + prevHref);
                    console.log("next:" + nextHref);
                    let res = Msg_list(content, prevHref, nextHref);
                    if (!spPage) listCache[p2] = res//缓存
                    else listCache[p2 + "?" + spPage] = res;
                    resolve(res);
                }
                let chunks = [];//默认gzip
                res.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                res.on('end', () => {
                    let buffer = Buffer.concat(chunks);
                    if (res.headers['content-encoding'] === 'gzip') {
                        gunzip(buffer, (err, decoded) => {
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
                resolve(Msg_info(404, "404 NOT FOUND :-("));
            } else if (res.statusCode === 403) {
                resolve(Msg_info(403, "cookie refreshed, try again"));//云函数 , 文件保存时间短, cookie几乎不会失效.
            } else {
                throw "Wrong at getdirlist:" + res.statusCode;
            }
        }).on('error', (e) => {
            console.log(`Got error: ${e.message}`);
            throw e;
        });
        req.write('{ "parameters": { "__metadata": { "type": "SP.RenderListDataParameters" }, "RenderOptions": 136967, "AllowMultipleValueFilterForTaxonomyFields": true, "AddRequiredFields": true } }');
        req.end();
    });
}

/**
 * 获取节点信息, 文件包含下载链接,文件夹不包含;不进行缓存, 下载链接可能会过期
 * @param {*} spItemUrl 获取节点信息
 */
function getFileInfo(spItemUrl) {
    return new Promise((resolve) => {
        let tmpurl = parse(spItemUrl);
        get({
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
                resolve(JSON.parse(rawData));
            });
        }).on('error', (e) => {
            throw e;
        });
    });
}

function refreshCookie() {
    console.log('refreshing cookie from net...');
    console.log('shareUrl:' + shareUrl);
    return new Promise((resolve) => {
        get(shareUrl, (res) => {
            console.log(`refresh cookie from net: ${res.statusCode}`);
            //console.log(res.headers['set-cookie']);
            resolve(res.headers['set-cookie']);
        }).on('error', (e) => {
            throw e;
        });
    });
}

function nextInfoFilter(url) {
    if (!url) return url;
    return encodeURIComponent(url.slice(1).split('&').filter(e => { return e.startsWith("Paged") || e.startsWith('p_SortBehavior') || e.startsWith('p_FileLeafRef') || e.startsWith('p_Modified') || e.startsWith('p_ID') || e.startsWith("PageFirstRow") || e.startsWith('View') }).join('&'));
}


exports.func = async (spConfig, cache, request) => {
    let p2 = request.url_p2;
    let spPage = request.queryString['spPage'];
    if (!cache['listCache']) cache['listCache'] = {};
    listCache = cache['listCache'];
    if (!cache['spItemUrlCache']) cache['spItemUrlCache'] = {};
    spItemUrlCache = cache['spItemUrlCache'];
    shareUrl = spConfig.shareUrl;
    if (!request.queryString['refresh']) {//请求没有要求刷新,且有缓存,直接返回
        if (!spPage && listCache[p2]) return listCache[p2];
        else if (spPage && listCache[p2 + "?" + spPage]) return listCache[p2 + "?" + spPage];
    }

    if (!spConfig.postRawUrl) {
        let tmp = /https:\/\/([^/]*)\/:f:\/g\/personal\/([^/]*)/.exec(shareUrl);
        let t2 = encodeURIComponent(tmp[2]);
        let tmppost = (spConfig.postRawDir !== undefined) ? spConfig.postRawDir : '';
        spConfig.postRawUrl = `https://${tmp[1]}/personal/${tmp[2]}/_api/web/GetList(@a1)/RenderListDataAsStream?@a1=%27%2Fpersonal%2F${t2}%2FDocuments%27&RootFolder=%2Fpersonal%2F${t2}%2FDocuments${encodeURIComponent(tmppost)}`;
    }

    //设置cookie
    if (!cache['cookieCache']) cache['cookieCache'] = await refreshCookie();
    POST_OPTIONS.headers.Cookie = cache['cookieCache'];

    let res;
    if (spItemUrlCache[p2]) res = { statusCode: 200, data: { content: [] } };//文件
    else res = await getDirList(p2, spConfig.postRawUrl + encodeURIComponent(p2) + '&TryNewExperienceSingle=TRUE', spPage);
    if (res.statusCode === 200 && res.data.content.length == 0) {
        let fileInfo = await getFileInfo(spItemUrlCache[p2] || spItemUrlCache['CurrentFolderSpItemUrl']);
        let turl = fileInfo['@content.downloadUrl'];
        if (turl) {
            console.log("url:" + turl);
            res = Msg_file({
                fileType: getExtByName(fileInfo['name']),//文件类型，不带点
                downloadUrl: fileInfo['@content.downloadUrl'],//直链
                name: fileInfo['name'],//"文件名",
                url_p2: urlSpCharEncode(p2),//以p2为基准的根目录
                size: formatSize(fileInfo['size']),//"文件大小 MB，文件夹 XX个项目 或 MB",
                modified: formatDate(fileInfo['lastModifiedDateTime'])//"最近修改日期，文件夹或云盘可为空",
            });
            listCache[p2] = res;//纠正,该项为文件
        } else {
            console.log("empty directory");
        }
    } else if (res.statusCode === 300) cache['cookieCache'] = await refreshCookie();
    return res;
}


//module.exports.func(spConfig_example, {}, { url_p2: '/alltype', queryString: {} });