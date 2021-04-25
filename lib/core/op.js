const { md5, NumberUtil } = require('../utils/node');
const sysConfig = require('../conf/sys-config');
const logger = require('../utils/logger');
const { RTError, beautifyObject } = require('../utils/node');
const packageInfo = require('../../package.json');
module.exports = {
    modules: {},
    themes: {},
    handleRequest: null,
    server: {
        version: packageInfo.version,
        version2: packageInfo.version2,
    },
    initialize(starter) {
        this.runtime = {
            time_start: Date.now(),
            time_read: null,
            time_save: null,
            error_read: null,
            error_write: null,
        };
        this.starter = starter;
        this.loadConfig({ version: -1 });
    },

    get params() {
        return (this.starter.params || []).concat(sysConfig.commonSParams);
    },

    get privateModuleParams() {
        return Object.entries(this.modules).reduce((o, [k, m]) => {
            o[k] = typeof m.params === 'function' ? m.params() : m.params || [];
            return o;
        }, {});
    },

    loadConfig(config) {
        config = config || {};
        config.site = Object.assign({}, sysConfig.configTemplate, config.site);
        config.drives = config.drives || {};
        config.users = config.users || { admin: { password: 'admin' } };
        config.starter = config.starter || {};
        config.version = config.version || 1;

        const root = { $config: {}, $path: '/', next: {}, $cache: {} };

        Object.entries(config.drives).forEach(([path, c]) => {
            const m = this.modules[c.module];
            if (m) {
                let p = root;
                for (const i of path.split('/').filter((e) => e)) {
                    if (!p.next[i]) {
                        p.next[i] = { $config: {}, $path: p.$path + i + '/', next: {}, $cache: {} };
                    }
                    p = p.next[i];
                }
                p.$config = c;
                p.$module = m;
            } else {
                logger.warn('no such module: ' + path + ' ' + c.module);
            }
        });

        this.root = root;
        this.config = config;
        this.salt = config.salt || config.users.admin.password;
    },

    async readConfig() {
        logger.debug('read config...');
        this.runtime.time_read = Date.now();
        this.runtime.error_read = null;
        this.loadConfig(
            await this.starter.readConfig().catch((e) => {
                this.runtime.error_read = e;
                logger.warn('read config... err:' + this.runtime.time_read);
                logger.warn(e);
                return {};
            })
        );
        logger.debug('read config... ok');
    },

    // @Todo 后续可以考虑使用version解决nowsh异步保存的问题
    async saveConfig(msg = '') {
        logger.debug('save config...');
        this.runtime.time_save = Date.now();
        this.runtime.last_save = msg;
        this.runtime.error_write = null;
        const copy = beautifyObject(this.config);
        copy.version = Date.now();
        await this.starter
            .writeConfig(copy)
            .then(() => {
                this.config.version = copy.version;
            })
            .catch((err) => {
                this.runtime.error_write = err;
                logger.error('save config... err:' + this.runtime.time_save);
                throw new RTError(500, 'SaveError', { message: err.message });
            });
        logger.debug('save config... ok');
        return 'success';
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
        ctx.assert(path.startsWith(p1), 400, 'InvalidRequestPath', { path, format: p1 + '**' });
        const p2 = path.slice(node.$path.length - 1);
        ctx.$node = node;
        ctx.state.p1 = p1;
        ctx.state.p2 = p2;
    },
};
