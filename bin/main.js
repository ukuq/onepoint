'use strict';
const { Msg } = require('../utils/msgutils');
const { getmd5 } = require('../utils/nodeutils');
const { OneCache } = require('../utils/cacheutil');
const _url = require('url');
const _cookie = require('cookie');
const querystring = require('querystring');

const drive_funcs = {};//云盘模块
['linux_scf', 'onedrive_graph', 'onedrive_sharepoint', 'gdrive_goindex', 'system_admin', 'system_phony', 'system_webdav', 'gdrive_v3', 'system_fs', 'system_coding'].forEach((e) => {
    drive_funcs[e] = require(`../router/${e}`);
});
const render_funcs = {};//渲染模块,目前建议使用w.w
['w.w', 'none',].forEach((e) => {
    render_funcs[e] = require(`../views/${e}`);
});

/**
 * onepoint ukuq
 * time:20200617
 */

class OnePoint {
    initialize(adapter) {
        this.adapter = adapter;
        this.oneCache = new OneCache();//cache管理模块
        console.log(adapter.name+'------initialize with:');
        for (let k in adapter) {
            console.log(k);
        }
        console.log('--------------');
    }

    //200710为了能够抛出错误信息, 这里改用保存成功时无返回结果,失败时抛出错误信息
    async saveConfig() {
        if (!this.config) throw Msg.error(500, Msg.constants.System_not_initialized);
        let w = this.adapter.writeConfig;
        if (!w) throw Msg.error(403, Msg.constants.No_such_command);
        else await w(this.config);
    }

    async handleEvent(event) {
        //惰性加载配置
        if (!this.config) this.updateConfig(await this.adapter.readConfig());

        let G_CONFIG = this.config['G_CONFIG'];
        let oneCache = this.oneCache;

        this.event = event;
        event['start_time'] = new Date();
        event['set_cookie'] = [];
        if (typeof event.body.pipe === 'function') event.body.toJSON = () => { return '[stream object]' };
        if (event.start_time.getUTCDate() !== this.initTime.getUTCDate()) this.refreshCache();
        console.log('start_time:' + event.start_time.toLocaleString(), 'utf-8');

        //超管权限检查
        if (event['cookie']['ADMINTOKEN'] === this.hashes.admin_password_date_hash) event.isadmin = true;
        else if (event.headers.authorization === this.hashes.admin_base64) event.isadmin = true;

        console.log(JSON.stringify(event));

        //OPTIONS method for CORS
        if (event.method === 'OPTIONS' && event.headers['access-control-request-headers']) {
            return this.endMsg(204, {
                'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Content-Range',
                'Access-Control-Max-Age': '1728000'
            }, "");
        }

        //反向代理时修正 basepath(ph,p0)
        if (this.config.DOMAIN_MAP[event['sourceIp']]) {//eg: www.example.com/point
            let domain_path = this.config.DOMAIN_MAP[event['sourceIp']];
            event.splitPath.ph = domain_path.ph;
            event.splitPath.p0 = domain_path.p0;
        }

        //关键局部变量声明
        let { p0, p_12 } = event['splitPath'];
        let p1, p2, drivePath, driveInfo, responseMsg;

        //初始化 drivePath driveInfo
        if (p_12.startsWith('/admin/')) {
            oneCache.addEventLog(event, 3);
            drivePath = '/admin/';
            driveInfo = {
                funcName: 'system_admin',
                spConfig: {
                    G_CONFIG, 'DRIVE_MAP': this.config.DRIVE_MAP, oneCache, onepoint: this
                }
            };
        } else if (p_12.startsWith('/tmp/')) {
            return this.endMsg(400, {}, "400: '/tmp/' is private");
        } else if (p_12.startsWith('/api/')) {
            oneCache.addEventLog(event, 1);
            event.noRender = true;
            if (p_12 === '/api/cmd') {
                if (!event.isadmin) return this.endMsg(401, {}, "401: noly admin can use this api ");
                let cmdData = event.body.cmdData;
                event.cmd = event.body.cmdType;
                event.cmdData = event.body.cmdData;
                if (cmdData.path) {
                    p_12 = cmdData.path;
                    drivePath = oneCache.getDrivePath(p_12);
                    event.sp_page = cmdData.sp_page;
                } else if (cmdData.srcPath && cmdData.desPath) {
                    p_12 = cmdData.srcPath;
                    drivePath = oneCache.getDrivePath(p_12);
                    if (oneCache.getDrivePath(cmdData.desPath) !== drivePath) return this.endMsg(400, { 'Content-Type': 'application/json' }, Msg.info(400, cmdData.srcPath + " and " + cmdData.desPath + " is not in the same drive"));
                    event.p2_des = cmdData.desPath.slice(drivePath.length - 1);
                } else return this.endMsg(400, {}, "400: cmdData is invalid");
            } else return this.endMsg(400, {}, "400: no such api");
        } else {
            oneCache.addEventLog(event, 0);
            event.cmd = event.query.download === undefined ? 'ls' : 'download';
            event.sp_page = event.query.sp_page;
            drivePath = oneCache.getDrivePath(p_12);
            event.isNormal = true;
            event.noRender = event.query.json !== undefined;
        }

        if (!driveInfo) {
            if (!oneCache.driveCache[drivePath]) oneCache.driveCache[drivePath] = {};
            driveInfo = this.config.DRIVE_MAP[drivePath] || {
                funcName: 'system_phony', spConfig: {}
            };
        }

        p1 = drivePath.slice(0, -1);
        p2 = p_12.slice(p1.length);
        event.p2 = p2;
        console.log('drivePath:' + drivePath + ', p2:' + p2);

        //处理云盘级密码
        if (driveInfo.password && !event.isadmin) {//有密码 且 非管理员
            //允许 query 云盘hash登录
            let drivepass = event['body']['drivepass'];
            if (event['method'] === 'GET' && event['query']['token'] && event['query']['expiresdate']) {
                if (!isNaN(Number(event['query']['expiresdate'])) && (new Date(Number(event['query']['expiresdate'])) > new Date()) && (event['query']['token'] === getmd5(driveInfo.password + event['query']['expiresdate']))) {//利用分享的 password_date_hash 登录
                    event['set_cookie'].push({ n: 'DRIVETOKEN', v: this.hashes[drivePath], o: { path: encodeURI(p0 + p1), maxAge: 3600 } });
                } else {
                    responseMsg = Msg.info(401, 'drivepass:云盘token无效');
                }
            } else if (event['method'] === 'POST' && drivepass) {//使用密码 登录
                if (drivepass === driveInfo.password) {//单个云盘登录
                    event['set_cookie'].push({ n: 'DRIVETOKEN', v: this.hashes[drivePath], o: { path: encodeURI(p0 + p1), maxAge: 3600 } });
                } else {//密码错误
                    responseMsg = Msg.info(401, 'drivepass:云盘密码错误');
                }
                console.log('使用密码登录:' + drivepass);
            } else if (event['cookie']['DRIVETOKEN']) {//使用cookie
                if (event['cookie']['DRIVETOKEN'] !== this.hashes[drivePath]) {
                    responseMsg = Msg.info(401, 'drivepass:云盘cookie失效');
                }
                console.log('使用cookie登录:' + event['cookie']['DRIVETOKEN']);
            } else responseMsg = Msg.info(401, 'drivepass:请输入云盘密码');
        }

        //过滤隐藏文件夹及其子文件的请求
        if (!responseMsg && Array.isArray(driveInfo.hidden) && !event.isadmin) {
            if (driveInfo.hidden.find((e) => {
                return p2.startsWith(e);
            }) !== undefined) responseMsg = Msg.info(404);
        }

        //普通模式查询cache
        if (!responseMsg && event.isNormal && event.cmd === 'ls') {
            responseMsg = oneCache.getMsg(p_12, event.sp_page);
        }

        if (!responseMsg) {
            try {
                responseMsg = await drive_funcs[driveInfo.funcName].func(driveInfo.spConfig, oneCache.driveCache[drivePath], event, this);
                console.log('response from drives: type=' + responseMsg.type + ' status=' + responseMsg.statusCode);
                //如果不用分页则用 -1 表示, 分页则用 sp_page 标识,且 sp_page 默认值为 0
                if (responseMsg.type === 1) {
                    if (!p2.endsWith('/')) p2 += '/';//不规范的目录请求
                    responseMsg.sp_page = (event.sp_page || responseMsg.data.nextToken) ? (event.sp_page || 0) : -1;
                    if (responseMsg.data.nextToken) responseMsg.data.next = '?sp_page=' + responseMsg.data.nextToken;
                } else if (responseMsg.type === 3) {//处理直接 html返回, type3只可能存在于这一阶段
                    return this.endMsg(responseMsg.statusCode, responseMsg.headers, responseMsg.data.html);
                }
                if (responseMsg.statusCode < 300) oneCache.addMsg(p_12, responseMsg, event.cmd, event.cmdData ? event.cmdData.desPath : '');
            } catch (error) {
                if (error.type === 2) {
                    responseMsg = error;
                } else if (error.response) {
                    if (error.response.status === 404) responseMsg = Msg.info(404, Msg.constants.S404_not_found);
                    else {
                        responseMsg = Msg.info(400, typeof error.response.data.pipe === 'function' ? error.message : JSON.stringify(error.response.data));
                    }
                } else {
                    responseMsg = Msg.info(400, error.message);
                    console.log(error);
                }
            }
        }

        //可配合nplayer使用, 受限于http，不能认证，此接口不对外开放。
        if (false && this.event.method === 'PROPFIND') {
            //if(!event.isadmin)responseMsg = Msg.info(401);
            if (responseMsg.type === 0) responseMsg = Msg.list([responseMsg.data.file], event.splitPath.p0 + event.splitPath.p_12.slice(0, event.splitPath.p_12.lastIndexOf('/') + 1));
            if (responseMsg.type === 1) responseMsg = Msg.html(207, getSimpleWebdavXml(responseMsg.data.list, event.splitPath.p0 + event.splitPath.p_12));
            else responseMsg = Msg.html(responseMsg.statusCode, getSimpleWebdavInfo(responseMsg.info));
            return this.endMsg(responseMsg.statusCode, responseMsg.headers, responseMsg.data.html);
        }

        //处理目录级密码 父文件夹中隐藏文件过滤 分页
        if (responseMsg.type === 1 && event.isNormal) {//文件列表 非管理员api
            if (!event.isadmin) {//管理员cookie忽略密码
                let pass;//目录级加密
                let hiddens = Array.isArray(driveInfo.hidden) ? driveInfo.hidden.map(e => { if (e.startsWith(p2)) return e.slice(p2.length) }).filter(e => { return !!e }) : [];
                responseMsg.data.list = responseMsg.data.list.filter((e) => {
                    if (e.name.startsWith('.password')) {
                        pass = e.name.slice(10);
                        return false;
                    } else {
                        return !hiddens.includes(e.name);
                    }
                });
                if (pass) {
                    let dirpass = event['body']['dirpass'];
                    if (event['method'] === 'POST' && dirpass) {// post
                        if (dirpass === pass) {
                            event['set_cookie'].push({ n: 'DIRTOKEN', v: getmd5(pass), o: { path: encodeURI(p0 + p1 + p2), maxAge: 3600 } });
                        } else {
                            responseMsg = Msg.info(401, 'dirpass:目录密码错误');
                        }
                    } else if (event['cookie']['DIRTOKEN']) {// cookie
                        if (event['cookie']['DIRTOKEN'] !== getmd5(pass)) responseMsg = Msg.info(401, 'dirpass:目录cookie无效');
                    } else responseMsg = Msg.info(401, 'dirpass:当前目录被加密');
                }
            }

            let pageSize = 50;//分页功能
            if (responseMsg.sp_page === -1 && responseMsg.data.list.length > pageSize) {
                let content_len = responseMsg.data.list.length;
                let page = Number(event.query['page']) || 1;
                responseMsg.data.list = responseMsg.data.list.slice((page - 1) * pageSize, page * pageSize);
                if (page > 1) responseMsg.data.prev = '?page=' + (page - 1);
                if (content_len > page * pageSize) responseMsg.data.next = '?page=' + (page + 1);
            }
        }

        //处理cookie设置的代理,代理程序参考 https://www.onesrc.cn/p/using-cloudflare-to-write-a-download-assistant.html
        if (responseMsg.type === 0 && event.cookie.proxy) responseMsg.data.url = event.cookie.proxy + '?url=' + encodeURIComponent(responseMsg.data.url);
        //处理api部分
        if (event.noRender) return this.endMsg(responseMsg.statusCode, Object.assign({}, responseMsg.headers, { 'Content-Type': 'application/json' }), JSON.stringify(responseMsg.data));
        //处理文件下载
        if (responseMsg.type === 0 && event.query['preview'] === undefined) return this.endMsg(302, { 'Location': responseMsg.data.url }, "302:" + responseMsg.data.url);

        event.readme = event.readme || driveInfo.desc || G_CONFIG.site_readme;

        return this.endMsg(responseMsg.statusCode, responseMsg.headers, this.renderHTML(responseMsg, event, G_CONFIG));
    }

    /**
     * event 事件生成
     */
    genEvent(method, url, headers, body = {},sourceIp = '0.0.0.0', p0 = '', query, cookie) {
        if (method === 'POST' && typeof body === 'string') {
            if (headers['content-type']) {
                if (headers['content-type'].includes('application/x-www-form-urlencoded')) {
                    body = querystring.parse(body);
                } else if (headers['content-type'].includes('application/json')) {
                    body = JSON.parse(body);
                }
            }
        }
        let event = {
            method, url, headers, body, sourceIp,
            query: query || querystring.parse(_url.parse(url).query),
            cookie: cookie || (headers['cookie'] ? _cookie.parse(headers['cookie']) : {}),
            splitPath: {
                ph: (_url.parse(url).protocol || '') + '//' + headers.host,
                p0: p0,
                p_12: decodeURIComponent(_url.parse(url).pathname.slice(p0.length) || '/')
            }
        }
        return event;
    }

    updateConfig(config) {
        this.config = config;
        let G_CONFIG = config['G_CONFIG'];
        let DRIVE_MAP = config['DRIVE_MAP'];
        // console.log(DRIVE_MAP);
        this.refreshCache();
        console.log("initialize success");
        //@info 此处用于兼容配置文件, 以后可能会剔除 @flag
        G_CONFIG.access_origins = G_CONFIG.access_origins || [];
        G_CONFIG.admin_username = G_CONFIG.admin_username || 'admin';
        for (let k in DRIVE_MAP) {
            if (!k.endsWith('/')) {
                DRIVE_MAP[k + '/'] = DRIVE_MAP[k];
                delete DRIVE_MAP[k];
            }
        }
        if (!config.DOMAIN_MAP) config.DOMAIN_MAP = {};
        this.renderHTML = render_funcs[G_CONFIG.render_name].render;
    }

    refreshCache() {
        //设置管理员密码 hash 值
        let time = new Date();
        let G_CONFIG = this.config['G_CONFIG'];
        let DRIVE_MAP = this.config['DRIVE_MAP'];
        this.initTime = time;
        this.hashes = {};
        this.hashes.admin_password_date_hash = getmd5(G_CONFIG.admin_password + time.getUTCMonth() + time.getUTCDate() + G_CONFIG.admin_username);
        this.hashes.admin_base64 = "basic " + Buffer.from(G_CONFIG.admin_username + ":" + G_CONFIG.admin_password).toString('base64');
        this.oneCache.initDrives(Object.keys(DRIVE_MAP));
        for (let k in DRIVE_MAP) {
            if (DRIVE_MAP[k].password) this.hashes[k] = getmd5(DRIVE_MAP[k].password + time.getUTCMonth() + time.getUTCDate());
        }
        console.log('cache is cleared');
    }

    endMsg(statusCode, headers, body, isBase64Encoded) {
        headers = Object.assign({ 'Content-Type': 'text/html' }, headers);
        let o = this.event.headers.origin;
        if (o && this.config.G_CONFIG.access_origins.includes(o)) {
            headers['Access-Control-Allow-Origin'] = o;
            headers['Access-Control-Allow-Credentials'] = true;
            this.event['set_cookie'].forEach((e => {
                if (!e.o) return;
                e.o.sameSite = "none";
                e.o.secure = true;
            }));
        }
        headers['Set-Cookie'] = this.event['set_cookie'].map((e => {
            return _cookie.serialize(e.n, e.v, e.o);
        }));
        console.log('end_time:' + new Date().toLocaleString(), 'utf-8');
        if (typeof body.pipe === 'function') body.toString = () => { return '[stream object]' };
        return {
            'isBase64Encoded': isBase64Encoded || false,
            'statusCode': statusCode,
            'headers': headers,
            'body': body
        }
    }
}
var onepoint = new OnePoint();
//封装一层,避免私有量被访问
exports.op = {
    initialize(adapter) {
        onepoint.initialize(adapter);
    },
    genEvent(method, url, headers, body = {}, sourceIp = '0.0.0.0', p0 = '', query, cookie) {
        return onepoint.genEvent(method, url, headers, body, sourceIp, p0, query, cookie)
    },
    async handleEvent(event) {
        return await onepoint.handleEvent(event);
    },
    async handleRaw(method, url, headers, body, sourceIp, p0, query, cookie) {
        return await onepoint.handleEvent(onepoint.genEvent(method, url, headers, body, sourceIp, p0, query, cookie));
    }
};


function getSimpleWebdavXml(list, ppath) {
    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><d:multistatus xmlns:d="DAV:">';
    ppath = ppath.replace(/&/g, '&amp;');
    list.forEach(e => {
        if (e.type == 0) {
            xml += `<d:response>
            <d:href>${ppath}${e.name.replace(/&/g, '&amp;')}</d:href>
            <d:propstat>
                <d:prop>
                    <d:getlastmodified>${new Date(e.time).toGMTString()}</d:getlastmodified>
                    <d:getcontentlength>${e.size}</d:getcontentlength>
                    <d:getcontenttype>${e.mime}</d:getcontenttype>
                    <d:resourcetype/>
                </d:prop>
            </d:propstat>
        </d:response>`
        } else {
            xml += `<d:response>
            <d:href>${ppath}${e.name.replace(/&/g, '&amp;')}/</d:href>
            <d:propstat>
                <d:prop>
                    <d:getlastmodified>${new Date(e.time).toGMTString()}</d:getlastmodified>
                    <d:getcontentlength>${e.size || 0}</d:getcontentlength>
                    <d:getcontenttype>httpd/unix-directory</d:getcontenttype>
                    <d:resourcetype>
                        <d:collection/>
                    </d:resourcetype>
                </d:prop>
            </d:propstat>
            </d:response>`
        }
    });
    xml += '</d:multistatus>';
    return xml;
}

function getSimpleWebdavInfo(info) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?><d:error xmlns:d="DAV:" xmlns:s="https://ukuq.github.io"><s:message>${info}</s:message></d:error>`;
}