const { axios, mime } = require('../utils/node');
const U = require('../utils/id-helper');
const logger = require('../utils/logger');

module.exports = {
    params: [
        {
            name: 'api_url',
            desc: '例如 https://ukuq.coding.net/api/user/ukuq/project/onepoint/folder/',
            value: '',
            star: true,
            level: 7,
            placeholder: 'https://<团队名>.coding.net/api/user/<用户名>/project/<项目名>/folder/',
        },
        {
            name: 'api_token',
            desc: '请到 https://ukuq.coding.net/user/account/setting/tokens 处生成token',
            value: '',
            star: true,
            level: 7,
            placeholder: 'eg: 71c7bd3a8838ed047f6fdf9c670690121354c000',
        },
        { name: 'root', desc: '根目录id,默认为0,代表根目录', value: '0', level: 5, placeholder: '' },
    ],
    format(config) {
        if (!/https:\/\/.+.coding.net\/api\/user\/.+\/project\/.+\/folder\//.exec(config.api_url)) {
            throw new Error('api_url is invalid');
        }

        if (!config.api_token) {
            throw new Error('api_token is empty');
        }

        if (isNaN(Number(config.root))) {
            throw new Error('root should be a number');
        }
        config.root = Number(config.root) || 0;
    },
    commands: ['ls'],
    async init(config, data, cache) {
        if (cache.$u && cache.$u.valid) {
            return;
        }
        cache.$u = this._buildU(config.api_url, config.api_token, config.root);
    },
    async ls(_, { path }, cache, ctx) {
        const d = await cache.$u.fetch(path);
        if (d.file) {
            ctx.respondOne(d.file);
        } else {
            ctx.respondList(d.list, d.next);
        }
    },
    async _buildU(url, token, root) {
        return new U({
            root,
            fetchList: async (pid, page = 1) => {
                logger.debug('fetch:' + pid);
                const { data } = await axios.get(`${url}${pid}/all?sortName=name&sortValue=desc&page=${page}&pageSize=500`, {
                    headers: {
                        Authorization: 'token ' + token,
                    },
                });
                if (data.code !== 0) {
                    throw new Error('error coding code:' + data.code);
                }
                const d = data.data;
                const list = [];
                const idList = [];
                d.list.forEach((e) => {
                    const o = {
                        type: e.url ? 0 : 1,
                        name: e.name,
                        time: new Date(e.updated_at).toISOString(),
                        size: e.size,
                        mime: e.url ? mime.get(e.name) : '',
                    };
                    if (e.url) {
                        o.url = e.url;
                    }
                    list.push(o);
                    idList.push({ type: e.url ? 0 : 1, name: e.name, id: e.id });
                });
                const next = d.page < d.totalPage ? d.page + 1 : null;
                return { pid, idList, list, next };
            },
        });
    },
};
