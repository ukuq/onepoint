const logger = require('../utils/logger');
const sysConfig = require('../conf/sys-config');
const op = require('../core/op');
const SimpleRouter = require('../utils/simple-router');

const { PATH_API, PATH_ADMIN, PATH_DOWN } = sysConfig;

const api_router = new SimpleRouter();
api_router.setDefault((ctx) => {
    ctx.throw(400, 'UnsupportedAPI', { path: ctx.request.path });
});

// 读写基本配置
api_router.get('config', async (ctx) => {
    const con = {};
    let c = op.config.site;
    sysConfig.commonSParams.forEach(({ name }) => {
        con[name] = c[name];
    });
    c = op.config.starter;
    op.starter.params.forEach(({ name }) => {
        con[name] = c[name];
    });
    ctx.respond(200, { config: con, params: sysConfig.commonSParams.concat(op.starter.params) });
});

api_router.post('config', async (ctx) => {
    const c = ctx.request.body;
    let con = op.config.site;
    sysConfig.commonSParams.forEach(({ name }) => {
        con[name] = c[name];
    });
    con = op.config.starter;
    op.starter.params.forEach(({ name }) => {
        con[name] = c[name];
    });
    ctx.respond(200, await op.saveConfig());
});

api_router.post('config/export', async (ctx) => {
    const u = op.config.users[ctx.state.user];
    ctx.assert(ctx.request.body.password === u.password, 400, 'InvalidUserAuth', { user: ctx.state.user });
    ctx.respond(200, op.config);
});

// 修改密码
api_router.post('user/password', async (ctx) => {
    const u = op.config.users[ctx.state.user];
    ctx.assert(ctx.request.body.password0 === u.password, 400, 'InvalidUserAuth', { user: ctx.state.user });
    u.password = ctx.request.body.password;
    ctx.respond(200, await op.saveConfig());
});

// 所有云盘信息
api_router.get('drives', async (ctx) => {
    ctx.respond(200, {
        attributes: Object.values(sysConfig.commonMParams).map((e) => e.name),
        drives: Object.entries(op.config.drives).map(([path, c]) => {
            const con = {};
            sysConfig.commonMParams.forEach(({ name }) => {
                con[name] = c[name];
            });
            con.path = path;
            return con;
        }),
    });
});

// 获取单个云盘信息 或 获取添加云盘所需参数
api_router.get('drive', async (ctx) => {
    const path = ctx.request.query.path;
    if (!path) {
        ctx.respond(200, { params: sysConfig.commonMParams });
        return;
    }
    const c = op.config.drives[path];
    ctx.assert(c, 404, 'DriveNotExist', { path });
    const con = {};
    sysConfig.commonMParams.forEach(({ name }) => {
        con[name] = c[name];
    });
    con.path = path;
    ctx.respond(200, { drive: con, params: sysConfig.commonMParams });
});

// 增 改
api_router.post('drive', async (ctx) => {
    const c = ctx.request.body;
    const con = { config: {} };
    sysConfig.commonMParams.forEach(({ name }) => {
        con[name] = c[name];
    });
    const path = con.path;
    delete con.path;
    op.config.drives[path] = con;
    logger.info('install:' + path + ' ' + con.module);
    ctx.respond(200, await op.saveConfig());
    op.loadConfig(op.config);
});

// 删
api_router.delete('drive', async (ctx) => {
    const path = ctx.request.query.path;
    if (op.config.drives[path]) {
        delete op.config.drives[path];
        ctx.respond(200, await op.saveConfig());
        op.loadConfig(op.config);
    }
    ctx.respond(200);
});

api_router.add(['GET', 'POST'], 'drive/config', async (ctx) => {
    const path = ctx.request.query.path;
    const c = op.config.drives[path];
    const m = op.modules[c.module];
    ctx.assert(c, 404, 'DriveNotExist', { path });
    ctx.assert(m, 404, 'ModuleNotExist', { module: c.module });
    if (ctx.request.method === 'GET') {
        ctx.respond(200, {
            config: c.config,
            params: m.params(ctx),
        });
    } else if (ctx.request.method === 'POST') {
        const body = ctx.request.body;
        const con = {};
        const d = m.params(ctx);
        d.forEach(({ name }) => {
            con[name] = body[name];
        });
        c.config = con;
        logger.info('config:' + path + ' ' + c.module);
        ctx.respond(200, await op.saveConfig());
    }
});

api_router.get('sys/runtime', async (ctx) => {
    ctx.respond(200, { runtime: op.runtime });
});

api_router.get('system/reload', async (ctx) => {
    await op.readConfig();
    ctx.respond(200);
});

api_router.prefix('file:', async (ctx, next, path) => {
    const m = ctx.request.method;
    const $data = (ctx.$data = {});
    ctx.assert(path, 400, 'InvalidRequestParam', { expect: ['path'] });
    if (m === 'GET') {
        $data.command = 'ls';
    } else if (m === 'DELETE') {
        $data.command = 'rm';
    } else if (m === 'POST') {
        const b = ctx.request.body;
        const c = ($data.command = b.command);
        if (c === 'mkdir' || c === 'ren' || c === 'touch' || c === 'upload') {
            ctx.assert(($data.name = b.name), 400, 'InvalidRequestParam', { expect: ['name'] });
            if (c === 'touch') {
                ctx.assert(b.content !== undefined || b.base64 !== undefined, 400, 'InvalidRequestParam', { expect: ['content||base64'] });
                $data.mime = b.mime || 'text/plain';
                if (b.content) {
                    $data.content = Buffer.from(b.content, 'utf-8');
                } else if (b.base64) {
                    // base64
                    $data.content = Buffer.from(b.base64, 'base64');
                }
            }
        } else if (c === 'mv' || c === 'cp') {
            ctx.assert(path !== b.path2 && op.deepestNode(path) === op.deepestNode(b.path2), 400, 'InvalidRequestParam', { expect: ['path2'] });
            $data.desPath = b.path2.slice(op.deepestNode(b.path2).$path.length - 1);
        } else {
            ctx.throw(400, 'InvalidRequestParam', { expect: ['command'] });
        }
    }
    op.parsePathBeforeInvoke(ctx, path);
    await next();
});

const router = new SimpleRouter();

router.prefix(PATH_ADMIN, async (ctx, _, path) => {
    if (path === '') {
        ctx.respondRaw(200, {}, sysConfig.getAdminHtml(ctx.request.baseURL));
    } else {
        ctx.assert(ctx.state.level > 0, 401, 'Unauthorized', { field: 'admin-token', type: 'login please' });
    }
});
router.prefix(PATH_API, async (ctx, next, path) => {
    if (path === 'login') {
        const { username, password } = ctx.request.body;
        const u = op.config.users[username];
        ctx.assert(u && password && u.password === password, 400, 'InvalidUserAuth', { username });
        const token = username + '.' + op.sign('$' + username + '$', 24);
        ctx.addCookie('X_TOKEN', token, { path: '/' });
        ctx.respond(200, { token, flag: op.status });
        return;
    }
    ctx.assert(ctx.state.level > 0, 401, 'UnauthorizedToken', { token: null });
    await api_router.handle(ctx, next, path);
});
router.prefix(PATH_DOWN, async (ctx, next, path) => {
    ctx.$data = { command: 'download' };
    op.parsePathBeforeInvoke(ctx, path);
    await next();
});
router.setDefault(async (ctx, next) => {
    ctx.state.html = ctx.request.headers.accept !== 'application/json';
    ctx.state.useCache = ctx.request.query.refresh === undefined;
    ctx.$data = { command: 'ls' };
    op.parsePathBeforeInvoke(ctx, ctx.request.path);
    await next();
});

module.exports = async (ctx, next) => {
    const { cookies, path, headers } = ctx.request;
    const token = headers['x-token'] || cookies.X_TOKEN;
    if (token) {
        const t = token.split('.');
        if (t[0] && t[1] && op.verify('$' + t[0] + '$', t[1])) {
            ctx.state.user = t[0];
            ctx.state.level = 1;
        } else {
            ctx.addCookie('X_TOKEN', '', { path: '/' });
            ctx.throw(401, 'UnauthorizedToken', { token });
        }
    }
    await router.handle(ctx, next, path);
};
