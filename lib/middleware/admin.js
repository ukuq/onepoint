const logger = require('../utils/logger');
const sysConfig = require('../conf/sys-config');
const op = require('../core/op');
const SimpleRouter = require('../utils/simple-router');

const { PAGE_PREFIX, PAGE_SIZE, PATH_API, PATH_ADMIN, PATH_DOWN, ADMIN_TOKEN_SALT } = sysConfig;

const api_router = new SimpleRouter();
api_router.setDefault((ctx) => {
    ctx.throw(400, 'UnsupportedAPI', { path: ctx.request.path });
});

// 读写基本配置
api_router.get('sys/config', async (ctx) => {
    const p = op.starter.params.concat(sysConfig.commonSParams);
    const j = {
        config: p.reduce((o, e) => {
            o[e.name] = op.config[e.name];
            return o;
        }, {}),
        params: p,
    };
    ctx.respondJson(200, {}, j);
});
api_router.post('sys/config', async (ctx) => {
    const p = op.starter.params.concat(sysConfig.commonSParams);
    const body = ctx.request.body;
    let flag = false;
    p.forEach((e) => {
        if (body[e.name]) {
            op.config[e.name] = body[e.name];
            flag = true;
        }
    });
    if (flag) {
        await op.saveConfig();
    }
    ctx.respond(200);
});

// 修改密码
api_router.post('sys/pass', async (ctx) => {
    const { user0, pass0, user, pass } = ctx.request.body;
    ctx.assert(user0 === op.config.admin_username && pass0 === op.config.admin_password, 400, 'InvalidUserAuth', { user: 'root' });
    op.config.admin_username = user || user0;
    op.config.admin_password = pass;
    await op.saveConfig();
    ctx.respond(200);
});

// 所有云盘信息
api_router.get('sys/drives', async (ctx) => {
    const drives = op.config.drive_map;
    const attributes = sysConfig.commonMParams.map((e) => e.name).filter((e) => e !== 'x_path');
    attributes.unshift('module');
    attributes.unshift('path');
    ctx.respondJson(
        200,
        {},
        {
            attributes,
            drives: Object.keys(drives).map((p) => {
                const j = {};
                attributes.forEach((e) => {
                    j[e] = drives[p][e];
                });
                j.path = p;
                return j;
            }),
        }
    );
});

// 云盘管理
api_router.get('sys/drive-add', (ctx) => {
    const j = {
        params: {},
        modules: Object.keys(op.modules),
    };
    const driveModules = op.modules;
    Object.keys(driveModules).forEach((m) => {
        j.params[m] = driveModules[m].params.concat(sysConfig.commonMParams);
    });
    ctx.respondJson(200, {}, j);
});
api_router.get('sys/drive', async (ctx) => {
    const path = ctx.request.query.path;
    const c = op.config.drive_map[path];
    ctx.assert(c, 400, 'InvalidDrivePath', { path });
    const mod = op.modules[c.module];
    ctx.assert(mod, 400, 'InvalidModule', { module: c.module });
    ctx.respondJson(
        200,
        {},
        {
            path,
            drive: op.config.drive_map[path],
            params: mod.params.concat(sysConfig.commonMParams),
        }
    );
});
api_router.post('sys/drive', async (ctx) => {
    const body = ctx.request.body;
    const m = body.module;
    const mod = op.modules[m];
    ctx.assert(mod, 400, 'InvalidModule', { module: m });
    const conf = mod.params
        .concat(sysConfig.commonMParams)
        .map((e) => e.name)
        .reduce((o, n) => {
            o[n] = body[n];
            return o;
        }, {});
    conf.module = m;
    const p = conf.x_path || '/';
    delete conf.x_path;
    await mod.format(conf);
    op.config.drive_map[p] = conf;
    logger.info('install:' + m + ' ' + p);
    await op.saveConfig();
    await op.readConfig();
    ctx.respond(200, 'installed:' + m + ' ' + p);
});
api_router.delete('sys/drive', async (ctx) => {
    const path = ctx.request.query.path;
    const c = op.config.drive_map[path];
    ctx.assert(c, 400, 'InvalidDrivePath', { path });
    const mod = op.modules[c.module];
    ctx.assert(mod, 400, 'InvalidModule', { module: c.module });
    logger.info('drop drive:' + c + ' ' + path);
    delete op.config.drive_map[path];
    await op.saveConfig();
    await op.readConfig();
    ctx.respond(200);
});

api_router.get('sys/runtime', async (ctx) => {
    ctx.respondJson(200, {}, { runtime: op.runtime });
});

api_router.prefix('file:', async (ctx, next, path) => {
    const m = ctx.request.method;
    const $data = (ctx.$data = {});
    ctx.assert(path, 400, 'InvalidRequestParam', { expect: ['path'] });
    if (m === 'GET') {
        $data.command = 'ls';
        checkAndSetPage(ctx);
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
            $data.path2 = b.path2.slice(op.deepestNode(b.path2).$path.length - 1);
        } else {
            ctx.throw(400, 'InvalidRequestParam', { expect: ['command'] });
        }
    }
    op.parsePathBeforeInvoke(ctx, path);
    await next();
});

const router = new SimpleRouter();

router.prefix(PATH_ADMIN, async (ctx, _, path) => {
    const { method, body } = ctx.request;
    if (path === 'login-token') {
        ctx.assert(body && op.config && body.username === op.config.admin_username && body.password === op.config.admin_password, 401, 'InvalidUserAuth', { user: 'root' });
        const token = op.sign(ADMIN_TOKEN_SALT, 1);
        ctx.respondJson(200, {}, { token });
        ctx.response.addCookie('admin-token', token, { path: '/' });
        return;
    }
    if (path === 'login') {
        if (method === 'GET') {
            ctx.respondRaw(200, {}, `<form method="post"><input name="username"><input name="password"><input type="submit"></form>`);
            return;
        }
        ctx.assert(body && op.config && body.username === op.config.admin_username && body.password === op.config.admin_password, 401, 'invalid user or pass');
        ctx.respond(200);
        ctx.response.addCookie('admin-token', op.sign(ADMIN_TOKEN_SALT, 1), { path: '/' });
        return;
    }
    if (path === '') {
        ctx.respondRaw(200, {}, sysConfig.getAdminHtml(ctx.request.baseURL));
    } else {
        ctx.assert(ctx.state.level > 0, 401, 'Unauthorized', { field: 'admin-token', type: 'login please' });
    }
});
router.prefix(PATH_API, async (ctx, next, path) => {
    ctx.assert(ctx.state.level > 0, 401, 'UnauthorizedToken', { token: null });
    await api_router.handle(ctx, next, path);
});
router.prefix(PATH_DOWN, async (ctx, next, path) => {
    ctx.$data = { command: 'download' };
    op.parsePathBeforeInvoke(ctx, path);
    await next();
});
router.setDefault(async (ctx, next) => {
    ctx.state.isPlainPath = ctx.request.headers.accept !== 'application/json';
    ctx.$data = { command: 'ls', useCache: true };
    checkAndSetPage(ctx);
    op.parsePathBeforeInvoke(ctx, ctx.request.path);
    await next();
});

module.exports = async (ctx, next) => {
    const { cookies, path, headers } = ctx.request;

    if (op.status === -1) {
        await op.readConfig();
    }

    const token = cookies['admin-token'] || headers['x-token'];
    if (token) {
        if (op.verify(ADMIN_TOKEN_SALT, token)) {
            ctx.state.level = 1;
        } else {
            if (cookies['admin-token']) {
                ctx.response.addCookie('admin-token', '', { path: '/' });
            }
            ctx.throw(401, 'UnauthorizedToken', { token: token });
        }
    }

    await router.handle(ctx, next, path);

    if (ctx.response.isFile && ctx.state.isPlainPath && ctx.request.query.preview === undefined) {
        ctx.respondRaw(302, { Location: ctx.response.data.file.url }, '');
    } else if (ctx.response.isList && ctx.$data.useCache) {
        ctx.response.data.list.sort((e1, e2) => e2.type - e1.type || e1.name.localeCompare(e2.name));

        // page
        if (!ctx.$data.page && !ctx.response.data.nextToken && ctx.response.data.list.length > PAGE_SIZE) {
            const len = ctx.response.data.list.length;
            const page = ctx.state.page || 1;
            ctx.response.data.list = ctx.response.data.list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
            if (page > 1) {
                ctx.response.data.prevToken = page - 1;
            }
            if (len > page * PAGE_SIZE) {
                ctx.response.data.nextToken = page + 1;
            }
        }
    }
};

function checkAndSetPage(ctx) {
    const page = ctx.request.query.page;
    if (page) {
        if (page.startsWith(PAGE_PREFIX)) {
            ctx.$data.page = page.slice(PAGE_PREFIX.length);
        } else {
            ctx.state.page = Number(ctx.request.query.page);
        }
    }
}
