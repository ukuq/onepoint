const logger = require('../utils/logger');
const op = require('../core/op');

module.exports = async (ctx, next) => {
    const {method, path, query, headers} = ctx.request;
    logger.log(method + ' ' + path + ' ' + new URLSearchParams(query).toString());
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
                'Access-Control-Expose-Headers': 'Set-Cookie,X-Cookie',
            },
            ''
        );
        return;
    }

    if (path === '/favicon.ico') {
        ctx.redirect(op.config.site.logo);
        ctx.response.status = 301;
        return;
    }

    await next();

    // allow * temporarily
    if (checkCors(headers.origin, op.config.site.cors)) {
        ctx.response.headers['Access-Control-Allow-Origin'] = '*';
    }
};

function checkCors(origin, cors) {
    if (!origin) {
        return true;
    }
    if (cors) {
        return cors.includes("*") || cors.includes(origin);
    } else {
        return false;
    }
}