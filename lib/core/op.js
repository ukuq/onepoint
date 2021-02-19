const {md5, NumberUtil} = require('../utils/node');
const sysConfig = require('../conf/sys-config');
const logger = require('../utils/logger');
const {RTError} = require("../utils/node");

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
        this.status = "?";
        this.config = this.perfectConfig();
        this.root = {$config: {}, $path: '/', next: {}, $cache: {}};
    },
    async readConfig() {
        logger.debug('read config...');
        this.runtime.time_read = Date.now();
        this.runtime.error_read = null;
        const config = this.perfectConfig(
            await this.starter.readConfig().then(c => {
                this.status = "ok";
                return c;
            }).catch((e) => {
                this.status = "NoConfiguration";
                this.runtime.error_read = e;
                logger.warn('read config... err:' + this.runtime.time_read);
                logger.warn(e);
                return {};
            })
        );
        const root = {$config: {}, $path: '/', next: {}, $cache: {}};
        for (const [path, c] of Object.entries(config.drives)) {
            const m = this.modules[c.module];
            if (m) {
                let p = root;
                for (const i of path.split('/').filter((e) => e)) {
                    if (!p.next[i]) {
                        p.next[i] = {$config: {}, $path: p.$path + i + '/', next: {}, $cache: {}};
                    }
                    p = p.next[i];
                }
                p.$config = c;
                p.$module = m;
            } else {
                logger.warn('no such module: ' + path + ' ' + c.module);
            }
        }

        this.root = root;
        this.config = config;
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
            throw new RTError(500, 'SaveError', {message: err.message});
        });
        logger.debug('save config... ok');
    },

    perfectConfig(config) {
        config = config || {};
        config.site = Object.assign({}, sysConfig.configTemplate, config.site);
        config.drives = config.drives || {};
        config.users = config.users || {admin: {password: 'admin'}};
        config.starter = config.starter || {};
        this.salt = config.salt || config.users.admin.password;
        return config;
    },

    async syncConfig() {
        await this.saveConfig();
        await this.readConfig();
    },

    sign(text, hours = 24, len = 16) {
        const time = NumberUtil.to62(Math.floor(Date.now() / 1000 / 3600 + hours));
        return time + md5(this.salt + time + text).slice(0, len - 4);
    },
    verify(text, sign, len = 16) {
        const time = NumberUtil.parse62(sign.slice(0, 4)) * 3600 * 1000;
        return time > Date.now() && sign.slice(4) === md5(this.salt + sign.slice(0, 4) + text).slice(0, len - 4);
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
        ctx.assert(path.startsWith(p1), 400, 'InvalidRequestPath', {path, format: p1 + '**'});
        const p2 = path.slice(node.$path.length - 1);
        ctx.assert(!p2.includes(':') && !p2.includes('?') && !p2.includes('\\') && !p2.includes('//'), 400, 'InvalidRequestPath', {
            path,
            format: '[^:?\\]*',
        });
        ctx.$node = node;
        ctx.state.p1 = p1;
        ctx.state.p2 = p2;
    },
};
