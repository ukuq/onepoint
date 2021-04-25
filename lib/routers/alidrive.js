const { axios, IDHelper, _P } = require('../utils/node');
const logger = require('../utils/logger');
const { RTError } = require('../utils/node');

// 支持分页、id寻址

const { PAGE_SIZE } = require('../conf/sys-config');

function filter(e) {
    const r = {
        type: 1,
        name: e.name,
        time: e.updated_at,
        id: e.file_id,
    };

    if (e.type === 'file') {
        r.type = 0;
        r.mime = e.mimeType;
        r.size = e.size;
        r.url = e.url;
    }
    return r;
}

class AliDrive extends IDHelper {
    static async build(config) {
        const m = new AliDrive(config);
        const { access_token, default_drive_id } = await m.refreshToken(config);
        // @warning refresh_token 有效期未知，暂时按永久有效处理
        m.access_token = access_token;
        m.service.defaults.headers.common.Authorization = 'Bearer ' + access_token;
        m.drive_id = default_drive_id;
        return m;
    }

    constructor({ root }) {
        super(root || 'root');
        const service = axios.create({ baseURL: 'https://api.aliyundrive.com/v2/' });
        service.interceptors.response.use(
            (response) => response.data,
            (err) => {
                if (err.response && err.response.data && err.response.data.code) {
                    if (err.response.status === 404) {
                        return Promise.reject(new RTError(404, 'ItemNotExist'));
                    } else {
                        const { code, message } = err.response.data;
                        return Promise.reject(new RTError(400, 'ModuleError', code + ': ' + message));
                    }
                }
                return Promise.reject(err);
            }
        );
        Object.assign(service.defaults.headers.common, {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
            Origin: 'https://aliyundrive.com',
            Accept: '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
            Connection: 'keep-alive',
        });
        this.service = service;
    }

    async refreshToken({ refresh_token }) {
        const data = await this.service.post('https://auth.aliyundrive.com/v2/account/token', {
            grant_type: 'refresh_token',
            refresh_token,
        });
        logger.log('ali drive access_token:' + data.access_token);
        return data;
    }

    async findChildItem(pid, name) {
        return this.service
            .post('file/search', {
                drive_id: this.drive_id,
                limit: 10,
                query: `parent_file_id = "${pid}" and name = "${name}"`,
                order_by: 'name ASC',
            })
            .then((data) => data.items.map(filter).find((e) => e.name === name));
    }

    async itemInfo(file_id) {
        return this.service.post('file/get', { drive_id: this.drive_id, file_id }).then(filter);
    }

    async fetchList(pid, pageToken = null) {
        return this.service
            .post('file/list', {
                drive_id: this.drive_id,
                parent_file_id: pid,
                limit: PAGE_SIZE,
                all: false,
                fields: '*',
                order_by: 'name',
                order_direction: 'ASC',
                marker: pageToken,
            })
            .then((data) => ({
                list: data.items.map(filter),
                next: data.next_marker,
            }));
    }
}

module.exports = {
    get params() {
        return [_P('refresh_token', '', '', 7, '', false, true), _P('root', '', '', 5, 'root', false, false)];
    },
    async handle(config, data, cache, ctx) {
        let $m = cache.$m || {};
        ctx.assert($m.isValid || (config.refresh_token && (cache.$m = $m = await AliDrive.build(config))), 400, 'ConfigError', { fields: ['refresh_token'] });
        data.id = data.id || (await $m.getIDByPath(data.path));
        return this[data.command](data, cache, ctx);
    },
    async ls({ path, id, page }, { $m }, ctx) {
        if (path.endsWith('/')) {
            const { list, next } = await $m.fetchList(id, page);
            ctx.assert(list.length > 0 || (await $m.itemInfo(id)).type === 1, 400, 'ItemIsFile');
            ctx.respondList(list, next);
        } else {
            ctx.respondOne(await $m.itemInfo(id));
        }
    },
};
