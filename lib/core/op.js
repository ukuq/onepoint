const { md5 } = require('../utils/node');
const sysConfig = require('../conf/sys-config');
const logger = require('../utils/logger');

module.exports = {
    modules: sysConfig.modules,
    themes: sysConfig.themes,
    handleRequest: null,
    initialize(starter) {
        this.runtime = {
            time_start: Date.now(),
            time_read: null,
            time_save: null,
            error_read: null,
            error_write: null,
        };
        this.starter = starter;
        this.status = -1;
        this.config = JSON.parse(JSON.stringify(sysConfig.configTemplate));
        this.root = { $config: {}, $path: '/', next: {}, $cache: {} };
    },
    async readConfig() {
        logger.debug('read config...');
        this.runtime.time_read = Date.now();
        this.runtime.error_read = null;
        const _config = await this.starter.readConfig().catch((e) => {
            this.runtime.error_read = e;
            logger.warn('save config... err:' + this.runtime.time_read);
            logger.warn(e);
            return {};
        });
        const config = JSON.parse(JSON.stringify(sysConfig.configTemplate));
        Object.keys(_config || {}).forEach((k) => {
            config[k] = _config[k];
        });

        const root = { $config: {}, $path: '/', next: {}, $cache: {} };

        await Promise.all(
            Object.keys(config.drive_map)
                .map((e) => {
                    const driveConfig = config.drive_map[e];
                    const driveModule = this.modules[driveConfig.module];
                    if (driveModule) {
                        let p = root;
                        for (const i of e.split('/').filter((e) => e)) {
                            if (!p.next[i]) {
                                p.next[i] = { $config: {}, $path: p.$path + i + '/', next: {}, $cache: {} };
                            }
                            p = p.next[i];
                        }
                        p.$config = driveConfig;
                        p.$module = driveModule;
                        return driveModule.format(driveConfig);
                    } else {
                        logger.warn('no such module: ' + e + ' ' + driveConfig.module);
                        return Promise.resolve();
                    }
                })
                .filter((e) => !!e)
        );

        this.root = root;
        this.config = config;
        this.status = 0;
        logger.debug('read config... ok');
    },

    async saveConfig() {
        logger.debug('save config...');
        const attributeSortedObj = function (ob) {
            if (Array.isArray(ob)) {
                return ob.map((e) => attributeSortedObj(e));
            }
            if (typeof ob === 'string' || typeof ob === 'number' || typeof ob === 'boolean') {
                return ob;
            }
            const nob = {};
            Object.keys(ob)
                .sort()
                .forEach((k) => {
                    nob[k] = typeof ob[k] === 'object' ? attributeSortedObj(ob[k]) : ob[k];
                });
            return nob;
        };
        this.runtime.time_save = Date.now();
        this.runtime.error_write = null;
        await this.starter.writeConfig(attributeSortedObj(this.config)).catch((err) => {
            this.runtime.error_write = err;
            logger.error('save config... err:' + this.runtime.time_save);
            throw err;
        });
        logger.debug('save config... ok');
    },

    sign(text, day = 3) {
        const phrase = this.config.admin_username + ':' + this.config.admin_password;
        const time = (Date.now() / 1000 / 3600 / 24 + day).toFixed();
        return time + md5(phrase + time + text);
    },
    verify(text, sign) {
        const phrase = this.config.admin_username + ':' + this.config.admin_password;
        const time = Number(sign.slice(0, 5));
        return time * 1000 * 3600 * 24 > Date.now() && sign.slice(5) === md5(phrase + time + text);
    },

    deepestNode(path) {
        let p = this.root;
        for (const i of path.split('/').filter((e) => e)) {
            if (p.next[i]) {
                p = p.next[i];
            } else {
                return p;
            }
        }
        return p;
    },

    // 设置p1 p2 $node, 调用模块前必须调用此函数以确认调用哪一个
    parsePathBeforeInvoke(ctx, path) {
        const node = this.deepestNode(path);
        const p1 = node.$path.slice(0, -1);
        ctx.assert(path.startsWith(p1), 400, 'InvalidRequestPath', { path, format: p1 + '**' });
        const p2 = path.slice(node.$path.length - 1) || '/';
        ctx.assert(!p2.includes(':') && !p2.includes('?') && !p2.includes('\\') && !p2.includes('//'), 400, 'InvalidRequestPath', { path, format: '[^:?\\]*' });
        ctx.$node = node;
        ctx.state.p1 = p1;
        ctx.state.p2 = p2;
    },
};
