const { axios, RTError, IDHelper, _P } = require('../utils/node');
const logger = require('../utils/logger');

// 支持分页、id寻址、中转下载

const { PAGE_SIZE } = require('../conf/sys-config');

function filter(e) {
    // 处理shortcut
    if (e.shortcutDetails) {
        e.id = e.shortcutDetails.targetId;
        e.mimeType = e.shortcutDetails.targetMimeType;
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

class GoogleDrive extends IDHelper {
    static async build(config) {
        const g = new GoogleDrive(config);
        const { access_token } = await g.refreshToken(config);
        g.access_token = access_token;
        g.service.defaults.headers.common.Authorization = 'Bearer ' + access_token;
        return g;
    }

    constructor({ root }) {
        super(root || 'root');
        const service = axios.create({ baseURL: 'https://www.googleapis.com/' });
        service.interceptors.response.use(
            (response) => response.data,
            (err) => {
                if (err.response && err.response.data && err.response.data.error) {
                    if (err.response.status === 404) {
                        return Promise.reject(new RTError(404, 'ItemNotExist'));
                    } else {
                        const d = err.response.data.error;
                        return Promise.reject(new RTError(400, 'ModuleError', d.message || d));
                    }
                }
                return Promise.reject(err);
            }
        );
        this.service = service;
    }

    async refreshToken({ client_id, client_secret, refresh_token }) {
        const o = GoogleDrive.oauth2s[0];
        const data = await this.service.post(
            'https://www.googleapis.com/oauth2/v4/token',
            new URLSearchParams({
                client_id: client_id || o.client_id,
                client_secret: client_secret || o.client_secret,
                grant_type: 'refresh_token',
                refresh_token,
            })
        );
        logger.log('google drive access_token:' + data.access_token);
        return data;
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
            .then((data) => data.files.map(filter).find((e) => e.name === name));
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
            fields: 'files(id,name,mimeType,size,modifiedTime,shortcutDetails,webContentLink,thumbnailLink),nextPageToken',
            pageSize: PAGE_SIZE,
        };
        if (pageToken) {
            params.pageToken = pageToken;
        }
        return this.service.get('drive/v3/files', { params }).then((data) => ({
            list: data.files.map(filter),
            next: data.nextPageToken,
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

GoogleDrive.oauth2s = [
    {
        client_id: '202264815644.apps.googleusercontent.com',
        client_secret: 'X4Z3ca8xfWDb1Voo-F9a7ZxJ',
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
    },
    {
        client_id: '695250577395-08nocpbl8suogn56vjlpmifnhp5a4d7e.apps.googleusercontent.com',
        client_secret: 'k8xsOAGqhcmF1peWUDhZOeCK',
        redirect_uri: 'https://point.onesrc.cn/oauth2',
    },
];

module.exports = {
    get params() {
        return [
            _P('refresh_token', '', '<a href="https://point.onesrc.cn/oauth2/" target="_blank">获取refresh_token</a>', 7, '', false, true),
            _P('root', '', '默认为根目录;如果想使用子目录,请填写目录id;如果想使用团队盘,请使用团队盘id', 5, 'root', false, false),
            _P('client_id', '', '', 5, '', false, false),
            _P('client_secret', '', '', 5, '', false, false),
        ];
    },
    async handle(config, data, cache, ctx) {
        let $m = cache.$m || {};
        ctx.assert($m.isValid || (config.refresh_token && (cache.$m = $m = await GoogleDrive.build(config))), 400, 'ConfigError', { fields: ['refresh_token'] });
        data.id = data.id || (await $m.getIDByPath(data.path));
        return this[data.command](data, cache, ctx);
    },
    async ls({ path, id, page }, { $m }, ctx) {
        if (path.endsWith('/')) {
            const { list, next } = await $m.fetchList(id, page);
            ctx.assert(list.length > 0 || (await $m.itemInfo(id)).type === 1, 400, 'ItemIsFile');
            ctx.respondList(list, next);
        } else {
            const e = await $m.itemInfo(id);
            ctx.respondOne(e, e.type ? null : $m.downInfo(e.id));
        }
    },
};
