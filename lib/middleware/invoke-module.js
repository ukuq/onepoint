const logger = require('../utils/logger');
const op = require('../core/op');
const { ID_SIGN_LEN } = require('../conf/sys-config');
const { mime } = require('../utils/node');

function signId(p2, id) {
    // 1-10年有效期, 纯粹是为了让生成的签名不那么一样
    return id + op.sign(p2 + id, Math.floor(Math.random() * 78840) + 8760, ID_SIGN_LEN);
}

function verifyId(p2, id, ctx) {
    if (id) {
        // verify id
        const oid = id.slice(0, id.length - ID_SIGN_LEN);
        if (oid && op.verify((p2.endsWith('/') ? p2.slice(0, -1) : p2) + oid, id.slice(id.length - ID_SIGN_LEN), ID_SIGN_LEN)) {
            ctx.$data.id = oid;
        } else {
            ctx.throw(403, 'InvalidId', { id });
        }
    }
}

/**
 * @errors [CommandNotAllowed,ItemNotExist,InvalidId]
 */
module.exports = async (ctx) => {
    const node = ctx.$node;
    const cmd = ctx.$data.command;
    const p2 = (ctx.$data.path = ctx.state.p2);
    if (p2 === '') {
        ctx.assert(cmd === 'ls', 403, 'CommandNotAllowed', { command: cmd });
        const p1 = ctx.state.p1;
        ctx.respondOne({
            type: 3,
            name: p1.slice(p1.lastIndexOf('/') + 1) || '$root',
            size: null,
            mime: '',
            time: new Date().toISOString(),
        });
    } else if (node.$module) {
        verifyId(p2, ctx.request.query.id, ctx);
        logger.log('use: ' + node.$config.module + ', drivePath:' + ctx.state.p1);
        ctx.assert(node.$module[cmd], 403, 'CommandNotAllowed', { command: cmd });
        await node.$module.handle(node.$config.config, ctx.$data, node.$cache, ctx);
    } else {
        ctx.assert(cmd === 'ls', 403, 'CommandNotAllowed', { command: cmd });
        ctx.assert(ctx.state.p2 === '/', 404, 'ItemNotExist', { path: ctx.state.p1 + ctx.state.p2 });
        ctx.respondList([]);
    }

    if (ctx.response.isList) {
        const list = ctx.response.data.list;
        list.forEach((e) => {
            if (e.id) {
                e.id = signId(p2 + e.name, e.id);
            }
            if (e.mime === undefined) {
                e.mime = e.type === 0 ? mime.get(e.name) : '';
            }
        });
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
        // sort
        list.sort((e1, e2) => e2.type - e1.type || e1.name.localeCompare(e2.name));
    } else if (ctx.response.isFile) {
        const e = ctx.response.data.file;
        if (e.id) {
            // 文档有要求,返回file时,必须为规范路径
            e.id = signId(p2, e.id);
        }
        // 简化模块代码重复度
        if (e.mime === undefined) {
            e.mime = mime.get(e.name);
        }
    } else if (ctx.response.isFolder) {
        const e = ctx.response.data.folder;
        if (e.id) {
            // 文档有要求,返回file时,必须为规范路径
            e.id = signId(p2, e.id);
        }
        // 简化模块代码重复度
        if (e.mime === undefined) {
            e.mime = '';
        }
    }
};
