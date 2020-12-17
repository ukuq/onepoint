const { Msg, formatDate, urlSpCharEncode } = require('../utils/msgutils');
const { axios } = require('../utils/nodeutils');

let mconfig;

async function ls(path) {
    let data = (await axios.post(mconfig.cfurl + path, { "password": mconfig.password })).data;
    if (!data) return Msg.info(404);
    if (!data.files) {//文件
        if (data['size'] === undefined) return Msg.info(403, "请规范化文件夹路径");
        let fileinfo = {
            type: 0,
            name: data['name'],
            size: Number(data['size']),
            mime: data['mimeType'],
            time: formatDate(data['modifiedTime'])
        };
        return Msg.file(fileinfo, mconfig.cfurl + urlSpCharEncode(path));
    } else {//dir
        let rDatas = [];
        data.files.forEach(e => {
            let rData = {
                type: 0,
                name: e['name'],
                size: Number(e['size']),
                mime: e['mimeType'],
                time: formatDate(e['modifiedTime'])
            };
            if (e['mimeType'].endsWith('folder')) {
                rData.type = 1;
                rData.mime = 'folder/googledrive'
            }
            rDatas.push(rData);
        });
        return Msg.list(rDatas);
    }

}

exports.func = async (spConfig, cache, event) => {
    mconfig = spConfig;
    let p2 = (spConfig.root || '') + event.splitPath.p2;
    if (event.cmd === 'ls') return await ls(p2);
    return Msg.info(500, "No such cmd");
}