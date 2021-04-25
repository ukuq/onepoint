const { axios, RTError, IDHelper, _P } = require('../utils/node');

const { PAGE_SIZE } = require('../conf/sys-config');
const ID_DELIMITER = 'l';

function filter(e) {
    const res = {
        type: 1,
        name: e.name,
        time: new Date(e.updatedAt || e.updated_at).toISOString(),
        size: null,
    };
    if (e.url) {
        res.type = 0;
        res.size = e.size;
        res.url = e.url;
    }
    // 记录下父id id 和类型
    res.id = (e.id || e.file_id) + ID_DELIMITER + e.parentId + ID_DELIMITER + res.type;
    return res;
}

function parseId(id) {
    const idInfo = id.split(ID_DELIMITER);
    return {
        id: idInfo[0],
        pid: idInfo[1],
        type: Number(idInfo[2]),
    };
}

// 因token能使用的api有限 所以改用cookie eid 默认是一年的有效期
class Coding extends IDHelper {
    static async build(config) {
        const c = new Coding(config);
        // 设置 X-XSRF-TOKEN
        await c.fetchList(0, 1);
        return c;
    }

    constructor({ root, api_url, cookie_eid }) {
        super(root);
        const service = axios.create({ baseURL: api_url });
        // service.defaults.headers.common['Authorization'] = 'token ' + api_token;
        service.defaults.headers.common.Cookie = 'eid=' + cookie_eid;
        service.interceptors.response.use((response) => {
            if (response.data.code !== 0) {
                const code = response.data.code;
                if (code === 1302 || code === 1217) {
                    return Promise.reject(new RTError(400, 'ItemAlreadyExist'));
                }
                if (code === 1304) {
                    return Promise.reject(new RTError(404, 'ItemNotExist'));
                }
                return Promise.reject(new RTError(400, 'ModuleError', { msg: 'error coding code:' + response.data.code }));
            }
            if (response.headers['set-cookie']) {
                const match = /XSRF-TOKEN=(?<token>[^;]+);/.exec(response.headers['set-cookie']);
                if (match && match.groups.token) {
                    this.service.defaults.headers.common.Cookie = `eid=${cookie_eid};XSRF-TOKEN=${match.groups.token};`;
                    this.service.defaults.headers.common['X-XSRF-TOKEN'] = match.groups.token;
                }
            }
            return response.data.data;
        });
        this.service = service;
    }

    async findChildItem(pid, name) {
        const data = await this.service.get(`folders/${pid}/all/masonry?sortName=name&sortValue=asc&pageSize=10&keyword=${encodeURIComponent(name)}&recursive=false`);
        const e = data.list.find((e) => e.name === name);
        if (!e) {
            throw new RTError(404, 'ItemNotExist');
        }
        return { type: e.url ? 0 : 1, name: e.name, id: e.id, pid };
    }

    async fetchList(id, page = 1) {
        const data = await this.service.get(`folders/${id}/all/masonry?sortName=name&sortValue=asc&page=${page}&pageSize=${PAGE_SIZE}`);
        const list = data.list.map(filter);
        const next = data.page < data.totalPage ? data.page + 1 : null;
        return { list, next };
    }

    // 1302
    async mkdir(pid, name) {
        const params = new URLSearchParams();
        params.set('parentId', pid);
        params.set('name', name);
        return filter(await this.service.post('mkdir', params));
    }

    // 1302
    async renameFolder(id, name) {
        const params = new URLSearchParams();
        params.set('name', name);
        return this.service.put(`folder/${id}`, params);
    }

    // 1302
    async renameFile(id, name) {
        const params = new URLSearchParams();
        params.set('name', name);
        return this.service.put(`files/${id}/rename`, params);
    }

    // 1217
    async touch(pid, name, content) {
        const params = new URLSearchParams();
        params.set('name', name);
        params.set('content', content);
        return this.service.post(`files/${pid}/create`, params);
    }

    async delete(ids) {
        const params = new URLSearchParams();
        ids.forEach((id) => params.append('fileIds', id));
        return this.service.post(`/files/recycle-bin/async`, params);
    }

    // 1304
    async fileInfo(id) {
        return filter(await this.service.get(`files/${id}/attribute`));
    }

    // 1304
    async folderInfo(id) {
        return filter(await this.service.get(`folders/${id}/attribute`));
    }

    async move(pid, ids) {
        const params = new URLSearchParams();
        params.set('toFolderId', pid);
        ids.forEach((id) => params.append('fileIds', id));
        return this.service.post(`files/move/async`, params);
    }

    async copy(pid, ids) {
        const params = new URLSearchParams();
        params.set('toFolderId', pid);
        ids.forEach((id) => params.append('fileIds', id));
        return this.service.post(`files/copy/async`, params);
    }

    async asyncTask(jid) {
        return this.service.get(`files/async-jobs/${jid}`);
    }

    async mulDownload(ids) {
        const params = new URLSearchParams();
        ids.forEach((id) => params.append('fileIds', id));
        params.set('withDirName', 'true');
        return this.service.get(`files/mixed/download/`, { params });
    }
}

module.exports = {
    params() {
        return [
            _P('api_url', '', '形如: https://<团队名>.coding.net/api/user/<用户名>/project/<项目名>/folder/', 7, '', false, true),
            _P('cookie_eid', '', 'cookie中的eid项', 7, '', false, true),
            _P('root', '', '根目录或文件夹id', 5, '0', false, false),
        ];
    },
    async handle(config, data, cache, ctx) {
        if ((cache.etime || 0) < Date.now()) {
            const fields = [];
            if (!/https:\/\/.+.coding.net\/api\/project\/.+\//.exec(config.api_url)) {
                fields.push('api_url');
            }
            if (!config.cookie_eid) {
                fields.push('cookie_eid');
            }
            if (isNaN(Number(config.root))) {
                delete config.root;
            }
            config.root = Number(config.root) || 0;
            if (fields.length > 0) {
                throw new RTError(400, 'ConfigError', { fields });
            }

            cache.$U = await Coding.build(config);
            cache.etime = Date.now() + 3600 * 1000;
        }
        data._item = data.id ? parseId(data.id) : await cache.$U.getItemByPath(data.path);

        if (data.desPath) {
            data._desItem = data.desId ? parseId(data.desId) : await cache.$U.getItemByPath(data.desPath);
        }

        return this[data.command](data, cache, ctx);
    },
    async ls({ path, page, _item }, { $U }, ctx) {
        if (path.endsWith('/')) {
            if (_item.type === 0) {
                throw new RTError(403, 'ItemIsFile');
            }
            const { list, next } = await $U.fetchList(_item.id, page);
            ctx.respondList(list, next);
        } else {
            ctx.respondOne(await $U[_item.type === 0 ? 'fileInfo' : 'folderInfo'](_item.id));
        }
    },
    async mkdir({ name, _item }, { $U }) {
        if (_item.type === 0) {
            throw new RTError(403, 'ItemIsFile');
        }
        await $U.mkdir(_item.id, name);
    },
    async mv({ _item, _desItem }, { $U }, ctx) {
        if (_desItem.type === 0) {
            throw new RTError(403, 'ItemIsFile');
        }
        const { job_id } = await $U.move(_desItem.id, [_item.id]);
        ctx.respond(202, { async: job_id });
    },
    async cp({ _item, _desItem }, { $U }, ctx) {
        if (_desItem.type === 0) {
            throw new RTError(403, 'ItemIsFile');
        }
        const { job_id } = await $U.copy(_desItem.id, [_item.id]);
        ctx.respond(202, { async: job_id });
    },
    async rm({ _item }, { $U }, ctx) {
        const { job_id } = await $U.delete([_item.id]);
        ctx.respond(202, { async: job_id });
    },
    async ren({ name, _item }, { $U }) {
        await $U[_item.type === 0 ? 'renameFile' : 'renameFolder'](_item.id, name);
    },
    async touch({ name, content, _item }, { $U }, ctx) {
        await $U.touch(_item.id, name, content);
        ctx.respond(201);
    },
};
