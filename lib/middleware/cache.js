const logger = require('../utils/logger');
module.exports = async (ctx, next) => {
    const path = ctx.state.p1 + ctx.state.p2;
    // use cache
    if (ctx.$data.useCache) {
        const m = oneCache.getMsg(path, ctx.$data.page);
        if (m) {
            logger.info('cache hit');
            if (m.list) {
                ctx.respondList(m.list, m.nextToken);
            } else if (m.file) {
                ctx.respondOne(m.file, m.url);
            }
            ctx.response.data.cached = true;
            return;
        }
    }

    await next();

    if (ctx.$data.command !== 'ls' || ctx.response.status !== 200) {
        return;
    }

    if (ctx.response.isList) {
        const d = ctx.response.data;
        oneCache.addList(path, d.list, d.nextToken, ctx.$data.page);
    } else if (ctx.response.isFile) {
        oneCache.addFile(path, ctx.response.data.file);
    }
};

class OneCache {
    constructor() {
        this.root = { next: {} };
    }
    addList(path, list, nextToken, page = 0) {
        const p = this.getNode(path, true);
        const oNext = p.next;
        const next = {};
        const expT = Date.now() + 15 * 60 * 1000;
        list.forEach((e) => {
            next[e.name] = { value: e, next: oNext[e.name] ? oNext[e.name].next : {}, expT: e.url ? expT : 0, state: e.type === 0 ? 0 : 1 };
        });
        p.next = next;

        if (page || nextToken) {
            // 一锅炖不下
            if (!p.pages) {
                p.pages = {};
            }
            p.pages[page] = { list, nextToken, expT: Date.now() + 30 * 60 * 1000 };
        } else {
            p.state = 1;
            p.expT = Date.now() + 30 * 60 * 1000;
        }
    }
    addFile(path, file) {
        const p = this.getNode(path, true);
        p.value = file;
        p.state = 0;
        p.expT = Date.now() + 15 * 60 * 1000;
    }
    getNode(path, addIfAbsent) {
        let p = this.root;
        for (const i of path.split('/').filter((e) => e)) {
            if (!p.next[i]) {
                if (!addIfAbsent) {
                    return;
                }
                p.next[i] = { next: {} };
            }
            p = p.next[i];
        }
        return p;
    }

    getMsg(path, page = 0) {
        const p = this.getNode(path);
        if (!p) {
            return;
        }
        if (p.state === 0 && p.expT > Date.now()) {
            return { file: p.value };
        } else if (p.state === 1 && p.expT > Date.now()) {
            return { list: Object.values(p.next).map((e) => e.value) };
        } else if (p.pages && p.pages[page] && p.pages[page].expT > Date.now()) {
            return p.pages[page];
        }
    }

    drop(path = '/') {
        if (path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        const pPath = path.slice(0, path.lastIndexOf('/'));
        if (pPath === '') {
            this.root = { next: {} };
            return;
        }
        const pp = this.getNode(pPath);
        if (!pp) {
            return;
        }
        const name = path.slice(path.lastIndexOf('/') + 1);
        delete pp.next[name];
        delete pp.pages;
    }
}
const oneCache = new OneCache();
