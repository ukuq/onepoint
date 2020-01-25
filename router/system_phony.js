const { Msg, formatDate } = require('../utils/msgutils');
const { mime } = require('../utils/nodeutils');

let mconfig;
exports.ls = ls;
async function ls(p2) {
    let fileName;
    if (!p2.endsWith('/')) {
        fileName = p2.slice(p2.lastIndexOf('/') + 1);
        p2 = p2.slice(0, p2.lastIndexOf('/') + 1);
    }
    if (p2 !== '/') return Msg.info(404, 'Nothing:Just For Mount |-_-');
    let content = [];
    if (mconfig.list) {
        if (!fileName) {
            mconfig.list.forEach((e) => {
                content.push(genInfoByUrl(e));
            });
        } else {
            let url = mconfig.list.find((e) => { return e.endsWith(fileName); });
            if (url) {
                return Msg.file(genInfoByUrl(url), url);
            } else return Msg.info(404);
        }
    }
    return Msg.list(content);

}
exports.func = async (spConfig, cache, event) => {
    mconfig = spConfig;
    let p2 = event.splitPath.p2;
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
        time: formatDate(new Date())
    }
}