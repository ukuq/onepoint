'use strict';
const {
    Msg
} = require('../utils/msgutils');
const {
    getmime,
    axios
} = require('../utils/nodeutils');

let coding;

exports.ls = ls;
async function ls(path, page) {
    let matcher = /^(.*)\/([^/]*)$/.exec(path);
    let data = (await coding._list(await coding.getIDByPath(matcher[1]), page)).data;
    let list = data.list;
    if (matcher[2]) { //file
        let file = list.find(e => {
            return e.name === matcher[2];
        });
        if (file) {
            if (file.url === undefined) throw Msg.error(403, Msg.constants.Incomplete_folder_path);
            return Msg.file({
                type: 0,
                name: file.name,
                size: file.size,
                mime: getmime(file.name),
                time: new Date(Number(file.updated_at)).toISOString()
            }, file.url);
        } else throw Msg.error(404);
    } else {
        return Msg.list(list.map(e => {
            return {
                type: e.url ? 0 : 1,
                id: e.id,
                name: e.name,
                time: new Date(Number(e.updated_at)).toISOString(),
                size: e.size,
                mime: e.url ? getmime(e.name) : "",
                url: e.url
            }
        }), data.page < data.totalPage ? (data.page + 1) : undefined);
    }
}

exports.func = async (spConfig, cache, event) => {
    let root = spConfig.root || '';
    let p2 = root + event.p2;
    coding = new Coding(spConfig.url, spConfig.token, spConfig.root, cache);
    switch (event.cmd) {
        case 'ls':
            return await ls(p2, event.sp_page);
        default:
            return Msg.info(400, Msg.constants.No_such_command);
    }
}
class Coding {
    constructor(url, token, root = 0, cache = {}) {
        this.url = url;
        this.token = token;
        this.icache = cache;
        this.root = root;
    }
    async _list(parentId, page = 1, keyword = '') {
        if (isNaN(Number(page))) page = 1;
        let d = (await axios.get(this.url + `${parentId}/all?sortName=name&sortValue=desc&page=${page}&pageSize=500&keyword=${keyword}&recursive=false`, {
            headers: {
                'Authorization': 'token ' + this.token
            }
        })).data
        if (d.code) throw Msg.error(400, d.Msg);
        this.icache[parentId] = {
            d,
            t: Date.now() + 300000
        };
        return d;
    }
    async getIDByPath(path = '/') {
        let paths = path.split('/').filter(e => {
            return !!e
        });
        return this._getIDByPath(paths, this.root);
    }
    async _getIDByPath(paths = [], parentId) {
        if (paths.length === 0) return parentId;
        if (!this.icache[parentId] || this.icache[parentId].t < Date.now()) {
            await this._list(parentId);
        }
        let data = this.icache[parentId].d;
        let file = data.data.list.find(e => {
            return e.name === paths[0];
        });
        if (file) {
            if (!file.url) {
                paths.shift();
                return this._getIDByPath(paths, file.id);
            } else return file.id;
        } else throw Msg.error(404);
    }
}
exports.Coding = Coding;