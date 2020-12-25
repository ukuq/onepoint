const logger = require('../utils/logger');
const op = require('../core/op');
module.exports = async (ctx, next) => {
    const { x_hidden, x_pass } = ctx.$node.$config;
    if (ctx.state.level === 0) {
        // hidden file
        if (x_hidden && x_hidden.length > 0) {
            ctx.assert(!x_hidden.find((e) => ctx.state.p2.startsWith(e)), 404, 'ItemNotExist', { path: ctx.state.p1 + ctx.state.p2 });
        }
        // drive-pass
        if (x_pass) {
            checkPass(ctx, 'drive-pass', x_pass, ctx.state.p1 + '/');
        }
    }

    await next();

    if (ctx.state.level === 0 && ctx.response.isList) {
        // hidden list item
        if (x_hidden && x_hidden.length > 0) {
            const p2 = ctx.state.p2;
            const h = x_hidden.map((e) => (e.startsWith(p2) ? e.slice(p2.length) : null)).filter((e) => e);
            ctx.response.data.list = ctx.response.data.list.filter((e) => !h.includes(e.name));
        }

        // list-pass
        const o = ctx.response.data.list.reduce(
            (o, e) => {
                if (e.name.startsWith('.password=')) {
                    o[0].push(e.name.slice(10));
                } else {
                    o[1].push(e);
                }
                return o;
            },
            [[], []]
        );
        ctx.response.data.list = o[1];
        if (o[0].length > 0) {
            checkPass(ctx, 'list-pass', o[0], ctx.state.p1 + ctx.state.p2);
        }
    }
};

function checkPass(ctx, name, pass, path) {
    const { cookies, body, method } = ctx.request;

    let type = 'password is needed';
    const uname = name.toUpperCase();
    if (cookies[uname]) {
        if (op.verify(path, cookies[uname])) {
            logger.log('use cookie:' + cookies[uname]);
            return;
        } else {
            type = 'cookie is invalid';
            ctx.response.addCookie(uname, '', { path, maxAge: 100 });
        }
    }

    if (method === 'POST') {
        const uPass = body[name] || body.password;
        if (uPass === pass || (Array.isArray(pass) && pass.includes(uPass))) {
            // 单个云盘登录
            logger.log('use pass:' + uPass);
            ctx.response.addCookie(uname, op.sign(path), { path, maxAge: 3600 });
            return;
        } else {
            // 密码错误
            type = 'password is wrong';
        }
    }
    ctx.throw(401, 'Unauthorized', { field: name, type });
}
