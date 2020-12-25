const { mime } = require('../utils/node');
const logger = require('../utils/logger');
const { PAGE_SIZE } = require('../conf/sys-config');
const fs = require('fs');
const _path = require('path');

const PAGE = PAGE_SIZE * 4;

module.exports = {
    params: [{ name: 'root', desc: '', value: '', level: 5, placeholder: 'root path' }],
    format(config) {
        if (!config.root) {
            config.root = '';
        } else if (config.root.endsWith('/')) {
            config.root = config.root.slice(0, -1);
        }
    },
    commands: ['ls', 'download'],
    async init(config, data, _, ctx) {
        data.path = config.root + data.path;
        ctx.assert(fs.existsSync(data.path), 404, 'ItemNotExist');
    },
    async ls(_, { path, page }, _1, ctx) {
        const stats = fs.statSync(path);
        if (stats.isDirectory()) {
            if (!path.endsWith('/')) {
                path += '/';
            } // 可
            page = Number(page) || 0;
            const list = await Promise.all(
                fs.readdirSync(path).map(
                    (fileName) =>
                        new Promise((resolve) => {
                            fs.stat(path + fileName, (err, st) => {
                                if (err) {
                                    logger.warn(path + ':' + fileName + ', ' + err.message);
                                    resolve(null);
                                } else {
                                    resolve({
                                        type: st.isFile() ? 0 : 1,
                                        name: fileName,
                                        size: st.isDirectory() && process.platform === 'win32' ? null : st.size,
                                        mime: st.isFIFO() ? mime.get(fileName) : '',
                                        time: new Date(st.mtime).toISOString(),
                                    });
                                }
                            });
                        })
                )
            );
            ctx.respondList(list.filter((e) => e).slice(page * PAGE, page * PAGE + PAGE), page * PAGE + PAGE < list.length ? page + 1 : null);
        } else if (stats.isFile()) {
            if (path.endsWith('/')) {
                path = path.slice(0, -1);
            }
            ctx.respondOne({
                type: 0,
                name: _path.basename(path),
                size: stats.size,
                mime: mime.get(path),
                time: new Date(stats.mtime).toISOString(),
                url: ctx.resolvePathDown(path),
            });
        } else {
            ctx.throw(403, 'NotAFile', { name: _path.basename(path) });
        }
    },
    async download(_, { path }, _1, ctx) {
        const stats = fs.statSync(path);
        ctx.assert(stats.isFile(), 403, 'NotDownloadable', { name: _path.basename(path) });
        const size = stats.size;

        const h = {};
        h['Content-Type'] = mime.get(path);
        h['Accept-Ranges'] = 'bytes';
        h['Content-Disposition'] = 'attachment; filename=' + encodeURIComponent(_path.basename(path));

        const range = ctx.request.headers.range;
        if (range) {
            const r = range.slice('bytes='.length).split('-');
            const start = Number(r[0]) || 0;
            const end = Number(r[1]) || size - 1;
            ctx.assert(start <= end && end < size, 400, 'InvalidRange', { range, size });
            h['Content-Length'] = end - start + 1;
            h['Content-Range'] = `bytes ${start}-${end}/${size}`;
            ctx.respondStream(206, h, () => fs.createReadStream(path, { start, end }));
        } else {
            h['Content-Length'] = size;
            ctx.respondStream(200, h, () => fs.createReadStream(path));
        }
    },
};
