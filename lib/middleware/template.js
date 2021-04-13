const logger = require('../utils/logger');
const op = require('../core/op');
const V = require('../utils/view-helper');
const { RTError } = require('../utils/node');

module.exports = async (ctx, next) => {
    await next().catch((err) => {
        if (err instanceof RTError) {
            logger.log('request error:' + err.type);
            ctx.respond(err.status, { error: err.type, data: err.data, message: err.message });
        } else {
            logger.error(err.stack);
            ctx.respond(400, { error: 'UnknownError', data: {}, message: err.message });
        }
    });

    if (ctx.response.isRaw) {
        return;
    }

    // 解决缓存引起的 多baseURL下 url不变的问题
    if (ctx.response.isFile && !ctx.response.data.file.url) {
        ctx.response.data.file = Object.assign({}, ctx.response.data.file, { url: ctx.request.baseURL + encodeURI(ctx.state.p1 + ctx.state.p2) });
    }

    if (ctx.state.html && ctx.request.query.json === undefined) {
        if (ctx.response.isFile) {
            if (ctx.request.query.preview === undefined) {
                if (ctx.response.down) {
                    ctx.response.callback_down = ctx.response.down;
                } else {
                    ctx.redirect(ctx.response.data.file.url);
                }
                return;
            }
        }

        const theme = op.themes[op.config.site.theme] || op.themes['w.w.art'];
        ctx.$V = new V(ctx);
        ctx.response.body = theme.render(ctx);
    } else {
        ctx.response.headers['content-type'] = 'application/json';
        ctx.response.body = JSON.stringify(ctx.response.data);
    }
};
