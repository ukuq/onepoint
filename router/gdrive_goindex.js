const { Msg, urlSpCharEncode } = require('../utils/msgutils');
const { axios } = require('../utils/nodeutils');

let mconfig;

exports.ls = ls;
async function ls(path) {
    let data = (await axios.post(mconfig.cfurl + path, { "password": mconfig.password })).data;
    if (!data) return Msg.info(404);
    if (!data.files) {//文件
        if (data['size'] === undefined) throw new Error("请规范化文件夹路径");
        let fileinfo = {
            type: 0,
            name: data['name'],
            size: Number(data['size']),
            mime: data['mimeType'],
            time: data['modifiedTime']
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
                time: e['modifiedTime']
            };
            if (e['mimeType'].endsWith('folder')) {
                rData.type = 1;
                rData.mime = ''
            }
            rDatas.push(rData);
        });
        return Msg.list(rDatas);
    }

}

exports.func = async (spConfig, cache, event) => {
    mconfig = spConfig;
    let root = spConfig.root || '';
    let p2 = root + event.p2;
    switch (event.cmd) {
        case 'ls':
            return await ls(p2);
        default:
            return Msg.info(400, "No such cmd");
    }
}