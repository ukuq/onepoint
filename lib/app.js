const op = require('./core/op');
const app = require('./core/app');

const { MODULES, THEMES, modules, themes, LOAD_ART_TEMPLATE } = require('./conf/sys-config');

MODULES.forEach((k) => {
    modules[k] = require(`./routers/${k}`);
});

if (LOAD_ART_TEMPLATE) {
    const template = require('art-template');
    template.defaults.debug = true;
}

THEMES.forEach((k) => {
    if (k.endsWith('.art')) {
        k = k.slice(0, -4);
        themes[k] = { type: 'art', render: require(`./views/art/${k}.art`) };
    } else if (k.endsWith('.js')) {
        k = k.slice(0, -3);
        themes[k] = require(`./views/js/${k}.js`);
    }
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
        if (op.status === -1) {
            await op.readConfig();
        }
        return await app
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
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ error: 'InternalError', message: err.message }),
                };
            });
    },
};
