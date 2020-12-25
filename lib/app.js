const op = require('./core/op');
const app = require('./core/app');

const { modules, themes, LOAD_ART_TEMPLATE } = require('./conf/sys-config');

Object.keys(modules).forEach((k) => {
    modules[k] = require(`./routers/${k}`);
});

if (LOAD_ART_TEMPLATE) {
    require('art-template');
}

Object.keys(themes).forEach((k) => {
    if (themes[k] === '.art') {
        themes[k] = { type: themes[k], render: require(`./views/art/${k}.art`) };
    } else if (themes[k] === '.js') {
        themes[k] = require(`./views/art/${k}.js`);
    }
});

const header = require('./middleware/header');
const template = require('./middleware/template');
const cache = require('./middleware/cache');
const admin = require('./middleware/admin');
const accessControl = require('./middleware/access-control');
const invokeModule = require('./middleware/invoke-module');
const logger = require('./utils/logger');

// fake koa app
app.use(template);
app.use(header);
app.use(admin);
app.use(accessControl);
app.use(cache);
app.use(invokeModule);

module.exports = {
    initialize(starter) {
        op.initialize(starter);
    },
    async handleRequest(req) {
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
