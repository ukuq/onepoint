const { axios, mime } = require('../utils/node');
const logger = require('../utils/logger');
const op = require('../core/op');

module.exports = {
    params: [
        {
            name: 'callback_code',
            desc: '',
            value: '',
            star: true,
            level: 7,
            placeholder: 'oauth2回调code 一般自动生成, callback_code、refresh_token、share_url 只需要填写一个',
            textarea: true,
        },
        {
            name: 'refresh_token',
            desc: '',
            value: '',
            star: true,
            level: 7,
            placeholder: 'refresh_token, 同上',
            textarea: true,
        },
        {
            name: 'share_url',
            desc: '',
            value: '',
            star: true,
            level: 7,
            placeholder: 'OneDrive分享链接, 同上',
        },

        {
            name: 'oauth_type',
            desc: 'com:国际版 cn:世纪互联特供版',
            value: 'com',
            star: true,
            level: 7,
            select: ['com', 'cn'],
        },
        {
            name: 'root',
            desc: '根目录, 例如 /a/b/c',
            value: '',
            level: 5,
            placeholder: 'root path',
        },
        {
            name: 'api_url',
            desc: 'api url, 分享团队盘时使用此项',
            value: '',
            level: 5,
            placeholder: 'api_url',
        },
        {
            name: 'client_id',
            desc: '',
            value: '',
            level: 5,
            placeholder: 'client_id',
        },
        {
            name: 'client_secret',
            desc: '',
            value: '',
            level: 5,
            placeholder: 'client_secret',
        },
        {
            name: 'refresh_etime',
            desc: '',
            value: 0,
            level: 1,
            hidden: true,
        },
    ],
    commands: ['ls', 'mkdir', 'mv', 'cp', 'rm', 'ren', 'touch', 'upload'],
    format: async (config) => {
        if (!config.oauth_type || !OneDrive.oauths[config.oauth_type]) {
            config.oauth_type = 'com';
        }
        if (!config.root) {
            config.root = '';
        } else if (config.root.endsWith('/')) {
            config.root = config.root.slice(0, -1);
        }
        config.refresh_etime = Number(config.refresh_etime) || 0;

        const o = OneDrive.oauths[config.oauth_type];

        if (config.callback_code) {
            await axios
                .post(
                    {
                        client_id: config.client_id || o.client_id,
                        client_secret: config.client_secret || o.client_secret,
                        grant_type: 'authorization_code',
                        requested_token_use: 'on_behalf_of',
                        code: config.callback_code,
                    },
                    { headers: { 'request-type': 'form' } }
                )
                .then((r) => {
                    const d = r.data;
                    logger.info(d);
                    config.refresh_token = d.refresh_token;
                    config.refresh_etime = 0; // 延后写入
                    delete config.callback_code;
                })
                .catch((err) => {
                    logger.error(err);
                    delete config.callback_code;
                    throw new Error('callback_code is invalid');
                });
        } else if (config.refresh_token) {
            delete config.share_url;
        } else if (!config.share_url.startsWith('https://')) {
            throw new Error('share_url is invalid');
        }
    },
    init: async (config, data, cache, ctx) => {
        data.path = config.root + data.path;
        if (config.share_url && config.oauth_type === 'cn') {
            ctx.assert(data.command === 'ls', 403, 'CommandNotExist', { command: data.command });
            if (cache.$point && cache.$point.valid) {
                return;
            }
            cache.$point = new SharePoint(config.share_url);
            await cache.$point.init();
        } else {
            if (cache.$one && cache.$one.valid) {
                return;
            }
            cache.$one = new OneDrive(config);
            await cache.$one.init();
            if (!config.refresh_etime || config.refresh_etime < Date.now()) {
                config.refresh_etime = Date.now() + 30 * 24 * 3600 * 1000;
                op.saveConfig().catch((err) => {
                    logger.error('save onedrive config error:');
                    logger.error(err);
                });
            }
        }
    },
    error: (err, ctx) => {
        if (err.response && err.response.status && err.response.data && err.response.data.error) {
            const d = err.response.data;
            ctx.assert(err.response.status !== 404, 404, 'ItemNotExist', {});
            if (d.error_description) {
                ctx.throw(400, 'ModuleError', { msg: d.error + ' ' + d.error_description });
            } else {
                ctx.throw(400, 'ModuleError', { msg: d.error.code + ' ' + d.error.message });
            }
        } else {
            throw err;
        }
    },

    async ls(_, { path, page }, cache, ctx) {
        if (cache.$point) {
            return await this.ls_cn(_, { path, page }, cache, ctx);
        }
        const onedrive = cache.$one;
        if (!path.endsWith('/')) {
            // 处理文件情况
            const data = await onedrive.msGetItemInfo(path);
            if (!data.file) {
                return await this.ls(_, { path: path + '/', page }, cache, ctx);
            }
            ctx.respondOne({
                type: 0,
                name: data.name,
                size: data.size,
                mime: data.file.mimeType,
                time: data.lastModifiedDateTime,
                url: data['@microsoft.graph.downloadUrl'] || data['@content.downloadUrl'],
            });
        } else {
            const params = {
                // $top: 50
            };
            if (page && /\w*/.exec(page)) {
                params.$skiptoken = page;
            }
            const data = await onedrive.msGetDriveItems(path === '/' ? path : path.slice(0, -1), params);
            ctx.respondList(
                data.value.map((e) => ({
                    type: e.file ? 0 : 1,
                    name: e.name,
                    size: e.size,
                    mime: e.file ? e.file.mimeType : '',
                    time: e.lastModifiedDateTime,
                    url: e['@microsoft.graph.downloadUrl'] || e['@content.downloadUrl'],
                })),
                data['@odata.nextLink'] ? /skiptoken=(\w*)/.exec(data['@odata.nextLink'])[1] : null
            );
        }
    },

    // @Todo page

    async ls_cn(_, { path }, cache, ctx) {
        const data = await cache.$point.spListData(path);
        const offset = (new Date().getTimezoneOffset() - data.RegionalSettingsTimeZoneBias || 0) * 3600000;
        if (data.ListData.Row.length > 0) {
            // 文件夹
            ctx.respondList(
                data.ListData.Row.map((e) => ({
                    type: Number(e.FSObjType),
                    name: e.LinkFilename,
                    size: Number(e.SMTotalFileStreamSize),
                    mime: Number(e.FSObjType) ? '' : mime.get(e.LinkFilename),
                    time: new Date(new Date(e.SMLastModifiedDate) - offset).toISOString(),
                }))
            );
        } else {
            // 文件 或 空文件夹
            const info = await cache.$point.spGetItemInfo(data.ListData.CurrentFolderSpItemUrl);
            if (!info.file) {
                ctx.respondList([]);
            } // 空文件夹
            else {
                ctx.respondOne({
                    type: 0,
                    name: info.name,
                    size: Number(info.size),
                    mime: info.file.mimeType,
                    time: new Date(new Date(info.lastModifiedDateTime) - offset).toISOString(),
                    url: info['@content.downloadUrl'],
                });
            }
        }
    },

    async mkdir(_, { path, name }, cache, ctx) {
        await cache.$one.msMkdir(path, name);
        ctx.respond(200);
    },
    async mv(_, { path, path2 }, cache, ctx) {
        await cache.$one.msMove(path, path2);
        ctx.respond(200);
    },
    async cp(_, { path, path2 }, cache, ctx) {
        await cache.$one.msCopy(path, path2);
        ctx.respond(200);
    },
    async rm(_, { path }, cache, ctx) {
        await cache.$one.msDelete(path);
        ctx.respond(204);
    },
    async ren(_, { path, name }, cache, ctx) {
        await cache.$one.msRename(path, name);
        ctx.respond(200);
    },
    async touch(_, { path, name, content, mime }, cache, ctx) {
        await cache.$one.msUpload(path, name, content, mime);
        ctx.respond(201);
    },
    async upload(_, { path, name, fileInfo }, cache, ctx) {
        const res = await cache.$one.msUploadSession(path + name, fileInfo);
        ctx.respondJson(201, {}, res);
    },
};

class OneDrive {
    constructor(config) {
        const o = OneDrive.oauths[config.oauth_type];
        this.oauth = {
            share_url: config.share_url,
            refresh_token: config.refresh_token,
            api_url: config.api_url || o.api_url,
            client_id: config.client_id || o.client_id,
            client_secret: config.client_secret || o.client_secret,
            oauth_url: o.oauth_url,
        };
    }

    get valid() {
        return this.etime > Date.now();
    }

    async init() {
        if (this.oauth.share_url && this.oauth.share_url.startsWith('https://')) {
            const data = await SharePoint.getAccessToken(this.oauth.share_url);
            this.oauth.api_url = data.api_url;
            this.access_token = data.access_token;
        } else {
            this.access_token = await axios
                .post(
                    this.oauth.oauth_url,
                    {
                        client_id: this.oauth.client_id,
                        client_secret: this.oauth.client_secret,
                        grant_type: 'refresh_token',
                        requested_token_use: 'on_behalf_of',
                        refresh_token: this.oauth.refresh_token,
                    },
                    { headers: { 'request-type': 'form' } }
                )
                .then((res) => res.data.access_token);
        }
        this.etime = Date.now() + 3600 * 1000;
        logger.log('onedrive access_token:' + this.access_token);
    }

    async msGetItemInfo(path) {
        const res = await axios.get(this.oauth.api_url + 'root' + (path === '/' ? '' : ':' + path), {
            headers: {
                Authorization: 'Bearer ' + this.access_token,
            },
        });
        logger.log(path + ':' + res.data.id);
        return res.data;
    }

    async msGetDriveItems(path, params) {
        const config = {
            headers: {
                Authorization: 'Bearer ' + this.access_token,
            },
        };
        if (params) {
            config.params = params;
        }
        const url = this.oauth.api_url + 'root' + (path === '/' ? '' : ':' + path + ':') + '/children';
        const res = await axios.get(url, config);
        return res.data;
    }

    async msMkdir(path, name) {
        const id = (await this.msGetItemInfo(path)).id;
        const config = {
            headers: {
                Authorization: 'Bearer ' + this.access_token,
            },
        };
        const data = {
            name: name,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'fail',
        };
        const url = this.oauth.api_url + 'items/' + id + '/children';
        return (await axios.post(url, data, config)).data;
    }

    async msMove(oldPath, newPath) {
        const oid = (await this.msGetItemInfo(oldPath)).id;
        const nid = (await this.msGetItemInfo(newPath)).id;
        const config = {
            headers: {
                Authorization: 'Bearer ' + this.access_token,
            },
        };
        const data = {
            parentReference: {
                id: nid,
            },
        };
        const url = this.oauth.api_url + 'items/' + oid;
        return (await axios.patch(url, data, config)).data;
    }

    async msCopy(srcPath, desPath) {
        const oid = (await this.msGetItemInfo(srcPath)).id;
        const nid = (await this.msGetItemInfo(desPath)).id;
        const config = {
            headers: {
                Authorization: 'Bearer ' + this.access_token,
            },
        };
        const data = {
            parentReference: {
                id: nid,
            },
        };
        const url = this.oauth.api_url + 'items/' + oid + '/copy';
        return (await axios.post(url, data, config)).headers;
    }

    async msDelete(path) {
        const id = (await this.msGetItemInfo(path)).id;
        const config = {
            headers: {
                Authorization: 'Bearer ' + this.access_token,
            },
        };
        const url = this.oauth.api_url + 'items/' + id;
        return (await axios.delete(url, config)).data;
    }

    async msRename(path, name) {
        const id = (await this.msGetItemInfo(path)).id;
        const config = {
            headers: {
                Authorization: 'Bearer ' + this.access_token,
            },
        };
        const data = {
            name: name,
        };
        const url = this.oauth.api_url + 'items/' + id;
        return (await axios.patch(url, data, config)).data;
    }

    async msUpload(path, filename, content, mime) {
        const id = (await this.msGetItemInfo(path)).id;
        const config = {
            headers: {
                Authorization: 'Bearer ' + this.access_token,
                'Content-Type': mime,
            },
        };
        const url = this.oauth.api_url + 'items/' + id + ':/' + filename + ':/content';
        return (await axios.put(url, content, config)).data;
    }

    async msUploadSession(filePath, fileSystemInfo) {
        const config = {
            headers: {
                Authorization: 'Bearer ' + this.access_token,
                'Content-Type': 'application/json',
            },
        };
        const data = {
            item: {
                '@microsoft.graph.conflictBehavior': 'fail',
            },
        };
        if (fileSystemInfo) {
            data.item.fileSystemInfo = fileSystemInfo;
        }
        const url = this.oauth.api_url + 'root:' + filePath + ':/createUploadSession';
        return (await axios.post(url, data, config)).data;
    }
}

OneDrive.oauths = {
    com: {
        client_id: '72f58ae2-35b3-49a0-bfdf-93c293711a3f',
        client_secret: 'QxTp=iw[=zHA[F0ZT97M1I.JUXD2RWhq',
        oauth_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        api_url: 'https://graph.microsoft.com/v1.0/me/drive/',
        scope: 'https://graph.microsoft.com/Files.ReadWrite.All offline_access',
    },
    cn: {
        client_id: '320ca2f3-9411-401e-99df-bcf163561733',
        client_secret: 'VHTu]JW?m5qQxER]klkks9XHRY]y8Et0',
        oauth_url: 'https://login.partner.microsoftonline.cn/common/oauth2/v2.0/token',
        api_url: 'https://microsoftgraph.chinacloudapi.cn/v1.0/me/drive/',
        scope: 'https://microsoftgraph.chinacloudapi.cn/Files.ReadWrite.All',
    },
};

class SharePoint {
    constructor(share_url) {
        this.share_url = share_url;
    }

    get valid() {
        return this.etime > Date.now();
    }

    async init() {
        const match = /https:\/\/(?<origin>[^/]*)\/:f:\/g\/personal\/(?<account>[^/]*).*/.exec(this.share_url);
        this.cookie = await this.getCookie(match[0]);
        this.origin = match.groups.origin;
        this.account = match.groups.account;
        this.etime = Date.now() + 3600 * 1000;
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
        const { headers } = await axios.get(shareUrl, config);
        if (!headers['set-cookie'] || !headers['set-cookie'][0]) {
            throw new Error('This sharing link has been canceled');
        }
        logger.log('sharepoint cookie:' + headers['set-cookie'][0]);
        return headers['set-cookie'][0];
    }

    async spListData(path) {
        const url = `https://${this.origin}/personal/${this.account}/_api/web/GetListUsingPath(DecodedUrl=@a1)/RenderListDataAsStream`;
        const config = {
            headers: {
                accept: 'application/json;odata=verbose',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'zh-CN',
                'cache-control': 'no-cache',
                'content-type': 'application/json;odata=verbose',
                origin: 'https://' + this.origin,
                pragma: 'no-cache',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'x-serviceworker-strategy': 'CacheFirst',
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
</ViewFields><RowLimit Paged="TRUE">200</RowLimit></View>`,
                __metadata: { type: 'SP.RenderListDataParameters' },
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

SharePoint.getAccessToken = async (share_url) => {
    const point = new SharePoint(share_url);
    await point.init();
    const data = await point.spListData('/');
    if (data.ListSchema && data.ListSchema['.driveUrl']) {
        return {
            api_url: data.ListSchema['.driveUrl'] + '/',
            access_token: data.ListSchema['.driveAccessToken'].slice('access_token='.length),
        };
    } else {
        throw new Error('no access_token');
    }
};
