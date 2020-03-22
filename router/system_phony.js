const { Msg } = require('../utils/msgutils');
const { getmime } = require('../utils/nodeutils');

let list;
exports.ls = ls;
async function ls(p2) {
    let p = /^\/([^/]+)?$/.exec(p2);
    if (!p) return Msg.info(404, 'Nothing:Just For Mount |-_-');
    if (!p[1]) {//folder
        return Msg.list(list.map((e) => { return genFileInfo(e); }));
    }
    let e = list.find((e) => { return typeof e === 'string' ? e.endsWith(p[1]) : e.n.endsWith(p[1]); });
    return e ? Msg.file(genFileInfo(e), getFileUrl(e)) : Msg.info(404);
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

function genFileInfo(e) {

    return typeof e === 'string' ? {
        type: 0,
        name: e.slice(e.lastIndexOf('/') + 1) || 'unknown',
        size: 1,
        mime: getmime(e),
        time: new Date().toISOString()
    } : {
            type: 0,
            name: e.n,
            size: 1,
            mime: getmime(e.n),
            time: new Date().toISOString()
        };
}

function getFileUrl(e) {
    return typeof e === 'string' ? encodeURI(e) : encodeURI(e.u);
}