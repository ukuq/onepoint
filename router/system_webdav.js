const {
    Msg
} = require('../utils/msgutils');
let webdav;
exports.ls = ls;
async function ls(path) {
    let data = await webdav.ls(path);
    if (!path.endsWith('/')) { //处理文件情况
        let prop = data['multistatus']['response']['propstat']['prop'];
        if (prop['resourcetype'] && (prop['resourcetype'].collection !== undefined)) throw new Msg.error(403, Msg.constants.Incomplete_folder_path);
        return Msg.file({
            type: 0,
            name: prop['displayname'] || /([^/]*)\/?$/.exec(data['multistatus']['response'].href)[1],
            size: prop['getcontentlength'] || 0,
            mime: prop['getcontenttype'],
            time: new Date(prop['getlastmodified']).toISOString()
        });
    }
    let list = [];
    if (!Array.isArray(data['multistatus']['response'])) return Msg.list([]);
    data['multistatus']['response'].forEach((e) => {
        let prop = e['propstat']['prop'];
        let file = {
            type: 0,
            name: prop['displayname'] || /([^/]*)\/?$/.exec(e.href)[1],
            size: prop['getcontentlength'] || 0,
            mime: prop['getcontenttype'],
            time: new Date(prop['getlastmodified']).toISOString()
        };
        if (prop['resourcetype'] && (prop['resourcetype'].collection !== undefined)) {
            file.type = 1;
            file.mime = "";
        }
        list.push(file);
    });
    console.log(list.shift());
    return Msg.list(list);
}

exports.func = async (spConfig, cache, event) => {
    webdav = new WebDav(spConfig.url, spConfig);
    let root = spConfig.root || '';
    let p2 = root + event.p2;
    switch (event.cmd) {
        case 'ls':
            return await ls(p2);
        case 'download':
            return Msg.down(await webdav.down(p2, event.headers.range));
        default:
            return Msg.info(400, Msg.constants.No_such_command);
    }
}


const {
    axios
} = require('../utils/nodeutils');
const parser = require('fast-xml-parser');
class WebDav {
    constructor(url, auth) {
        this.baseURL = url;
        if (!auth.Authorization) auth.Authorization = "basic " + Buffer.from(auth.username + ":" + auth.password).toString('base64');
        this.auth = auth.Authorization;
    }
    async ls(path) {
        let res = await axios({
            baseURL: this.baseURL,
            headers: {
                Authorization: this.auth,
                Depth: 1
            },
            method: 'propfind',
            url: path,
            responseType: "text"
        });
        return parser.parse(res.data, {
            ignoreNameSpace: true
        }, true);
    }
    async down(path, range) {
        let r = {
            url: `${this.baseURL}${path}`,
            headers: {
                'Authorization': this.auth
            }
        }
        if(this.baseURL.endsWith('/'))r.url=`${this.baseURL}${path.slice(1)}`;
        if (range) r.headers.Range = range;
        return r;
    }
}
exports.WebDav = WebDav;