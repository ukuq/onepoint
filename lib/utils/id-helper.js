class U {
    constructor({ root, fetchList, fetchOne }) {
        this.fetchList = fetchList;
        this.fetchOne = fetchOne;
        this.root = root;
        this.icache = {};
        this.etime = Date.now() + 3600 * 1000;
    }

    get valid() {
        return this.etime > Date.now();
    }

    async fetch(path, page) {
        if (path.endsWith('/')) {
            const item = await this.getIDByPath(path, this.root);
            if (item.type === 0) {
                return this.fetch(path.slice(0, -1));
            }
            return this._fetchList(item.id, page);
        }
        // 一定可以匹配上
        const match = /(?<folder>.*)\/(?<file>[^/]+)\/?/.exec(path);
        const item = await this.getIDByPath(match.groups.folder, this.root);
        const file = match.groups.file;
        const r = await this._fetchList(item.id);
        const e = r.list.find((e) => e.name === file);
        if (!e) {
            throw new Error('404');
        }
        if (e.type === 0) {
            if (this.fetchOne) {
                return this.fetchOne(r.idList.find((e) => e.name === file).id);
            }
            return { file: e };
        }
        return this.fetch(path + '/', page);
    }

    async getIDByPath(path = '/', root) {
        return this._getIDByPath(
            path.split('/').filter((e) => e),
            { id: root }
        );
    }

    async _getIDByPath(paths, item) {
        if (paths.length === 0) {
            return item;
        }
        const pid = item.id;
        if (!this.icache[pid] || this.icache[pid].etime < Date.now()) {
            const r = await this._fetchList(pid);
            if (item.name && r.name && item.name !== r.name) {
                throw new Error('cache state error,try again');
            }
        }
        const e = this.icache[pid].idList.find((e) => e.name === paths[0]);

        if (!e) {
            throw new Error('404');
        }

        paths.shift();
        return this._getIDByPath(paths, e);
    }

    async _fetchList(pid, page) {
        const r = await this.fetchList(pid, page);
        this.icache[pid] = {
            idList: r.idList,
            etime: Date.now() + 300000,
        };
        return r;
    }
}

module.exports = U;
