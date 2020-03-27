const { fs, getmime, path } = require("../utils/nodeutils");
const { Msg } = require('../utils/msgutils');

exports.ls = ls;
function ls(p2) {
    return new Promise((resolve) => {
        fs.stat(p2, (err, stats) => {
            if (err) {
                if (err.code === 'ENOENT') return resolve(Msg.info(404));
                else return resolve(Msg.info(403, err.message));
            }
            if (stats.isDirectory()) {
                console.log("查看" + p2 + "目录");
                fs.readdir(p2, (err, files) => {
                    if (err) return resolve(Msg.info(403, err.message));
                    let len = files.length;
                    console.log('total: ' + len);
                    if (len === 0) return resolve(Msg.list([]));
                    let list = [];
                    files.forEach((fileName) => {
                        fs.stat(path.resolve(p2, fileName), (err, st) => {
                            if (err) {
                                console.log(p2 + ":" + err.message);
                                len--;
                                if (list.length === len) resolve(Msg.list(list));
                                return;
                            }
                            let nodeData = {
                                type: 0,
                                name: fileName,
                                size: st.size,
                                mime: getmime(fileName),
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
                }, '?download'));
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
            return await ls(p2, event);
        case 'mkdir':
            return await mkdir(p2, event.cmdData.name);
        case 'download':
            //@flag 暂不开放
            return Msg.html(403,"403 now");
            return new Promise((resolve) => {
                fs.stat(p2, (err, stats) => {
                    if (err) {
                        if (err.code === 'ENOENT') return resolve(Msg.info(404));
                        else return resolve(Msg.info(403, err.message));
                    }
                    if (stats.isFile()) {
                        let h = {};
                        h['Content-Length'] = stats.size;
                        h['Content-Type'] = getmime(p2);
                        h['x-type'] = 'stream';
                        if (event.headers.range) {
                            let range = parseHttpRange(event.headers.range, stats.size);
                            h['Content-Range'] = `bytes ${range.start}-${range.end}/${stats.size}`;
                            let d = fs.createReadStream(p2, {
                                "start": range.start,
                                "end": range.end
                            });
                            return resolve(Msg.html(206, d, h));
                        } else {
                            h['Accept-Ranges'] = 'bytes';
                            h['Content-Disposition'] = "attachment; filename=" + encodeURIComponent(p2.slice(p2.lastIndexOf('/') + 1));
                            return resolve(Msg.html(200, fs.createReadStream(p2), h));
                        };
                    } else {
                        return resolve(Msg.info(403));
                    }
                });
            });
        default:
            return Msg.info(400, "No such cmd");
    }
}

function parseHttpRange(str, size) {
    str = str || '';
    str = str.split("=")[1] || "";
    let range = str.split("-"),
        start = Number(range[0]) || 0;
    end = Number(range[1]) || size - 1;
    if (start > end || end > size) { throw new Error('http range is invalid') };
    return {
        start: start,
        end: end
    };
};
