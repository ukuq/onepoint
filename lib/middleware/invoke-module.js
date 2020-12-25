const logger = require('../utils/logger');

module.exports = async (ctx) => {
    const node = ctx.$node;
    const cmd = ctx.$data.command;
    ctx.$data.path = ctx.state.p2;
    if (node.$module) {
        logger.log('use: ' + node.$config.module + ', drivePath:' + ctx.state.p1);
        ctx.assert(node.$module.commands.includes(cmd), 403, 'CommandNotExist', { command: cmd });
        try {
            await node.$module.init(ctx.$node.$config, ctx.$data, ctx.$node.$cache, ctx);
            await node.$module[cmd](ctx.$node.$config, ctx.$data, ctx.$node.$cache, ctx);
        } catch (err) {
            if (node.$module.error) {
                await node.$module.error(err, ctx);
            } else {
                throw err;
            }
        }
    } else {
        ctx.assert(cmd === 'ls', 403, 'CommandNotExist', { command: cmd });
        ctx.assert(ctx.state.p2 === '/', 404, 'ItemNotExist', { path: ctx.state.p1 + ctx.state.p2 });
        ctx.respondList([]);
    }

    if (ctx.response.isList) {
        const list = ctx.response.data.list;
        if (ctx.state.p2 === '/') {
            Object.keys(node.next).forEach((e) =>
                list.push({
                    type: 3,
                    name: e,
                    size: null,
                    mime: '',
                    time: new Date().toISOString(),
                })
            );
        }
    }
};
