'use strict';
const { Msg } = require('../utils/msgutils');

let googledrive;
exports.ls = ls;
async function ls(path, nextPageToken) {
    let matcher = /^(.*)\/([^/]*)$/.exec(path);
    let list = await googledrive._list(await googledrive.getIDByPath(matcher[1]), nextPageToken);
    if (matcher[2]) {//file
        let file = list.files.find(e => {
            return e.name === matcher[2];
        });
        if (file) {
            if (file.size === undefined) throw Msg.error(403, Msg.constants.Incomplete_folder_path);
            return Msg.file({
                type: 0,
                name: file.name,
                size: Number(file.size),
                mime: file.mimeType,
                time: file.modifiedTime
            });
        } else throw Msg.error(404);
    } else {
        return Msg.list(list.files.map(file => {
            return {
                type: file.size === undefined ? 1 : 0,
                name: file.name,
                size: Number(file.size),
                mime: file.size === undefined ? "" : file.mimeType,
                time: file.modifiedTime
            }
        }), list.nextPageToken);
    }
}

exports.func = async (spConfig, cache, event) => {
    let p2 = event.p2;
    googledrive = new GoogleDrive(spConfig.refresh_token, spConfig.root, cache);
    await googledrive.init();
    switch (event.cmd) {
        case 'ls':
            return ls(p2, event.sp_page);
        case 'download':
            return Msg.down(await googledrive.down(await googledrive.getIDByPath(p2), event.headers.range));
        default:
            return Msg.info(400, Msg.constants.No_such_command);
    }
}

const {
    axios,
    querystring
} = require('../utils/nodeutils');
class GoogleDrive {
    constructor(refresh_token, root = 'root', cache = {}) {
        this._refresh_token = refresh_token;
        this.oauth = GoogleDrive.oauths[0];
        this.icache = cache;
        this.root = root;
    }

    async init() {
        let refresh_token = this._refresh_token;
        let cache = GoogleDrive.ocache[refresh_token];
        let now = Date.now();
        if (!cache || cache._expired_time < now) {
            cache = await this.getAccesstoken(refresh_token);
            cache._expired_time = now + 3600000;
            GoogleDrive.ocache[refresh_token] = cache;
        }
        this.access_token = cache['access_token'];
    }

    async getAccesstoken(refresh_token) {
        let data = {
            client_id: this.oauth['client_id'],
            client_secret: this.oauth['client_secret'],
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        };
        let config = {
            transformRequest: [(data) => {
                data = querystring.stringify(data);
                return data;
            }],
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        let res = (await axios.post(this.oauth['oauth_url'], data, config)).data;
        console.log('googledrive access_token:' + res['access_token']);
        return res;
    }

    async down(id, range) {
        let r = {
            url: `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
            headers: {
                'Authorization': 'Bearer ' + this.access_token
            }
        }
        if (range) r.headers.Range = range;
        return r;
    }

    async _list(parentId, pageToken) {
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token
            },
            params: {
                includeItemsFromAllDrives: true,
                supportsAllDrives: true,
                q: `'${parentId}' in parents and trashed = false`,
                orderBy: 'folder,name,modifiedTime desc',
                fields:
                    'files(id,name,mimeType,size,modifiedTime,shortcutDetails),nextPageToken',
                pageSize: 1000
            }
        }
        if (pageToken && /^[~!a-zA-Z0-9_-]+$/.exec(pageToken)) {
            config.params.pageToken = pageToken;
        }
        let url = this.oauth['api_url'];
        let res = (await axios.get(url, config)).data;
        this.icache[parentId] = { d: res, t: Date.now() + 300000 };
        return res;
    }

    //一千个文件夹以上寻址可能会出现问题
    async getIDByPath(path = '/') {
        let paths = path.split('/').filter(e => { return !!e });// a,b,c
        return this._getIDByPath(paths, this.root);
    }
    async _getIDByPath(paths = [], parentId) {
        if (paths.length === 0) return parentId;
        if (!this.icache[parentId] || this.icache[parentId].t < Date.now()) {
            await this._list(parentId);
        }
        let data = this.icache[parentId].d;
        let file = data.files.find(e => {
            return e.name === paths[0];
        });
        if (file) {
            if(file.mimeType === 'application/vnd.google-apps.shortcut' ){
                file.id = file.shortcutDetails.targetId;
                file.mimeType = file.shortcutDetails.targetMimeType;
            }
            if (file.mimeType === 'application/vnd.google-apps.folder') {
                paths.shift();
                return this._getIDByPath(paths, file.id);
            } else return file.id;
        } else throw Msg.error(404);
    }
}
GoogleDrive.oauths = [ // 0 默认（支持商业版与个人版）
    {
        client_id: '202264815644.apps.googleusercontent.com',
        client_secret: 'X4Z3ca8xfWDb1Voo-F9a7ZxJ',
        oauth_url: 'https://www.googleapis.com/oauth2/v4/token',
        api_url: 'https://www.googleapis.com/drive/v3/files'
    }
];
GoogleDrive.ocache = {};

//https://accounts.google.com/o/oauth2/auth?client_id=202264815644.apps.googleusercontent.com&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&response_type=code&access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&approval_prompt=auto
// this.oauth = GoogleDrive.oauths[0];
// axios.post( this.oauth['oauth_url'], {
//     code:'4/zQGfpU7pr37fl6VAKCaW_PdvotK8cTMMKKKwrpgNqjkKSmACBZu-rRo',
//     client_id: this.oauth['client_id'],
//     client_secret: this.oauth['client_secret'],
//     redirect_uri:"urn:ietf:wg:oauth:2.0:oob",
//     grant_type: 'authorization_code'
// }, {
//     transformRequest: [(data) => {
//         data = querystring.stringify(data);
//         return data;
//     }],
//     headers: {
//         'Content-Type': 'application/x-www-form-urlencoded'
//     },
//     maxRedirects: 0
// }).then(res=>{console.log(res.data)}).catch(e=>{console.log(e.response.data)});