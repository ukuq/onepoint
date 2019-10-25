'use strict';
/**
 *  多页加载
 */
const https = require("https");
const fs = require('fs');
const zlib = require('zlib');
const url = require('url');
const path = require('path');
const G_CONFIG = {
    saveFile: false,
    rootReadme: true,
    FILE_DATACACHE: 'dataCacheee',
    FILE_COOKIE: 'cookieee'
};
const SITEINFO = {
    title: "onePoint Demo",
    icon: "",
    keywords: "onePoint",
    description: "onePoint description"
};
/**
 * 进一步简化配置过程,配置时只需要配置shareUrl,如按建议,建立/share为默认文件夹,则 postRawDir无需配置
 */
const MSUrls = {
    '/mmx/': {//支持中文, 此处无需转码
        shareUrl: 'https://lovelearn-my.sharepoint.com/:f:/g/personal/admin_share_onesrc_cc/Es6CMetI4fJCr4GqWZ3uvA0BEnzJxxb4CU-iQr04VYomLQ?e=C9K35U',
        postRawDir: '/image'//自定义分享文件夹,分享的文件夹名称为 /image
    },
    '/': {
        shareUrl: 'https://lovelearn-my.sharepoint.com/:f:/g/personal/admin_share_onesrc_cc/EkEBAXfrK01JiBdQUQKm7O0BlHt50NS45RP9WKSCvEY9Sg?e=bkFrDs'
    }
}

const domainMap = {};//域名映射,生成pathPreFix时自动调用,默认为空

let dataCache = {};
let cookieMap = {};

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

initialize();
function initialize() {
    for (let m in MSUrls) {
        let tmp = /https:\/\/([^/]*)\/:f:\/g\/personal\/([^/]*)/.exec(MSUrls[m].shareUrl);
        let t2 = encodeURIComponent(tmp[2]);
        MSUrls[m].postRawUrl = `https://${tmp[1]}/personal/${tmp[2]}/_api/web/GetList(@a1)/RenderListDataAsStream?@a1=%27%2Fpersonal%2F${t2}%2FDocuments%27&RootFolder=%2Fpersonal%2F${t2}%2FDocuments${encodeURIComponent(MSUrls[m].postRawDir || '/share')}`;
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
                    let jsonData = { urlType: 1, rDatas: [], fileMap: {}, url: reqPath };//urlType 1为文件夹,0为文件或空文件夹, 空文件夹后续会纠正
                    if (spPage) jsonData.spPage = encodeURIComponent(spPage);
                    let rDatas = jsonData.rDatas;
                    g_listData.ListData.Row.forEach(e => {
                        let rData = {};
                        rData['type'] = e['FSObjType'];
                        rData['id'] = e['ID'];
                        jsonData.fileMap[e.ID] = e['.spItemUrl'];//用fileID存储
                        //rData['spItemUrl'] = e['.spItemUrl']; 暂时不需要,可隐去
                        rData['name'] = e['FileLeafRef'];
                        rData['size'] = formatSize(e['FileSizeDisplay']);
                        rData['modified'] = e['Modified.'];
                        rData['fileType'] = e['.fileType'];
                        rData['childCount'] = Number(e['ItemChildCount']) + Number(e['FolderChildCount']);
                        rDatas.push(rData);
                        console.log("push---" + rData.name + "---" + rData.id);
                    });
                    if (rDatas.length === 0) {
                        jsonData.urlType = 0;//为文件或者空文件夹
                        jsonData.spItemUrl = g_listData.ListData.CurrentFolderSpItemUrl;//空文件夹 或 文件
                    }
                    jsonData['PrevHref'] = nextInfoFilter(g_listData.ListData['PrevHref']);
                    jsonData['NextHref'] = nextInfoFilter(g_listData.ListData['NextHref']);
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
                let jsonData = { urlType: 404, rDatas: [], url: reqPath };//文件不存在
                resolve(jsonData);
            } else if (res.statusCode === 403) {
                POST_OPTIONS.headers.Cookie = '';
                console.log("token is required");
                let jsonData = { urlType: 403, rDatas: [], url: reqPath };
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
 * 获取文件内容,通常要求文件大小小于1000B的文本文件;---保留api,暂未使用
 * @param {*} fileInfo 
 */
function getFileContent(fileInfo) {
    if (fileInfo['size'] > 1000) return "Too big";
    let downloadUrl = fileInfo['@content.downloadUrl'];
    return new Promise((resolve) => {
        let tmpurl = url.parse(downloadUrl);
        https.get({
            path: tmpurl.path,
            hostname: tmpurl.hostname,
            headers: {
                'User-Agent': POST_OPTIONS.headers["User-Agent"],
                'Cookie': POST_OPTIONS.headers.Cookie,
            }
        }, (res) => {
            console.log(`downloading from net: ${res.statusCode}`);
            let rawData = "";
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                console.log(rawData);
                //const fileInfo = JSON.parse(rawData);
                //console.log(fileInfo['@content.downloadUrl']);
                resolve(rawData);
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
    if (!G_CONFIG.saveFile) {//未用文件缓存
        if (!cookieMap[shareUrl]) return false;
        POST_OPTIONS.headers.Cookie = cookieMap[shareUrl]['set-cookie'];
        return true;//非空 success
    }
    if (fs.existsSync(G_CONFIG.FILE_COOKIE)) {//文件缓存
        try {
            console.log("read cookie from local file:");
            let data = fs.readFileSync(G_CONFIG.FILE_COOKIE);
            cookieMap = JSON.parse(data);
            if (!cookieMap[shareUrl]) return false;
            POST_OPTIONS.headers.Cookie = cookieMap[shareUrl]['set-cookie'];
            console.log("success");
            console.log("reading cache from local file:");
            if (fs.existsSync(G_CONFIG.FILE_DATACACHE)) {//此处若数据缓存读取失败,一样需要刷新cookie
                dataCache = JSON.parse(fs.readFileSync(G_CONFIG.FILE_DATACACHE));
                console.log("success");
            }
            return true;
        } catch (error) {
            console.log("error in getCookie, the file is invalid");
            return false;
        }
    } else false;
}

/**
 * 刷新cookie, 异步保存文件
 * @param {*} shareUrl 
 */
function refreshCookie(shareUrl) {
    console.log('refreshing cookie from net...');
    return new Promise((resolve) => {
        https.get(shareUrl, (res) => {
            console.log(`refresh cookie from net: ${res.statusCode}`);
            //console.log(res.headers['set-cookie']);
            cookieMap[shareUrl] = res.headers;
            POST_OPTIONS.headers.Cookie = res.headers['set-cookie'];
            if (G_CONFIG.saveFile) fs.writeFile(G_CONFIG.FILE_COOKIE, JSON.stringify(cookieMap), (err) => {
                if (err) throw err;
                console.log("write cookie to local file: success");
            });
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

/**
 * 需要与MSUrls相对应,二者负责完成不同分享链接的路径映射,返回{reqPath,shareUrl,postUrl}
 * @param {*} reqPath 相对请求路径
 */
function getPathMap(reqPath) {
    let msurl = { 'reqPath': reqPath };
    for (let m in MSUrls) {
        if (reqPath.startsWith(m)) {
            console.log("映射路径为:" + m);
            msurl['shareUrl'] = MSUrls[m].shareUrl;
            msurl['postUrl'] = MSUrls[m].postRawUrl + encodeURIComponent(reqPath.slice(m.length - 1));
            return msurl;
        }
    }
}

/**
 * 格式化文件大小信息
 * @param {*} size 
 */
function formatSize(size) {
    if (!size) return size;
    else size = Number(size);
    let count = 0;
    while (size >= 1024) {
        size /= 1024;
        count++;
    }
    size = size.toFixed(2);
    size += [' B', ' KB', ' MB', ' GB'][count];
    return size;
};


function urlSpCharEncode(s) {
    let res = '';
    for (let len = s.length, i = 0; i < len; i++) {
        let ch = s[i];
        switch (ch) {
            case '%':
                res += '%25';
                break;
            case '?':
                res += '%3f';
                break;
            case '#':
                res += '%23';
                break;
            default:
                res += ch;
        }
    }
    return res;
}



/**
 * html 渲染
 * @param {*} jsonData 
 * @param {*} reqPath 
 */
function render200(jsonData, reqPath) {
    let { html, tmpIncPath } = get_html_head(reqPath);
    html += `<div class="mdui-container-fluid"><style>.thumb .th{display:none}.thumb .mdui-text-right{display:none}.thumb .mdui-list-item a,.thumb .mdui-list-item{width:217px;height:230px;float:left;margin:10px 10px!important}.thumb .mdui-col-xs-12,.thumb .mdui-col-sm-7{width:100%!important;height:230px}.thumb .mdui-list-item .mdui-icon{font-size:100px;display:block;margin-top:40px;color:#7ab5ef}.thumb .mdui-list-item span{float:left;display:block;text-align:center;width:100%;position:absolute;top:180px}</style><div class="nexmoe-item"><div class="mdui-row"><ul class="mdui-list"><li class="mdui-list-item th"><div class="mdui-col-xs-12 mdui-col-sm-7">文件 <i class="mdui-icon material-icons icon-sort" data-sort="name" data-order="downward">expand_more</i></div><div class="mdui-col-sm-3 mdui-text-right">修改时间 <i class="mdui-icon material-icons icon-sort" data-sort="date" data-order="downward">expand_more</i></div><div class="mdui-col-sm-2 mdui-text-right">大小 <i class="mdui-icon material-icons icon-sort" data-sort="size" data-order="downward">expand_more</i></div></li>`;
    if (jsonData.PrevHref) {
        html += `<li class="mdui-list-item mdui-ripple"><a href="?spPage=${jsonData.PrevHref}"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_upward</i>上一页</div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
    } else if (reqPath !== '/') {
        html += `<li class="mdui-list-item mdui-ripple"><a href="../"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_upward</i>.. </div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
    }
    jsonData.rDatas.forEach(e => {
        if (e.type == 1) {
            html += `<li class="mdui-list-item mdui-ripple realFile"><a href="${tmpIncPath}${urlSpCharEncode(e.name)}/"><div class="mdui-col-xs-12 mdui-col-sm-7 mdui-text-truncate"><i class="mdui-icon material-icons">folder_open</i><span>${e.name}</span></div><div class="mdui-col-sm-3 mdui-text-right">${e.modified}</div><div class="mdui-col-sm-2 mdui-text-right">${e.childCount} 个项目</div></a></li>`;
        } else {
            html += `<li class="mdui-list-item file mdui-ripple realFile"><a href="?fileID=${e.id}${jsonData.spPage ? '&spPage=' + jsonData.spPage : ''}"><div class="mdui-col-xs-12 mdui-col-sm-7 mdui-text-truncate"><i class="mdui-icon material-icons">insert_drive_file</i><span>${e.name}</span></div><div class="mdui-col-sm-3 mdui-text-right">${e.modified}</div><div class="mdui-col-sm-2 mdui-text-right">${e.size}</div></a></li>`;
        }
        //console.log(`"${G_CONFIG.pathPrefix}${reqPath}/${e.name}"`);
    });

    if (jsonData.NextHref) html += `<li class="mdui-list-item mdui-ripple"><a href="?spPage=${jsonData.NextHref}"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_downward</i>下一页</div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
    html += `</ul></div></div></div>`;
    if (G_CONFIG.rootReadme && reqPath === '/') {
        html += `<div class="mdui-typo mdui-shadow-3" style="padding: 20px;margin: 30px 0px 0px 0px; border-radius: 5px;"><div class="mdui-chip"><span class="mdui-chip-icon"><i class="mdui-icon material-icons">face</i></span><span class="mdui-chip-title">README.md</span></div>`;
        let readme = "## Powered by [OnePoint](https://github.com/ukuq/onepoint)";
        if (fs.existsSync(path.resolve(__dirname, './README.md'))) readme = fs.readFileSync(path.resolve(__dirname, './README.md')).toString();
        readme = readme.replace(/[\n\r]/g, '\\n');
        html += `<div id="readme"></div></div>`;//${readme} 简化安装过程, 由前端实现解析
        html += `<script src="https://cdn.bootcss.com/marked/0.7.0/marked.js"></script><script>document.getElementById('readme').innerHTML =marked('${readme}');</script>`;
    }
    html += `<a href="javascript:window.scrollTo(0,0);" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">flight</i></a>`;
    // html += '<script>let rfiles = document.querySelectorAll("li.realFile");if(rfiles.length%30==0){let tmp = `<li class="mdui-list-item mdui-ripple"><a href="${window.location.pathname}?spPage=${rfiles[rfiles.length-1].querySelector("span").innerText}"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_downward</i>more... </div> <div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;document.querySelector(".mdui-list").innerHTML+=tmp};function thumb(){alert("暂不支持该功能!!!");}</script>'; 
    html += `</div></body></html>`;
    return html;
}

function get_html_head(reqPath) {
    let html = `<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0,maximum-scale=1.0, user-scalable=no"><title>${SITEINFO.title} - index of ${reqPath}</title><link rel="shortcut icon" href="${SITEINFO.icon}"><meta name="keywords" content="${SITEINFO.keywords}"><meta name="description" content="${SITEINFO.description}"><link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"><link href="https://cdn.bootcss.com/mdui/0.4.3/css/mdui.min.css" rel="stylesheet"><style>body{background-color:#f2f5fa;padding-bottom:60px;background-position:center bottom;background-repeat:no-repeat;background-attachment:fixed}.nexmoe-item{margin:20px -8px 0!important;padding:15px!important;border-radius:5px;background-color:#fff;-webkit-box-shadow:0 .5em 3em rgba(161,177,204,.4);box-shadow:0 .5em 3em rgba(161,177,204,.4);background-color:#fff}.mdui-img-fluid,.mdui-video-fluid{border-radius:5px;border:1px solid #eee}.mdui-list{padding:0}.mdui-list-item{margin:0!important;border-radius:5px;padding:0 10px 0 5px!important;border:1px solid #eee;margin-bottom:10px!important}.mdui-list-item:last-child{margin-bottom:0!important}.mdui-list-item:first-child{border:0}.mdui-toolbar{width:auto;margin-top:60px!important}.mdui-appbar .mdui-toolbar{height:56px;font-size:16px}.mdui-toolbar>*{padding:0 6px;margin:0 2px;opacity:.5}.mdui-toolbar>.mdui-typo-headline{padding:0 16px 0 0}.mdui-toolbar>i{padding:0}.mdui-toolbar>a:hover,a.mdui-typo-headline,a.active{opacity:1}.mdui-container{max-width:980px}.mdui-list>.th{background-color:initial}.mdui-list-item>a{width:100%;line-height:48px}.mdui-toolbar>a{padding:0 16px;line-height:30px;border-radius:30px;border:1px solid #eee}.mdui-toolbar>a:last-child{opacity:1;background-color:#1e89f2;color:#ffff}@media screen and (max-width:980px){.mdui-list-item .mdui-text-right{display:none}.mdui-container{width:100%!important;margin:0}.mdui-toolbar>*{display:none}.mdui-toolbar>a:last-child,.mdui-toolbar>.mdui-typo-headline,.mdui-toolbar>i:first-child{display:block}}</style></head><body class="mdui-theme-primary-blue-grey mdui-theme-accent-blue"><div class="mdui-container">`;
    html += `<div class="mdui-container-fluid"><div class="mdui-toolbar nexmoe-item">`;
    let tmpIncPath = G_CONFIG.pathPrefix + '/';
    html += `<a href="${tmpIncPath}">/</a>`;
    reqPath.split('/').forEach(e => {
        if (e) {
            tmpIncPath += urlSpCharEncode(e);
            tmpIncPath += '/';
            html += `<i class="mdui-icon material-icons mdui-icon-dark" style="margin:0;">chevron_right</i><a href="${tmpIncPath}">${e}</a>`;
        }
    });
    html += `</div></div>`;
    return { html, tmpIncPath };
}

function preview_all(fileInfo, reqPath) {
    let { html, tmpIncPath } = get_html_head(reqPath);
    let url = tmpIncPath + urlSpCharEncode(fileInfo.name);
    let mimeType = fileInfo.file.mimeType;
    let type = mimeType.slice(mimeType.lastIndexOf('/') + 1);
    let downloadUrl = fileInfo['@content.downloadUrl'];
    if (['bmp', 'jpg', 'jpeg', 'png', 'gif'].indexOf(type) != -1) {
        html += preview_image(downloadUrl, url);
    } else if (['mp4', 'mkv', 'webm', 'avi', 'mpg', 'mpeg', 'rm', 'rmvb', 'mov', 'wmv', 'mkv', 'asf'].indexOf(type) != -1) {
        html += preview_video_dplayer(downloadUrl, url);
    } else if (['ogg', 'mp3', 'wav'].indexOf(type) != -1) {
        html += preview_audio(downloadUrl, url);
    } else {
        html += preview_unsupposed(downloadUrl, url);
    }
    html += `</div></body></html>`;
    return html;
}

function preview_audio(downloadUrl, url) {
    return `<div class="mdui-container-fluid"><div class="nexmoe-item"><audio class="mdui-center" src="${downloadUrl}" controls autoplay style="width: 100%;"></audio><br>
	<!-- 固定标签 --><div class="mdui-textfield"><label class="mdui-textfield-label">下载地址</label><input class="mdui-textfield-input" type="text" value="${url}"/></div>
	<div class="mdui-textfield"><label class="mdui-textfield-label">引用地址</label><textarea class="mdui-textfield-input"><audio src="${url}"></audio></textarea></div></div></div>
    <a href="${url}" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">file_download</i></a>`;

}
function preview_image(downloadUrl, url) {
    return `<div class="mdui-container-fluid"><div class="nexmoe-item"><img class="mdui-img-fluid mdui-center" src="${downloadUrl}"/>
	<div class="mdui-textfield"><label class="mdui-textfield-label">下载地址</label><input class="mdui-textfield-input" type="text" value="${url}"/></div>
	<div class="mdui-textfield"><label class="mdui-textfield-label">HTML 引用地址</label><input class="mdui-textfield-input" type="text" value="<img src='${url}' />"/>
	</div><div class="mdui-textfield"><label class="mdui-textfield-label">Markdown 引用地址</label><input class="mdui-textfield-input" type="text" value="![](${url})"/></div></div></div>
    <a href="${url}" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">file_download</i></a>`
}
function preview_video_dplayer(downloadUrl, url) {
    return `<link class="dplayer-css" rel="stylesheet" href="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.css">
    <script src="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.js"></script>
    <div class="mdui-container-fluid"><div class="nexmoe-item"><div class="mdui-center" id="dplayer"></div><!-- 固定标签 -->
    <div class="mdui-textfield"><label class="mdui-textfield-label">下载地址</label>
    <input class="mdui-textfield-input" type="text" value="${url}"/></div><div class="mdui-textfield">
    <label class="mdui-textfield-label">引用地址</label><textarea class="mdui-textfield-input"><video><source src="${url}" type="video/mp4"></video></textarea></div></div></div>
    <script>const dp = new DPlayer({container: document.getElementById('dplayer'),lang:'zh-cn',video: {url: '${downloadUrl}',pic: '',type: 'auto'}});</script>
    <a href="${url}" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">file_download</i></a>`
}

function preview_video_dash(downloadUrl, url) {
    return `<link class="dplayer-css" rel="stylesheet" href="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.css"><script src="//cdn.bootcss.com/dashjs/3.0.0/dash.all.min.js"></script><script src="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.js"></script>
    <div class="mdui-container-fluid"><div class="nexmoe-item"><div class="mdui-center" id="dplayer"></div><!-- 固定标签 --><div class="mdui-textfield"><label class="mdui-textfield-label">下载地址</label>
    <input class="mdui-textfield-input" type="text" value="${url}"/></div><div class="mdui-textfield"><label class="mdui-textfield-label">引用地址</label>
    <textarea class="mdui-textfield-input"><video><source src="${url}" type="video/mp4"></video></textarea></div></div></div>
    <script>const dp = new DPlayer({container: document.getElementById('dplayer'),lang:'zh-cn',video: {url: '${downloadUrl}',pic: '',type: 'dash'}});</script>
    <a href="${url}" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">file_download</i></a>`
}

function preview_video_html5(downloadUrl, url) {
    return `<div class="mdui-container-fluid"><div class="nexmoe-item"><video class="mdui-video-fluid mdui-center" preload controls ">
    <source src="${downloadUrl}" type="video/mp4"></video>
	<!-- 固定标签 --><div class="mdui-textfield"><label class="mdui-textfield-label">下载地址</label><input class="mdui-textfield-input" type="text" value="${url}"/></div>
	<div class="mdui-textfield"><label class="mdui-textfield-label">引用地址</label><textarea class="mdui-textfield-input"><video><source src="${url}" type="video/mp4"></video></textarea></div></div></div>
    <a href="${url}" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">file_download</i></a>`
}


function preview_unsupposed(downloadUrl, url) {
    return `<div class="mdui-container-fluid"><div class="nexmoe-item"><div class="" style="font-size: 40px;font-family: sans-serif;margin: 30px;text-align: center;">此格式不支持预览 :-(</div>
    <div class="mdui-textfield"><label class="mdui-textfield-label">下载地址</label><input class="mdui-textfield-input" type="text" value="${url}"></div>
    <div class="mdui-textfield mdui-textfield-not-empty"><label class="mdui-textfield-label">直链地址</label><input class="mdui-textfield-input" type="text" value="${downloadUrl}"></div></div></div>
    <a href="${downloadUrl}" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">file_download</i></a>`;
}

function preview_info(info, reqPath) {
    let { html, tmpIncPath } = get_html_head(reqPath);
    html += `<div class="mdui-container-fluid"><div class="nexmoe-item"><div class="" style="font-size: 40px;font-family: sans-serif;margin: 30px;text-align: center;">${info}</div></div></div>
    <a href="javascript:window.scrollTo(0,0);" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">flight</i></a>`;
    html += `</body></html>`;
    return html;
}

/**
 * 保存数据cache至文件
 */
function saveCache() {
    if (G_CONFIG.saveFile) fs.writeFile(G_CONFIG.FILE_DATACACHE, JSON.stringify(dataCache), (err) => {
        if (err) throw err;
        console.log("write cookie to local file: success");
    });
}

/**
 * 返回, 一些清理工作可放这里
 * @param {*} statusCode 
 * @param {*} headers 
 * @param {*} body 
 * @param {*} isBase64Encoded 
 */
function endMsg(statusCode, headers, body, isBase64Encoded) {
    console.log("main end ..." + statusCode + ":" + new Date().toLocaleString(), 'utf-8');
    saveCache();
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
    let reqPath = event['path'];
    //if (reqPath.endsWith('/') && reqPath.length > 1) reqPath = reqPath.slice(0, -1);//规范化请求路径
    //生成G_CONFIG.pathPrefix,支持多域名 191013
    let requestContext_path = event['requestContext']['path'];
    if (requestContext_path.endsWith('/')) requestContext_path = requestContext_path.slice(0, -1);
    if (event['headers']['host'].startsWith(event['requestContext']['serviceId'])) {
        G_CONFIG.pathPrefix = `/${event['requestContext']['stage']}${requestContext_path}`;
        reqPath = reqPath.slice(requestContext_path.length) || '/';// 由scf 网关api决定
    } else {
        G_CONFIG.pathPrefix = domainMap['host'] || requestContext_path;
        reqPath = reqPath.slice(G_CONFIG.pathPrefix.length) || '/';
    }
    console.log(new Date().toLocaleString(), 'utf-8');
    console.info('reqPath:' + reqPath);
    let msurl = getPathMap(reqPath);
    if (!getCookie(msurl.shareUrl)) await refreshCookie(msurl.shareUrl);
    let jsonData = await getDirList(msurl.reqPath, msurl.postUrl, event['queryString']['refresh'], event['queryString']['spPage']);
    //console.info(jsonData.rDatas.length);
    //console.info(jsonData.rDatas[jsonData.rDatas.length-1].name);
    if (jsonData.urlType === 403) {
        await refreshCookie(msurl.shareUrl);//刷新一次, 不再回退避免死循环
        return endMsg(200, { 'Content-Type': 'text/html' }, preview_info('cookie refreshed', reqPath));
    } else if (jsonData.urlType === 404) {//404
        return endMsg(404, { 'Content-Type': 'text/html' }, preview_info('404 NOT FOUND :-(', reqPath));
    } else if (jsonData.urlType === 0) {//空文件夹 或者 文件
        let fileInfo = await getFileInfo(jsonData.spItemUrl);
        let turl = fileInfo['@content.downloadUrl'];
        if (turl) {
            console.log("url:" + turl);
            return endMsg(302, { 'Content-Type': 'text/html', 'Location': turl }, `downloading...${turl}`);
        } else {
            jsonData.urlType = 1;//纠正 ,空文件夹
            console.log("empty directory");
        }
    } else if (event['queryString']['fileID']) {//预览专用, 减少了一次请求, 加快访问速度
        let spItemUrl = jsonData.fileMap[event['queryString']['fileID']];
        if (spItemUrl) {//存在此文件
            console.log(spItemUrl);
            let fileInfo = await getFileInfo(spItemUrl);
            let html = preview_all(fileInfo, reqPath);
            return endMsg(200, { 'Content-Type': 'text/html' }, html);
        }
    }
    if (event['queryString']['isJson']) {
        return endMsg(200, { 'content-type': 'application/json' }, JSON.stringify({ reqPath: reqPath, rDatas: jsonData.rDatas, NextHref: jsonData.NextHref, PrevHref: jsonData.PrevHref }));
    }
    //console.log(jsonData);
    let html = render200(jsonData, reqPath);
    //console.log(html);
    return endMsg(200, { 'Content-Type': 'text/html' }, html);
};

//exports.main_handler({ path: '/onepoint', queryString: {} });//spPage: undefined, isJson: true 
