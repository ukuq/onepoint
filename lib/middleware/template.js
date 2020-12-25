const op = require('../core/op');

module.exports = async (ctx, next) => {
    const theme = op.themes[op.config.theme];

    await next();

    if (ctx.response.isRaw) {
        return;
    }

    if (theme.type === '.art') {
        ctx.JSON = JSON;
        ctx.encodeURIComponent = encodeURIComponent;
    }
    ctx.response.body = theme.render(ctx);
};
