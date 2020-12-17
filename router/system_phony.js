const { Msg, formatDate } = require('../utils/msgutils');
const { mime } = require('../utils/nodeutils');

exports.func = async (spConfig, cache, event) => {
    let p2 = event.splitPath.p2;
    let fileName;
    if (!p2.endsWith('/')) {
        fileName = p2.slice(p2.lastIndexOf('/') + 1);
        p2 = p2.slice(0, p2.lastIndexOf('/') + 1);
    }
    if (spConfig.list && spConfig.list[p2]) {
        if (!fileName) {
            let content = [];
            spConfig.list[p2].forEach((e) => {
                content.push(genInfoByUrl(e));
            });
            return Msg.list(content);
        } else {
            let url = spConfig.list[p2].find((e) => { return e.endsWith(fileName); });
            if (url) {
                return Msg.file(genInfoByUrl(url), url);
            }
        }
    }
    if (p2 === '/') return Msg.list([]);
    return Msg.info(404, 'Nothing:Just For Mount |-_-');
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