const { fs, getmime, path } = require("../utils/nodeutils");
const { Msg } = require('../utils/msgutils');

exports.ls = ls;
function ls(p2) {
    return new Promise((resolve) => {
        fs.stat(p2, (err, stats) => {
            if (err) return resolve(Msg.info(403, err.message));
            if (stats.isDirectory()) {
                console.log("查看" + p2 + "目录");
                fs.readdir(p2, (err, files) => {
                    if (err) return resolve(Msg.info(403, err.message));
                    let len = files.length;
                    console.log('total: ' + len);
                    if (len === 0) return resolve(Msg.list([]));
                    let list = [];
                    files.forEach((file) => {
                        fs.stat(path.resolve(p2, file), (err, st) => {
                            if (err) {
                                console.log(p2 + ":" + err.message);
                                len--;
                                if (list.length === len) resolve(Msg.list(list));
                                return;
                            }
                            let nodeData = {
                                type: 0,
                                name: file,
                                size: st.size,
                                mime: getmime(file),
                                time: new Date(st.mtime).toISOString()
                            };
                            if (st.isDirectory()) {
                                nodeData.type = 1;
                                nodeData.mime = ''
                            }
                            list.push(nodeData);
                            if (list.length === len) return resolve(Msg.list(list));
                        });
                    });
                });
            } else if (stats.isFile()) {
                return resolve(Msg.file({
                    type: 0,
                    name: p2.slice(p2.lastIndexOf('/') + 1),
                    size: stats.size,
                    mime: getmime(p2),
                    time: new Date(stats.mtime).toISOString()
                }, 'none://'));
            } else {
                return resolve(Msg.info(403, "403 设备文件"));
            }
        });
    });
}

exports.mkdir = mkdir;
function mkdir(path, name) {
    return new Promise((resolve, reject) => {
        fs.mkdir(path + name, (err) => {
            if (err) reject(err);
            else resolve(Msg.info(201));
        });
    });
}

exports.func = async (spConfig, cache, event) => {
    if (!['node', 'scf', 'now'].includes(event.adapter))
        return Msg.info(500, "No such adapter: " + event.adapter);
    let root = spConfig.root || '';
    let p2 = root + event.p2;
    switch (event.cmd) {
        case 'ls':
            return await ls(p2);
        case 'mkdir':
            return await mkdir(p2, event.cmdData.name);
        default:
            return Msg.info(400, "No such cmd");
    }
}

