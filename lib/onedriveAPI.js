'use strict';
const {
    axios,
    querystring
} = require('../utils/nodeutils');

const { SharePoint } = require('./sharepointAPI');

class OneDrive {
    constructor(refresh_token, type = 0, oauth) {
        this._refresh_token = refresh_token;
        this.oauth = Object.assign({}, OneDrive.oauths[type], oauth);
    }

    async init() {
        let refresh_token = this._refresh_token;
        let cache = OneDrive.ocache.find((e) => {
            return e._refresh_token === refresh_token
        });
        let now = new Date();
        if (!cache || cache._expired_time < now) {
            if (refresh_token.startsWith('http')) {
                cache = await this.getAccesstokenShare(refresh_token);
            } else cache = await this.getAccesstoken(refresh_token);
            cache._expired_time = new Date(now.valueOf() + 3600000);
            cache._refresh_token = refresh_token;
            OneDrive.ocache.push(cache);
        }
        this.access_token = cache['access_token'];
        if (cache.api_url) this.oauth.api_url = cache.api_url;
    }

    async getAccesstoken(refresh_token) {
        let data = {
            client_id: this.oauth['client_id'],
            client_secret: this.oauth['client_secret'],
            grant_type: 'refresh_token',
            requested_token_use: 'on_behalf_of',
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
        console.log('onedrive access_token:' + res['access_token']);
        return res;
    }

    async getAccesstokenShare(shareUrl) {
        let sp = new SharePoint(shareUrl);
        await sp.init();
        let d = await sp.spListData('/');
        let r = {};
        r.access_token = d.ListSchema['.driveAccessToken'].slice(13);//access_token=
        r.api_url = d.ListSchema['.driveUrl'] + '/';
        console.log('onedrive share access_token:' + r['access_token']);
        return r;
    }

    async msGetItemInfo(path) {
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token,
                'Content-Type': 'application/json'
            }
        }
        let url = this.oauth['api_url'] + 'root' + ((path === '/') ? '' : ':' + path);
        let res = (await axios.get(url, config)).data;
        console.log(path + ':' + res.id);
        return res;
    }

    async msGetDriveItems(path, params) {
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token
            }
        }
        if (params) config.params = params;
        let url = this.oauth['api_url'] + 'root' + ((path === '/') ? '' : ':' + path + ':') + '/children';
        let res = (await axios.get(url, config)).data;
        //console.log(res);
        return res;
    }

    async msMkdir(path, name) {
        let id = (await this.msGetItemInfo(path))['id'];
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token,
                'Content-Type': 'application/json'
            }
        }
        let data = {
            "name": name,
            "folder": {},
            "@microsoft.graph.conflictBehavior": "fail"
        }
        let url = this.oauth['api_url'] + 'items/' + id + '/children';
        let res = (await axios.post(url, data, config)).data;
        //console.log(res);
        return res;
    }

    async msRename(path, name) {
        let id = (await this.msGetItemInfo(path))['id'];
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token,
                'Content-Type': 'application/json'
            }
        }
        let data = {
            "name": name
        }
        let url = this.oauth['api_url'] + 'items/' + id;
        let res = (await axios.patch(url, data, config)).data;
        //console.log(res);
        return res;
    }

    async msDelete(path) {
        let id = (await this.msGetItemInfo(path))['id'];
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token
            }
        }
        let url = this.oauth['api_url'] + 'items/' + id;
        let res = (await axios.delete(url, config)).data;
        //console.log(res);
        return res;
    }

    async msMove(oldPath, newPath) {

        let oid = (await this.msGetItemInfo(oldPath))['id'];
        let nid = (await this.msGetItemInfo(newPath))['id'];
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token,
                'Content-Type': 'application/json'
            }
        }
        let data = {
            "parentReference": {
                "id": nid
            }
        }
        let url = this.oauth['api_url'] + 'items/' + oid;
        let res = (await axios.patch(url, data, config)).data;
        //console.log(res);
        return res;
    }

    async msCopy(srcPath, desPath) {

        let oid = (await this.msGetItemInfo(srcPath))['id'];
        let nid = (await this.msGetItemInfo(desPath))['id'];
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token,
                'Content-Type': 'application/json'
            }
        }
        let data = {
            "parentReference": {
                "id": nid
            }
        }
        let url = this.oauth['api_url'] + 'items/' + oid + '/copy';
        let res = (await axios.post(url, data, config)).headers;
        //console.log(res);
        return res;
    }

    async msDownload(path, range) {
        let id = (await this.msGetItemInfo(path))['id'];
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token
            }
        }
        if (range) config.headers['Range'] = 'bytes ' + range;
        let url = this.oauth['api_url'] + 'items/' + id + '/content';
        let res = (await axios.get(url, config)).data;
        //console.log(res);
        return res;
    }

    async msUpload(path, filename, content) {
        let id = (await this.msGetItemInfo(path))['id'];
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token,
                'Content-Type': 'text/plain'
            }
        }
        let url = this.oauth['api_url'] + 'items/' + id + ':/' + filename + ':/content';
        let res = (await axios.put(url, content, config)).data;
        //console.log(res);
        return res;
    }

    async msUploadSession(filePath, fileSystemInfo) {
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token,
                'Content-Type': 'application/json'
            }
        }
        let data = {
            "item": {
                "@microsoft.graph.conflictBehavior": "fail"
            }
        }
        if (fileSystemInfo) data["item"]["fileSystemInfo"] = fileSystemInfo;
        let url = this.oauth['api_url'] + 'root:' + filePath + ':/createUploadSession';
        let res = (await axios.post(url, data, config)).data;
        //console.log(res);
        return res;
    }

    async msUploadPut(url, range, content) {
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token,
                'Content-Range': 'bytes ' + range
            }
        }
        let res = (await axios.put(url, content, config)).data;
        //console.log(res);
        return res;
    }

    async msSearch(searchText) {
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token
            },
            params: {
                '$top': 100
            }
        }
        let url = this.oauth['api_url'] + 'root/search(q=\'' + searchText + '\')';
        let res = (await axios.get(url, config)).data;
        //console.log(res);
        return res;
    }

    async msCreateLink(path) {
        let id = (await this.msGetItemInfo(path))['id'];
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token,
                'Content-type': 'application/json'
            }
        };
        let data = {
            "type": "view",
            "scope": "anonymous"
        }
        let url = this.oauth['api_url'] + 'items/' + id + '/createLink';
        let res = (await axios.post(url, data, config)).data;
        //console.log(res);
        return res;
    }

    async msParseShares(shareUrl) {
        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.access_token
            }
        };
        let share = 'u!' + /[^=]*/.exec(Buffer.from(shareUrl, 'utf-8').toString('base64'))[0].replace('/', '_').replace('+', '-');
        let url = 'https://graph.microsoft.com/v1.0/shares/' + share;
        let res = (await axios.get(url, config)).data;
        //console.log(res);
        return res;
    }

}
//https://point.onesrc.cn/oauth2/
OneDrive.oauths = [ // 0 默认（支持商业版与个人版）
    {
        client_id: '72f58ae2-35b3-49a0-bfdf-93c293711a3f',
        client_secret: 'QxTp=iw[=zHA[F0ZT97M1I.JUXD2RWhq',
        oauth_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        api_url: 'https://graph.microsoft.com/v1.0/me/drive/',
        scope: 'https://graph.microsoft.com/Files.ReadWrite.All offline_access'
    },
    {
        client_id: '320ca2f3-9411-401e-99df-bcf163561733',
        client_secret: 'VHTu]JW?m5qQxER]klkks9XHRY]y8Et0',
        oauth_url: 'https://login.partner.microsoftonline.cn/common/oauth2/v2.0/token',
        api_url: 'https://microsoftgraph.chinacloudapi.cn/v1.0/me/drive/',
        scope: 'https://microsoftgraph.chinacloudapi.cn/Files.ReadWrite.All'
    }
];
OneDrive.ocache = [];

exports.OneDrive = OneDrive;