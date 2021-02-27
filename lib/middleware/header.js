const logger = require('../utils/logger');
const op = require('../core/op');

module.exports = async (ctx, next) => {
    const { method, path, query, headers, ip } = ctx.request;
    logger.log(method + ' ' + path + ' ' + new URLSearchParams(query).toString() + ' ' + ip);
    // OPTIONS method for CORS
    if (method === 'OPTIONS') {
        // @Todo origin检查
        ctx.respondRaw(
            204,
            {
                'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
                'access-control-allow-headers': 'content-type,content-range,x-token',
                'access-control-max-age': '86400',
                'access-control-allow-origin': headers.origin || '*',
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
        ctx.response.headers['access-control-allow-origin'] = '*';
    }
};

function checkCors(origin, cors) {
    if (!origin) {
        return true;
    }
    if (cors) {
        return cors.includes('*') || cors.includes(origin);
    } else {
        return false;
    }
}
