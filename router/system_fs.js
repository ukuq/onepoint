const { fs, getmime, path } = require("../utils/nodeutils");
const { Msg, urlSpCharEncode } = require('../utils/msgutils');
const process = require('process');

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
                            } else {
                                let nodeData = {
                                    type: 0,
                                    name: fileName,
                                    size: st.size,
                                    mime: getmime(fileName),
                                    time: new Date(st.mtime).toISOString()
                                };
                                if (st.isDirectory()) {
                                    nodeData.type = 1;
                                    nodeData.mime = '';
                                    if (process.platform.startsWith('win')) nodeData.size = NaN;
                                }
                                list.push(nodeData);
                            }
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
                }));
            } else {
                return resolve(Msg.info(403, Msg.constants.Download_not_allowed));
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
    let root = spConfig.root || '';
    let p2 = root + event.p2;
    if (event.query.upload !== undefined) event.cmd = 'upload';
    switch (event.cmd) {
        case 'ls':
            return await ls(p2, event);
        case 'mkdir':
            return await mkdir(p2, event.cmdData.name);
        case 'download':
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
        case 'upload':
            //@experiment
            event.noRender = true;
            if (!event.isadmin) return Msg.info(403, Msg.constants.Permission_denied);
            if (fs.existsSync(p2)) return Msg.info(403, Msg.constants.File_already_exists);
            let p2_tmp = p2 + '___onepoint_tmp_file___';
            if (event.method === 'PUT') {
                let r = /(\d+)\-(\d+)\/(\d+)/.exec(event.headers['content-range']);
                if (!(r && r[1] && r[3] && Number(r[1]) < Number(r[3]))) return Msg.info(403, Msg.constants.Content_Range_is_invalid);
                r[1] = Number(r[1]);
                r[3] = Number(r[3]);
                if (fs.existsSync(p2_tmp)) {
                    let stat = fs.statSync(p2_tmp);
                    if (stat.size !== r[1]) return Msg.error(403, Msg.constants.Offset_is_invalid);
                }
                return new Promise((resolve) => {
                    let w = fs.createWriteStream(p2_tmp, { flags: 'as' });
                    w.on('close', () => {
                        let stat = fs.statSync(p2_tmp);
                        if (stat.size === r[3]) {
                            fs.renameSync(p2_tmp, p2);
                            resolve(Msg.info(201));
                        } else {
                            resolve(Msg.html_json(202, { "expirationDateTime": "2099-12-12T00:00:00.000Z", "nextExpectedRanges": [stat.size + "-"], "uploadUrl": event.splitPath.ph + event.splitPath.p0 + urlSpCharEncode(event.splitPath.p_12) + '?upload' }));
                        }
                    });
                    event.body.pipe(w);
                })
            } else {
                let offset = 0;
                if (fs.existsSync(p2_tmp)) {
                    let stat = fs.statSync(p2_tmp);
                    offset = stat.size;
                }
                return Msg.html_json(200, { "expirationDateTime": "2099-12-12T00:00:00.000Z", "nextExpectedRanges": [offset + "-"], "uploadUrl": event.splitPath.ph + event.splitPath.p0 + urlSpCharEncode(event.splitPath.p_12.startsWith('/api') ? event.cmdData.path : event.splitPath.p_12) + '?upload' });
            }
        default:
            return Msg.info(400, Msg.constants.No_such_command);
    }
}

function parseHttpRange(str, size) {
    str = str || '';
    str = str.split("=")[1] || "";
    let range = str.split("-"),
        start = Number(range[0]) || 0;
    end = Number(range[1]) || size - 1;
    if (start > end || end > size) { throw Msg.error(400, Msg.constants.Range_is_invalid) };
    return {
        start: start,
        end: end
    };
};