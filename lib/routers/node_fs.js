const logger = require('../utils/logger');
const fs = require('fs');
const _path = require('path');
const { _P } = require('../utils/node');

const { PAGE_SIZE: PAGE } = require('../conf/sys-config');

module.exports = {
    params() {
        return [_P('root', '', '', 5, '', false, false)];
    },
    async handle(config, data, cache, ctx) {
        if (!cache.flag) {
            if (!config.root) {
                config.root = '';
            } else if (config.root.endsWith('/')) {
                config.root = config.root.slice(0, -1);
            }
            cache.flag = true;
        }
        data.path = config.root + data.path;
        ctx.assert(fs.existsSync(data.path), 404, 'ItemNotExist');
        return this.ls(data, cache, ctx);
    },
    async ls({ path, page }, _1, ctx) {
        const stats = fs.statSync(path);
        if (stats.isDirectory()) {
            if (!path.endsWith('/')) {
                ctx.respondOne({
                    type: 1,
                    name: _path.basename(path),
                    size: process.platform === 'win32' ? null : stats.size,
                    time: new Date(stats.mtime).toISOString(),
                });
                return;
            } // 可
            page = Number(page && page.slice(1)) || 0;
            const list = await Promise.all(
                fs.readdirSync(path).map(
                    (fileName) =>
                        new Promise((resolve) => {
                            fs.stat(path + fileName, (err, st) => {
                                if (err) {
                                    logger.warn(path + ':' + fileName + ', ' + err.message);
                                    resolve(null);
                                } else if (st.isDirectory()) {
                                    resolve({
                                        type: 1,
                                        name: fileName,
                                        size: process.platform === 'win32' ? null : st.size,
                                        time: new Date(st.mtime).toISOString(),
                                    });
                                } else if (st.isFile()) {
                                    resolve({
                                        type: 0,
                                        name: fileName,
                                        size: st.size,
                                        time: new Date(st.mtime).toISOString(),
                                    });
                                } else {
                                    resolve(null);
                                }
                            });
                        })
                )
            );
            ctx.respondList(list.filter((e) => e).slice(page * PAGE, page * PAGE + PAGE), page * PAGE + PAGE < list.length ? 'l' + (page + 1) : null);
        } else if (stats.isFile()) {
            ctx.assert(!path.endsWith('/'), 403, 'ItemIsFile');
            ctx.respondOne(
                {
                    type: 0,
                    name: _path.basename(path),
                    size: stats.size,
                    time: new Date(stats.mtime).toISOString(),
                },
                { url: 'file://' + path }
            );
        } else {
            ctx.throw(404, 'ItemNotExist');
        }
    },
};
