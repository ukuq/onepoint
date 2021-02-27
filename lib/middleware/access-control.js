const logger = require('../utils/logger');
const op = require('../core/op');
const { AC_PASS_FILE } = require('../conf/sys-config');

/**
 * @errors [Unauthorized,ItemNotExist]
 */
module.exports = async (ctx, next) => {
    const { hidden, password } = ctx.$node.$config;
    if (ctx.state.level === 0) {
        // hidden file
        if (hidden && hidden.length > 0) {
            ctx.assert(!hidden.find((e) => ctx.state.p2.startsWith(e)), 404, 'ItemNotExist', { path: ctx.state.p1 + ctx.state.p2 });
        }
        // drive-pass
        if (password) {
            checkPass(ctx, 'drive_pass', password, ctx.state.p1 + '/');
        }
    }

    await next();

    if (ctx.state.level === 0 && ctx.response.isList) {
        // hidden list item
        if (hidden && hidden.length > 0) {
            const p2 = ctx.state.p2;
            const h = hidden.map((e) => (e.startsWith(p2) ? e.slice(p2.length) : null)).filter((e) => e && !e.includes('/'));
            if (h.length > 0) {
                ctx.response.data.list = ctx.response.data.list.filter((e) => !h.includes(e.name));
            }
        }

        // list-pass
        const o = ctx.response.data.list.reduce(
            (o, e) => {
                if (e.name.startsWith(AC_PASS_FILE)) {
                    o[0].push(e.name.slice(AC_PASS_FILE.length));
                } else {
                    o[1].push(e);
                }
                return o;
            },
            [[], []]
        );
        ctx.response.data.list = o[1];
        if (o[0].length > 0) {
            checkPass(ctx, 'list_pass', o[0], ctx.state.p1 + ctx.state.p2);
        }
    }
};

function checkPass(ctx, name, pass, path) {
    const { cookies, body, method, query } = ctx.request;

    let type = 'empty';
    const uname = name.toUpperCase();
    if (cookies[uname]) {
        type = 'expired';
        if (op.verify(uname + path, cookies[uname])) {
            logger.log('use cookie:' + cookies[uname]);
            return;
        }
    }

    if (method === 'POST' && (body[name] || body.password)) {
        type = 'wrong';
        // 可以使用通用字段password，也可以用对应的专用字段name
        const uPass = body[name] || body.password;
        if (uPass === pass || (Array.isArray(pass) && pass.includes(uPass))) {
            // 单个云盘登录
            logger.log('use pass:' + uPass);
            ctx.addCookie(uname, op.sign(uname + path, 24 * 31), { path, maxAge: 3600 * 24 * 30 });
            return;
        }
    }

    // 分享专用
    if (method === 'GET' && query[name]) {
        type = 'invalid';
        if (op.verify(uname + path, query[name])) {
            ctx.addCookie(uname, op.sign(uname + path, 24 * 31), { path, maxAge: 3600 * 24 * 30 });
            return;
        }
    }

    ctx.throw(401, 'Unauthorized', { field: name, type });
}
