const { Msg } = require('../utils/msgutils');
const { mime } = require('../utils/nodeutils');

let list;
exports.ls = ls;
async function ls(p2) {
    let p = /^\/([^/]+)?$/.exec(p2);
    if (!p) return Msg.info(404, 'Nothing:Just For Mount |-_-');
    if (!p[1]) {//folder
        return Msg.list(list.map((e) => { return genInfoByUrl(e); }));
    }
    let url = list.find((e) => { return e.endsWith(p[1]); });
    return url ? Msg.file(genInfoByUrl(url), encodeURI(url)) : Msg.info(404);
}

exports.func = async (spConfig, cache, event) => {
    list = spConfig.list || [];
    let p2 = event.p2;
    switch (event.cmd) {
        case 'ls':
            return await ls(p2);
        default:
            return Msg.info(400, "No such cmd");
    }
}

function genInfoByUrl(url) {
    return {
        type: 0,
        name: url.slice(url.lastIndexOf('/') + 1) || 'unknown',
        size: 1,
        mime: mime.getType(url) || 'onepoint/unknown',
        time: new Date().toISOString()
    }
}