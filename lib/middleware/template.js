const logger = require('../utils/logger');
const op = require('../core/op');
const V = require('../utils/view-helper');

module.exports = async (ctx, next) => {
    await next().catch((err) => {
        if (err.expose) {
            logger.log('request error:' + err.message);
        } else {
            logger.error(err.stack);
        }
        ctx.respond(err.expose ? err.status : 400, { error: err.message, data: err.expose ? err.data : {} });
    });

    if (ctx.state.save) {
        await op.saveConfig();
    }

    if (ctx.response.isRaw) {
        return;
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

        const theme = op.themes[op.config.site.theme];

        if (theme.type === 'art') {
            ctx.JSON = JSON;
            ctx.encodeURIComponent = encodeURIComponent;
        }
        ctx.$V = new V(ctx);
        ctx.response.body = theme.render(ctx);
    } else {
        ctx.response.headers['Content-Type'] = 'application/json';
        ctx.response.body = JSON.stringify(ctx.response.data);
    }
};
