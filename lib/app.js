const op = require('./core/op');
const app = require('./core/app');

const { MODULES, THEMES } = require('./conf/sys-config');

const { modules, themes } = op;

MODULES.forEach((k) => {
    modules[k] = require(`./routers/${k}`);
});

THEMES.forEach((k) => {
    themes[k] = require(`./views/js/${k}`);
});

const header = require('./middleware/header');
const template = require('./middleware/template');
const admin = require('./middleware/admin');
const invokeModule = require('./middleware/invoke-module');
const logger = require('./utils/logger');

// fake koa app
app.use(header);
app.use(template);
app.use(admin);
app.use(require('./middleware/access-control'));
app.use(require('./middleware/page-control'));
app.use(require('./middleware/cache-control'));
app.use(invokeModule);

module.exports = {
    initialize(starter) {
        op.initialize(starter);
    },
    async handleRequest(req) {
        if (op.config.version === -1) {
            // ? 代表未加载设置，尝试加载，若加载失败自动使用默认配置
            await op.readConfig();
        }
        return app
            .handleRequest(req)
            .then(({ response }) => {
                if (typeof response.status !== 'number' || typeof response.headers !== 'object' || typeof response.body !== 'string') {
                    throw new Error('Internal Response Error');
                }
                return response;
            })
            .catch((err) => {
                // 这一步遇到的错误一般都是请求类错误 格式错误 无法解析之类的
                logger.error(err);
                return {
                    status: 500,
                    headers: {
                        'access-control-allow-origin': '*',
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify({ error: 'InternalError', message: err.message }),
                };
            });
    },
};
