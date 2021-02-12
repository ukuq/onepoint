const { axios, RTError, IDHelper, _P } = require('../utils/node');
const { PAGE_SIZE } = require('../conf/sys-config');

function folderFilter(e) {
    return {
        type: 1,
        name: e.title,
        time: e.updated,
        size: null,
        id: e._id,
    };
}

function fileFilter(e) {
    return {
        type: 0,
        name: e.fileName,
        time: e.updated,
        size: e.fileSize,
        id: e._id,
        url: e.downloadUrl,
    };
}

class Teambition extends IDHelper {
    constructor({ parentId, projectId, cookie }) {
        super(parentId);
        this._projectId = projectId;
        const service = axios.create({
            baseURL: 'https://www.teambition.com/api/',
            headers: { cookie },
        });
        service.interceptors.response.use(
            (response) => response.data,
            (err) => {
                if (err && err.response && err.response.data && err.response.data.message) {
                    if (err.response.status === 404) {
                        return Promise.reject(new RTError(404, 'ItemNotExist'));
                    }
                    return Promise.reject(new RTError(400, 'ModuleError', { msg: err.response.data.name + ' ' + err.response.data.message }));
                }
                return Promise.reject(err);
            }
        );
        this.service = service;
    }

    async findChildItem(pid, name) {
        let e = await this.fetchFolders(pid, 1, 500).then((arr) => arr.find((e) => e.name === name));
        if (!e) {
            e = await this.fetchFiles(pid, 1, 1000).then((arr) => arr.find((e) => e.name === name));
            if (!e) {
                throw new RTError(404, 'ItemNotExist');
            }
        }
        e.pid = pid;
        return e;
    }

    async fetchFiles(pid, page = 1, count = PAGE_SIZE) {
        return this.service
            .get(`works`, {
                params: {
                    _parentId: pid,
                    _projectId: this._projectId,
                    order: 'nameAsc',
                    count: count,
                    page: page,
                },
            })
            .then((data) => data.map(fileFilter));
    }

    async fetchFolders(pid, page = 1, count = 200) {
        return this.service
            .get(`collections`, {
                params: {
                    _parentId: pid,
                    _projectId: this._projectId,
                    order: 'nameAsc',
                    count: count,
                    page: page,
                },
            })
            .then((data) => data.map(folderFilter).filter((e) => e.name));
    }

    async fetchList(pid, page = 1) {
        if (page === 1) {
            const folders = await this.fetchFolders(pid);
            const files = await this.fetchFiles(pid);
            const next = files.length === PAGE_SIZE ? 2 : null;
            return { list: folders.concat(files), next };
        } else {
            const list = await this.fetchFiles(pid, page);
            // 尽可能提高准确性
            const next = list.length === PAGE_SIZE ? page + 1 : null;
            return { list, next };
        }
    }

    async fileInfo(id) {
        return this.service.get('works/' + id).then(fileFilter);
    }

    async folderInfo(id) {
        return this.service.get('collections/' + id).then(folderFilter);
    }
}

module.exports = {
    params() {
        return [_P('cookie', '', '形如TEAMBITION_SESSIONID=*; TEAMBITION_SESSIONID.sig=*', 7, '', true, true), _P('projectId', '', '项目id', 7, '', false, true), _P('parentId', '', '根目录或文件夹id', 7, '', false, true)];
    },
    async handle(config, data, cache, ctx) {
        if ((cache.etime || 0) < Date.now()) {
            if (!config.cookie || !config.projectId || !config.parentId) {
                throw new RTError(400, 'ConfigError', { fields: ['cookie', 'projectId', 'parentId'] });
            }
            cache.$t = new Teambition(config);
            cache.etime = Date.now() + 3600 * 1000;
        }
        if (!data.id) {
            data.id = await cache.$t.getIDByPath(data.path);
        }
        return this.ls(data, cache, ctx);
    },
    async ls({ path, id, page = 1 }, { $t }, ctx) {
        if (path.endsWith('/')) {
            await $t
                .fetchList(id, page)
                .then(({ list, next }) => {
                    ctx.respondList(list, next);
                })
                .catch(async (err) => {
                    if (err.type === 'ItemNotExist') {
                        // 不报错则是文件 报错正常退出
                        await $t.fileInfo(id);
                        throw new RTError(400, 'ItemIsFile');
                    }
                });
        } else {
            await $t
                .folderInfo(id)
                .catch((err) => {
                    if (err.type === 'ItemNotExist') {
                        return $t.fileInfo(id);
                    }
                })
                .then((e) => {
                    const o = Object.assign({}, e);
                    delete o.pid;
                    ctx.respondOne(o);
                });
        }
    },
};
