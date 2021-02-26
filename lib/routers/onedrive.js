const {axios, RTError} = require('../utils/node');
const logger = require('../utils/logger');
const {_P} = require('../utils/node');
const op = require('../core/op')

const {PAGE_SIZE} = require('../conf/sys-config');

function filter(e) {
    const res = {
        type: 1,
        name: e.name,
        size: e.size,
        mime: '',
        time: e.lastModifiedDateTime,
    };
    if (e.file) {
        res.type = 0;
        res.mime = e.file.mimeType;
        res.url = e['@microsoft.graph.downloadUrl'] || e['@content.downloadUrl'] || null;
    }
    return res;
}

module.exports = {
    params(ctx) {
        const links = Object.values(OneDrive.oauth2s).map(
            ({
                 oauth_url,
                 client_id,
                 scope,
                 redirect_uri
             }) => `${oauth_url}authorize?scope=${encodeURIComponent(scope)}&response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}`
        );
        const desc = `<div><h3>快速获取callback_code</h3><span><a href="${links[0]}" target="_blank">国际版</a></span><span style="margin-left: 10px"><a href="${links[1]}" target="_blank">世纪互联</a></span></div>`;
        return [
            _P('oauth_type', 'com', 'com:国际版 cn:世纪互联特供版', 7, ['com', 'cn'], false, true),
            _P('callback_code', '', desc, 7, '与refresh_token share_url互斥', true, true),
            _P('refresh_token', '', '', 7, '与callback_code share_url互斥', true, true),
            _P('share_url', '', 'OneDrive分享链接', 7, '与refresh_token 与callback_code互斥', false, true),
            _P('root', '', '', 5, '/', false, false),
            _P('api_url', '', 'api url, 分享团队盘时使用此项', 5, '', false, false),
            _P('client_id', '', '', 5, '', false, false),
            _P('client_secret', '', '', 5, '', false, false),
            _P('redirect_uri', '', '', 5, '', false, false),
            _P('refresh_etime', '', '', 1, '0', false, false),
        ];
    },

    async handle(config, data, cache, ctx) {
        // 逻辑略显臃肿 为了统一所有的onedrive
        if ((cache.etime || 0) < Date.now()) {
            if (!config.root) {
                config.root = '';
            } else if (config.root.endsWith('/')) {
                config.root = config.root.slice(0, -1);
            }
            if (config.share_url && config.oauth_type === 'cn') {
                cache.$point = await SharePoint.build(config.share_url);
            } else if (config.callback_code || config.refresh_token || config.share_url) {
                cache.$one = await OneDrive.build(config);
                if (!config.share_url && (config.refresh_etime || 0) < Date.now()) {
                    config.refresh_etime = Date.now() + 30 * 24 * 3600 * 1000;
                    config.refresh_token = cache.$one.oauth.refresh_token;
                    await op.saveConfig()
                }
            } else {
                throw new RTError(400, 'ConfigError', {fields: ['callback_code', 'refresh_token', 'share_url']});
            }
            cache.etime = Date.now() + 3600 * 1000;
        }
        data.path = config.root + data.path;
        if (cache.$point) {
            ctx.assert(data.command === 'ls', 403, 'CommandNotAllowed', {command: data.command});
            return this.ls_cn(data, cache, ctx);
        } else {
            return this[data.command](data, cache, ctx);
        }
    },

    async ls({path, page}, {$one}, ctx) {
        if (!path.endsWith('/')) {
            // 处理文件情况
            ctx.respondOne(filter(await $one.itemInfo(path)));
        } else {
            const data = await $one.fetchItems(path === '/' ? path : path.slice(0, -1), page);
            ctx.respondList(data.value.map(filter), data['@odata.nextLink'] ? /skiptoken=(\w*)/.exec(data['@odata.nextLink'])[1] : null);
        }
    },

    // @Todo page

    async ls_cn({path}, {$point}, ctx) {
        const data = await $point.spListData(path);
        const offset = (new Date().getTimezoneOffset() - data.RegionalSettingsTimeZoneBias || 0) * 3600000;
        if (path.endsWith('/')) {
            // 文件夹
            ctx.respondList(
                data.ListData.Row.map((e) => ({
                    type: Number(e.FSObjType),
                    name: e.LinkFilename,
                    size: Number(e.SMTotalFileStreamSize),
                    time: new Date(new Date(e.SMLastModifiedDate) - offset).toISOString(),
                }))
            );
        } else {
            const info = await $point.spGetItemInfo(data.ListData.CurrentFolderSpItemUrl);
            ctx.respondOne({
                type: info.file ? 0 : 1,
                name: info.name,
                size: Number(info.size),
                time: new Date(new Date(info.lastModifiedDateTime) - offset).toISOString(),
                url: info['@content.downloadUrl'],
            });
        }
    },

    async mkdir({path, name}, {$one}) {
        await $one.mkdir(path, name);
    },
    async mv({path, desPath}, {$one}) {
        await $one.move(path, desPath);
    },
    async cp({path, desPath}, {$one}) {
        await $one.copy(path, desPath);
    },
    async rm({path}, {$one}, ctx) {
        await $one.delete(path);
        ctx.respond(204);
    },
    async ren({path, name}, {$one}) {
        await $one.rename(path, name);
    },
    async touch({path, name, content, mime}, {$one}, ctx) {
        await $one.touch(path, name, content, mime);
        ctx.respond(201);
    },
    async upload({path, name, size}, {$one}, ctx) {
        ctx.respond(201, await $one.uploadSession(path, name, size));
    },
};

class OneDrive {
    static async build(config) {
        const o = new OneDrive(config);
        if (config.callback_code) {
            await o.redeemCode(config.callback_code);
            delete config.callback_code;
        } else if (config.share_url) {
            const data = await SharePoint.getAccessToken(config.share_url);
            o.oauth.api_url = data.api_url;
            o.access_token = data.access_token;
        } else {
            await o.refreshAccessToken();
        }
        o.service.defaults.baseURL = o.oauth.api_url;
        o.service.defaults.headers.common.Authorization = 'Bearer ' + o.access_token;
        return o;
    }

    constructor({refresh_token, oauth_type, api_url, client_id, client_secret, redirect_uri}) {
        const o = OneDrive.oauth2s[oauth_type] || OneDrive.oauth2s.com;
        this.oauth = {
            refresh_token,
            api_url: api_url || o.api_url,
            client_id: client_id || o.client_id,
            client_secret: client_secret || o.client_secret,
            redirect_uri: redirect_uri || o.redirect_uri,
            oauth_url: o.oauth_url,
        };
        const service = axios.create();
        service.interceptors.response.use(
            (response) => response.data,
            (error) => {
                if (error.response && error.response.status) {
                    const d = error.response.data;
                    if (error.response.status === 404) {
                        return Promise.reject(new RTError(404, 'ItemNotExist'));
                    }
                    if (d.error_description) {
                        return Promise.reject(new RTError(400, 'ModuleError', {msg: d.error + ':' + d.error_description}));
                    } else {
                        return Promise.reject(new RTError(400, 'ModuleError', {msg: d.error.code + ':' + d.error.message}));
                    }
                }
                return Promise.reject(error);
            }
        );
        this.service = service;
    }

    async redeemCode(code) {
        return this.service
            .post(
                this.oauth.oauth_url + 'token',
                new URLSearchParams({
                    client_id: this.oauth.client_id,
                    client_secret: this.oauth.client_secret,
                    grant_type: 'authorization_code',
                    requested_token_use: 'on_behalf_of',
                    redirect_uri: this.oauth.redirect_uri,
                    code,
                })
            )
            .then((data) => {
                logger.info('refresh_token:' + data.refresh_token);
                this.oauth.refresh_token = data.refresh_token;
                this.access_token = data.access_token;
            });
    }

    async refreshAccessToken() {
        return this.service
            .post(
                this.oauth.oauth_url + 'token',
                new URLSearchParams({
                    client_id: this.oauth.client_id,
                    client_secret: this.oauth.client_secret,
                    grant_type: 'refresh_token',
                    requested_token_use: 'on_behalf_of',
                    refresh_token: this.oauth.refresh_token,
                })
            )
            .then((data) => {
                this.oauth.refresh_token = data.refresh_token;
                this.access_token = data.access_token;
            });
    }

    async itemInfo(path) {
        const data = await this.service.get('root' + (path === '/' ? '' : ':' + encodeURI(path)));
        logger.log(path + ':' + data.id);
        return data;
    }

    async getIdByPath(path) {
        return this.itemInfo(path).then(({id}) => id);
    }

    async fetchItems(path, pageToken) {
        const params = {$top: PAGE_SIZE};
        if (pageToken) {
            params.$skiptoken = pageToken;
        }
        return this.service.get('root' + (path === '/' ? '' : ':' + encodeURI(path) + ':') + '/children', {params});
    }

    async mkdir(path, name) {
        return this.service.post('items/' + (await this.getIdByPath(path)) + '/children', {
            name: name,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'fail',
        });
    }

    async move(path, desPath) {
        return this.service.patch('items/' + (await this.getIdByPath(path)), {
            parentReference: {
                id: await this.getIdByPath(desPath),
            },
        });
    }

    async copy(path, desPath) {
        return this.service.post('items/' + (await this.getIdByPath(path)) + '/copy', {
            parentReference: {
                id: await this.getIdByPath(desPath),
            },
        });
    }

    async delete(path) {
        return this.service.delete('items/' + (await this.getIdByPath(path)));
    }

    async rename(path, name) {
        return this.service.patch('items/' + (await this.getIdByPath(path)), {name});
    }

    async touch(path, name, content, mime) {
        return this.service.put('items/' + (await this.getIdByPath(path)) + ':/' + name + ':/content', {
            headers: {
                'Content-Type': mime,
            },
        });
    }

    async uploadSession(path, name) {
        return this.service.post('root:' + encodeURI(path + name) + ':/createUploadSession', {
            item: {
                '@microsoft.graph.conflictBehavior': 'fail'
            },
        });
    }
}

OneDrive.oauth2s = {
    com: {
        client_id: 'ca39c9ea-01b7-4199-b663-07cc3406196c',
        client_secret: 'AVMUwY_9_K8CbCXltBnNVi1~-5v6cM8qt6',
        oauth_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/',
        api_url: 'https://graph.microsoft.com/v1.0/me/drive/',
        scope: 'https://graph.microsoft.com/Files.ReadWrite.All offline_access',
        redirect_uri: 'https://point.onesrc.cn/oauth2/code-only',
        // old version
        // client_id: '72f58ae2-35b3-49a0-bfdf-93c293711a3f',
        // client_secret: 'QxTp=iw[=zHA[F0ZT97M1I.JUXD2RWhq',
    },
    cn: {
        client_id: '320ca2f3-9411-401e-99df-bcf163561733',
        client_secret: 'VHTu]JW?m5qQxER]klkks9XHRY]y8Et0',
        oauth_url: 'https://login.partner.microsoftonline.cn/common/oauth2/v2.0/',
        api_url: 'https://microsoftgraph.chinacloudapi.cn/v1.0/me/drive/',
        scope: 'https://microsoftgraph.chinacloudapi.cn/Files.ReadWrite.All',
        redirect_uri: 'https://point.onesrc.cn/oauth2/code-only',
    },
};

class SharePoint {
    static async build(share_url) {
        const o = new SharePoint(share_url);
        await o.init();
        return o;
    }

    static async getAccessToken(share_url) {
        const point = await SharePoint.build(share_url);
        const data = await point.spListData('/');
        if (data.ListSchema && data.ListSchema['.driveUrl']) {
            return {
                api_url: data.ListSchema['.driveUrl'] + '/',
                access_token: data.ListSchema['.driveAccessToken'].slice('access_token='.length),
            };
        } else {
            throw new RTError(500, 'ConfigError', {fields: ['share_url']});
        }
    }

    constructor(share_url) {
        this.share_url = share_url;
    }

    async init() {
        const match = /https:\/\/(?<origin>[^/]*)\/:f:\/g\/personal\/(?<account>[^/]*).*/.exec(this.share_url);
        this.cookie = await this.getCookie(match[0]);
        this.origin = match.groups.origin;
        this.account = match.groups.account;
    }

    async getCookie(shareUrl) {
        const config = {
            maxRedirects: 0,
            validateStatus: function (status) {
                return status >= 200 && status < 400;
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
                Cookie: '',
            },
        };
        const {headers} = await axios.get(shareUrl, config);
        if (!headers['set-cookie'] || !headers['set-cookie'][0]) {
            throw new RTError(500, 'ModuleError', {msg: 'This sharing link has been canceled'});
        }
        logger.log('sharepoint cookie:' + headers['set-cookie'][0]);
        return headers['set-cookie'][0];
    }

    async spListData(path) {
        const url = `https://${this.origin}/personal/${this.account}/_api/web/GetListUsingPath(DecodedUrl=@a1)/RenderListDataAsStream`;
        const config = {
            headers: {
                origin: 'https://' + this.origin,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
                Cookie: this.cookie,
            },
            params: {
                '@a1': `'/personal/${this.account}/Documents'`,
                RootFolder: `/personal/${this.account}/Documents${path}`,
                TryNewExperienceSingle: 'TRUE',
            },
        };
        const data = {
            parameters: {
                ViewXml: `<View ><Query><OrderBy><FieldRef Name="LinkFilename" Ascending="true"></FieldRef></OrderBy></Query><ViewFields>
<FieldRef Name="CurrentFolderSpItemUrl"/>
<FieldRef Name="FileLeafRef"/>
<FieldRef Name="FSObjType"/>
<FieldRef Name="SMLastModifiedDate"/>
<FieldRef Name="SMTotalFileStreamSize"/>
<FieldRef Name="SMTotalFileCount"/>
</ViewFields><RowLimit Paged="TRUE">${PAGE_SIZE}</RowLimit></View>`,
                __metadata: {type: 'SP.RenderListDataParameters'},
                RenderOptions: 136967,
                AllowMultipleValueFilterForTaxonomyFields: true,
                AddRequiredFields: true,
            },
        };
        const res = await axios.post(url, data, config);
        return res.data;
    }

    async spGetItemInfo(spItemUrl) {
        const config = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
                Cookie: this.cookie,
            },
        };
        const res = await axios.get(spItemUrl, config);
        return res.data;
    }
}
