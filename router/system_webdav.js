const { Msg } = require('../utils/msgutils');
const { WebDav } = require('../lib/webdavAPI');
const _url = require('url');
let webdav;
exports.ls = ls;
async function ls(path, event) {
    let data = await webdav.ls(path);
    if (!path.endsWith('/')) {//处理文件情况
        let prop = data['multistatus']['response']['propstat']['prop'];
        if (prop['resourcetype'] && (prop['resourcetype'].collection !== undefined)) throw new Error('Your request is not formatted');
        return Msg.file({
            type: 0,
            name: prop['displayname'] || /([^/]*)\/?$/.exec(data['multistatus']['response'].href)[1],
            size: prop['getcontentlength'] || 0,
            mime: prop['getcontenttype'],
            time: new Date(prop['getlastmodified']).toISOString()
        }, event.splitPath.ph + _url.parse(event.url).pathname + '?download');
    }
    let list = [];
    if (!Array.isArray(data['multistatus']['response'])) return Msg.list([]);
    data['multistatus']['response'].forEach((e) => {
        let prop = e['propstat']['prop'];
        let file = {
            type: 0,
            name: prop['displayname'] || /([^/]*)\/?$/.exec(e.href)[1],
            size: prop['getcontentlength'] || 0,
            mime: prop['getcontenttype'],
            time: new Date(prop['getlastmodified']).toISOString()
        };
        if (prop['resourcetype'] && (prop['resourcetype'].collection !== undefined)) {
            file.type = 1;
            file.mime = "";
        }
        list.push(file);
    });
    console.log(list);
    console.log(list.shift());
    return Msg.list(list);
}

exports.func = async (spConfig, cache, event) => {
    //@info testing;
    if (!spConfig.auth) spConfig.auth = "basic " + Buffer.from(spConfig.userid + ":" + spConfig.password).toString('base64');
    webdav = new WebDav(spConfig.url, spConfig.auth);
    let root = spConfig.root || '';
    let p2 = root + event.p2;
    switch (event.cmd) {
        case 'ls'://文件 在api类型请求，或preview预览时返回下载链接，其他情况直接返回文件内容。
            return await ls(p2, event);
        case 'download':
            let headers = {};
            if (event.headers.range) headers.Range = event.headers.range;
            let res = await webdav.download(p2, headers);
            return Msg.html(res.status, res.data, res.headers)
        default:
            return Msg.info(400, "No such cmd");
    }
}