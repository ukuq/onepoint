const logger = require('../utils/logger');
const { cookie, querystring } = require('../utils/node');
const op = require('../core/op');

module.exports = async (ctx, next) => {
    const { method, path, query, headers } = ctx.request;
    logger.log(method + ' ' + path + ' ' + querystring.stringify(query));
    ctx.op = op;
    // OPTIONS method for CORS
    if (method === 'OPTIONS' && headers['access-control-request-headers']) {
        // @Todo origin检查
        ctx.respondRaw(
            204,
            {
                'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Content-Range,X-Token',
                'Access-Control-Max-Age': '86400',
                'Access-Control-Allow-Origin': headers.origin || '*',
            },
            ''
        );
        return;
    }

    if (path === '/favicon.ico') {
        ctx.respondRaw(301, { Location: op.config.site_logo }, 'logo:' + op.config.site_logo);
        return;
    }
    await next().catch((err) => {
        if (err.expose) {
            logger.log('request error:' + err.message);
        } else {
            logger.error(err.stack);
        }
        ctx.respond(err.expose ? err.status : 400, { error: err.message, data: err.expose ? err.data : {} });
    });

    if (!ctx.response.isRaw && !ctx.state.isPlainPath) {
        ctx.respondJson(ctx.response.status, ctx.response.headers, ctx.response.data);
    }

    const cookies = [];
    const p0 = /\/\/[^/]+(?<p0>.+)/.exec(ctx.request.baseURL).groups.p0;
    if (p0) {
        ctx.response.cookies.forEach((e) => {
            const path = e.options.path;
            if (path) {
                e.options.path = p0 + path;
            }
        });
    }
    ctx.response.cookies.forEach((e) => {
        cookies.push(cookie.serialize(e.name, e.value, e.options));
    });
    ctx.response.headers['Set-Cookie'] = cookies;
    // allow * temporarily
    ctx.response.headers['Access-Control-Allow-Origin'] = '*';
};
