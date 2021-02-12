const {axios, RTError, IDHelper, _P} = require('../utils/node');
const logger = require('../utils/logger');

const {PAGE_SIZE} = require('../conf/sys-config');

function filter(e) {
    // 处理shortcut
    if (e.shortcutDetails) {
        e.id = e.shortcutDetails.targetId;
        e.mime = e.shortcutDetails.targetMimeType;
    }

    const r = {
        type: 1,
        name: e.name,
        time: e.modifiedTime,
        id: e.id,
    };

    if (e.mimeType !== 'application/vnd.google-apps.folder') {
        r.type = 0;
        r.mime = e.mimeType;
        r.size = Number(e.size);
    }
    return r;
}

class Googledrive extends IDHelper {
    static async build(config) {
        const g = new Googledrive(config);
        if (config.callback_code) {
            await g.redeemCode(config.callback_code);
            delete config.callback_code;
        } else {
            await g.refreshToken();
        }
        g.service.defaults.headers.common.Authorization = 'Bearer ' + g.access_token;
        return g;
    }

    constructor({refresh_token, root}) {
        super(root);
        this.oauth = Object.assign({}, Googledrive.oauth2s[0], {refresh_token});
        const service = axios.create({baseURL: this.oauth.api_url});
        service.interceptors.response.use(
            (response) => response.data,
            (err) => {
                if (err.response && err.response.data && err.response.data.error) {
                    if (err.response.status === 404) {
                        return Promise.reject(new RTError(404, 'ItemNotExist'));
                    } else {
                        return Promise.reject(new RTError(400, 'ModuleError', err.response.data.error.message));
                    }
                }
                return Promise.reject(err);
            }
        );
        this.service = service;
    }

    async refreshToken() {
        const data = await this.service.post(
            this.oauth.oauth_url,
            new URLSearchParams({
                client_id: this.oauth.client_id,
                client_secret: this.oauth.client_secret,
                grant_type: 'refresh_token',
                refresh_token: this.oauth.refresh_token,
            })
        );
        this.access_token = data.access_token;
        logger.log('google drive access_token:' + data.access_token);
        return data;
    }

    async redeemCode(code) {
        return this.service
            .post(
                this.oauth.oauth_url,
                new URLSearchParams({
                    code,
                    client_id: this.oauth.client_id,
                    client_secret: this.oauth.client_secret,
                    redirect_uri: this.oauth.redirect_uri,
                    grant_type: 'authorization_code',
                })
            )
            .then((data) => {
                this.oauth.refresh_token = data.refresh_token;
                this.access_token = data.access_token;
                return data;
            });
    }

    async findChildItem(pid, name) {
        return this.service
            .get('drive/v3/files', {
                params: {
                    includeItemsFromAllDrives: true,
                    supportsAllDrives: true,
                    q: `name = '${name}' and '${pid}' in parents and trashed = false`,
                    orderBy: 'folder,name,modifiedTime desc',
                    fields: 'files(id,name,mimeType,size,modifiedTime,shortcutDetails),nextPageToken',
                    pageSize: 10,
                },
            })
            .then((data) => {
                const e = data.files.map(filter).find((e) => e.name === name);
                if (!e) {
                    throw new RTError(404, 'ItemNotExist');
                }
                e.pid = pid;
                return e;
            });
    }

    async itemInfo(id) {
        return this.service
            .get(`drive/v3/files/${id}`, {
                params: {
                    supportsAllDrives: true,
                    fields: 'id,name,mimeType,size,modifiedTime,shortcutDetails',
                },
            })
            .then(filter);
    }

    async fetchList(parentId, pageToken) {
        const params = {
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
            q: `'${parentId}' in parents and trashed = false`,
            orderBy: 'folder,name,modifiedTime desc',
            fields: 'files(id,name,mimeType,size,modifiedTime,shortcutDetails),nextPageToken',
            pageSize: PAGE_SIZE,
        };
        if (pageToken) {
            params.pageToken = pageToken;
        }
        return this.service.get('drive/v3/files', {params}).then((data) => ({
            list: data.files.map(filter),
            next: data.nextPageToken
        }));
    }

    downInfo(id) {
        return {
            url: `https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`,
            headers: {
                Authorization: 'Bearer ' + this.access_token,
            },
        };
    }
}

Googledrive.oauth2s = [
    {
        client_id: '202264815644.apps.googleusercontent.com',
        client_secret: 'X4Z3ca8xfWDb1Voo-F9a7ZxJ',
        oauth_url: 'https://www.googleapis.com/oauth2/v4/token',
        api_url: 'https://www.googleapis.com/',
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
    },
];

module.exports = {
    params() {
        const {client_id, redirect_uri} = Googledrive.oauth2s[0];
        const a = `https://accounts.google.com/o/oauth2/auth?client_id=${encodeURIComponent(
            client_id
        )}&redirect_uri=${redirect_uri}&response_type=code&access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&approval_prompt=auto`;
        return [
            _P('callback_code', '', `快速获取callback_code:<a href="${a}" target="_blank">${a}</a>`, 7, '与refresh_token互斥,二选一', false, true),
            _P('refresh_token', '', '', 7, '与callback_code互斥,二选一', false, true),
            _P('root', '', '默认为根目录;如果想使用子目录,请填写目录id;如果想使用团队盘,请使用团队盘id', 5, 'root', false, false),
            _P('refresh_etime', '', '', 0, '0', false, false, true)
        ];
    },
    async handle(config, data, cache, ctx) {
        if ((cache.etime || 0) < Date.now()) {
            if (!config.root) {
                config.root = 'root';
            }
            if (!config.refresh_token && !config.callback_code) {
                throw new RTError(400, 'ConfigError', {fields: ['callback_code', 'refresh_token']});
            }

            cache.$g = await Googledrive.build(config);
            if ((config.refresh_etime || 0) < Date.now()) {
                config.refresh_etime = Date.now() + 30 * 24 * 3600 * 1000;
                config.refresh_token = cache.$g.oauth.refresh_token;
                ctx.lazySave();
            }

            cache.etime = Date.now() + 3600 * 1000;
        }
        if (!data.id) {
            data.id = await cache.$g.getIDByPath(data.path);
        }
        return this[data.command](data, cache, ctx);
    },
    async ls({path, id, page}, {$g}, ctx) {
        if (path.endsWith('/')) {
            const {list, next} = await $g.fetchList(id, page);
            if (list.length === 0) {
                const e = await $g.itemInfo(id);
                if (e.type === 0) {
                    throw new RTError(400, 'ItemIsFile');
                }
            }
            ctx.respondList(list, next);
        } else {
            const e = await $g.itemInfo(id);
            ctx.respondOne(e, e.type ? null : $g.downInfo(e.id));
        }
    },
};
