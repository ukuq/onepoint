const logger = require('../utils/logger');
const sysConfig = require('../conf/sys-config');
const op = require('../core/op');
const SimpleRouter = require('../utils/simple-router');
const { beautifyObject } = require('../utils/node');

const { PATH_API, PATH_ADMIN, PATH_DOWN } = sysConfig;

const api_router = new SimpleRouter();
api_router.setDefault((ctx) => {
    ctx.throw(400, 'UnsupportedAPI', { path: ctx.request.path });
});

function equalsObj(a, b) {
    return JSON.stringify(beautifyObject(a)) === JSON.stringify(beautifyObject(b));
}

function paramsCopy(params, src) {
    if (!src) {
        return {};
    }
    const c = {};
    params.forEach(({ name }) => {
        if (src[name]) {
            c[name] = src[name];
        }
    });
    return c;
}

async function versionCheckAndLazySave(a, f, v, ctx) {
    if (equalsObj(a[0], a[1])) {
        logger.info('Nothing Changed, Lazy Save');
        ctx.respond(200, { message: 'Nothing Changed', version: op.config.version });
    } else {
        ctx.assert(v === op.config.version, 400, 'InvalidVersion', { version: op.config.version });
        f();
        ctx.respond(200, { message: await op.saveConfig(), version: op.config.version });
    }
}

// 读写基本配置
api_router.get('config/basic', async (ctx) => {
    ctx.respond(200, {
        basic: Object.assign({}, paramsCopy(sysConfig.commonSParams, op.config.site), paramsCopy(op.starter.params, op.config.starter)),
        params: op.params,
        version: op.config.version,
    });
});

api_router.post('config/basic', async (ctx) => {
    const { basic, version } = ctx.request.body;
    const c0 = paramsCopy(sysConfig.commonSParams, basic);
    const c1 = paramsCopy(op.starter.params, basic);
    await versionCheckAndLazySave(
        [
            [op.config.site, op.config.starter],
            [c0, c1],
        ],
        () => {
            op.config.site = c0;
            op.config.starter = c1;
        },
        version,
        ctx
    );
});

// 获取所有的云盘信息，增加乐观锁，弥补token不能识别多处登录的问题
api_router.get('config/drives', async (ctx) => {
    ctx.respond(200, {
        drives: op.config.drives,
        moduleParams: sysConfig.commonMParams,
        privateModuleParams: op.privateModuleParams,
        version: op.config.version,
    });
});

// 如果要删除一个盘，需要传递一个空值，否则不执行删除操作
api_router.post('config/drives', async (ctx) => {
    const copy = beautifyObject(op.config.drives);
    const { drives, version } = ctx.request.body;
    Object.entries(drives).forEach(([p, c]) => {
        if (!c) {
            delete copy[p];
        } else {
            copy[p] = paramsCopy(sysConfig.commonMParams, c);
            const m = op.modules[c.module];
            copy[p].config = m ? paramsCopy(typeof m.params === 'function' ? m.params() : m.params, c.config) : {};
        }
    });
    await versionCheckAndLazySave(
        [op.config.drives, copy],
        () => {
            op.config.drives = copy;
            op.loadConfig(op.config);
        },
        version,
        ctx
    );
});

api_router.post('config/export', async (ctx) => {
    const u = op.config.users[ctx.state.user];
    ctx.assert(ctx.request.body.password === u.password, 400, 'InvalidUserAuth', { user: ctx.state.user });
    ctx.respond(200, { config: op.config });
});

// 整体导入的配置 不再检验version的有效性
api_router.post('config/import', async (ctx) => {
    const u = op.config.users[ctx.state.user];
    const { config, password } = ctx.request.body;
    ctx.assert(password === u.password, 400, 'InvalidUserAuth', { user: ctx.state.user });
    await versionCheckAndLazySave(
        [op.config, config],
        () => {
            op.loadConfig(config);
        },
        op.config.version,
        ctx
    );
});

// 修改密码
api_router.post('user/password', async (ctx) => {
    const u = op.config.users[ctx.state.user];
    const { password0, password, version } = ctx.request.body;
    ctx.assert(password0 === u.password, 400, 'InvalidUserAuth', { user: ctx.state.user });
    await versionCheckAndLazySave(
        [u.password, password],
        () => {
            u.password = password0;
        },
        version,
        ctx
    );
});

api_router.get('system/runtime', async (ctx) => {
    ctx.respond(200, { runtime: op.runtime, version: op.config.version });
});

api_router.get('system/reload', async (ctx) => {
    op.config.version = -1;
    ctx.respond(200);
});

api_router.prefix('file:', async (ctx, next, path) => {
    const m = ctx.request.method;
    const b = ctx.request.body;
    const $data = (ctx.$data = {});
    b.path && (path = b.path);
    ctx.assert(path, 400, 'InvalidRequestParam', { expect: ['path'] });
    if (m === 'GET') {
        $data.command = 'ls';
    } else if (m === 'DELETE') {
        $data.command = 'rm';
    } else if (m === 'POST') {
        const c = ($data.command = b.command);
        if (c === 'mkdir' || c === 'ren' || c === 'touch' || c === 'upload') {
            ctx.assert(($data.name = b.name), 400, 'InvalidRequestParam', { expect: ['name'] });
            if (c === 'touch') {
                const { content, base64 } = b;
                ctx.assert(content !== undefined || base64, 400, 'InvalidRequestParam', { expect: ['content||base64'] });
                $data.mime = b.mime || 'text/plain';
                if (content) {
                    $data.content = Buffer.from(content, 'utf-8');
                } else if (base64) {
                    // base64
                    $data.content = Buffer.from(base64, 'base64');
                }
            }
        } else if (c === 'mv' || c === 'cp') {
            const { desPath } = b;
            ctx.assert(path !== desPath && op.deepestNode(path) === op.deepestNode(desPath), 400, 'InvalidRequestParam', { expect: ['desPath'] });
            $data.desPath = desPath.slice(op.deepestNode(desPath).$path.length - 1);
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
        ctx.respond(200, { token, version: op.config.version });
    } else if (path === 'public/site') {
        ctx.respond(200, {
            site: op.config.site,
            drives: Object.entries(op.config.drives).map(([path, { readme = '' }]) => ({ path, readme })),
            version: op.server.version,
            version2: op.server.version2,
        });
    } else {
        ctx.assert(ctx.state.level > 0, 401, 'UnauthorizedToken', { token: null });
        await api_router.handle(ctx, next, path);
    }
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
