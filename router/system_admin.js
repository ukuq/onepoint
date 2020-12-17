const { Msg } = require('../utils/msgutils');
const { getmd5, fs, path } = require('../utils/nodeutils');
let G_CONFIG, DRIVE_MAP, oneCache, onepoint;
let _event;
const ajax_funcs = [];

//@flag 比较凌乱,以后再修改
exports.func = async (spConfig, cache, event) => {
    let p2 = event.p2;
    if (p2 == '/') return Msg.html(200, vue_html);
    G_CONFIG = spConfig['G_CONFIG'];
    DRIVE_MAP = spConfig['DRIVE_MAP'];
    oneCache = spConfig['oneCache'];
    onepoint = spConfig['onepoint'];
    _event = event;
    event.noRender = true;
    if (p2.startsWith("/public/")) {
        switch (p2.slice(7)) {
            case '/site':
                return Msg.html_json(200, { site_name: G_CONFIG.site_name, site_readme: G_CONFIG.site_readme, proxy_cookie: event.cookie.proxy, proxy: G_CONFIG.proxy, version: require('../package.json').version });
            case '/proxy':
                event['set_cookie'].push({ n: 'proxy', v: event.query.proxy || "", o: { path: event.splitPath.p0 + '/' } });
                return Msg.html(200, "proxy via: " + event.query.proxy);
            case '/event':
                return Msg.html_json(200, event);
            case '/login':
                //@flag 考虑以后加上验证码
                if (event.isadmin || event['method'] === 'POST' && event['body']['password'] === G_CONFIG.admin_password && event['body']['username'] === G_CONFIG.admin_username) {
                    event['set_cookie'].push({ n: 'ADMINTOKEN', v: onepoint.hashes.admin_password_date_hash, o: { path: event.splitPath.p0 + '/' } });
                    return Msg.info(200, "success");
                }
                else return Msg.info(403, "账号或密码错误");
            case '/logout':
                event['set_cookie'].push({ n: 'ADMINTOKEN', v: 0, o: { path: event.splitPath.p0 + '/' } });
                return Msg.html(204, "logout");
            case '/search':
                return;
            default:
                break;
        }
    }
    if (!event.isadmin) { return Msg.html(401, 'only admin can use this api'); }
    if (t = /\/ajax\/([^/]+)(.*)/.exec(p2)) {
        return await ajax_funcs[t[1]](t[2]);
    }
    return Msg.html(200, vue_html, { 'Content-Type': 'text/html' });
}

ajax_funcs['dashboard'] = () => {
    let drivesInfos = [];
    for (let i in DRIVE_MAP) {
        drivesInfos.push({
            path: i,
            funcName: DRIVE_MAP[i]['funcName'],
            password: DRIVE_MAP[i]['password'] ? '***' : ''
        });
    }
    return Msg.html_json(200, {
        runInfo: {
            createTime: oneCache.createTime,
            initTime: oneCache.initTime,
            normal: oneCache.eventlog[0].length,
            api: oneCache.eventlog[1].length,
            admin: oneCache.eventlog[3].length
        },
        drivesInfos: drivesInfos
    });
}

//@flag 此处需要隐去密码相关信息
ajax_funcs['setting'] = (p) => {
    let config = onepoint.config;
    if (p === '/site') {
        let g_config = config.G_CONFIG;
        let r = {};
        for (let k in g_config) {
            if (k.startsWith('site_')) {
                r[k] = g_config[k];
            }
        }
        return Msg.html_json(200, { G_CONFIG: r });
    } else if (p === '/drives') {
        let drive_map = config.DRIVE_MAP;
        let r = [];
        for (let k in drive_map) {
            let drive = {};
            drive.path = k;
            drive.funcName = drive_map[k].funcName;
            drive.password = drive_map[k].password;
            drive.spConfig = Object.assign({}, drive_map[k].spConfig);
            if (drive_map[k].funcName === 'onedrive_graph') {
                drive.spConfig.refresh_token = drive.spConfig.refresh_token.slice(0, 30) + "...There's always something I could not tell you!";
            }
            r.push(drive);
        }
        return Msg.html_json(200, { DRIVE_MAP: r });
    }
    if (_event.body.password !== onepoint.config.G_CONFIG.admin_password) return Msg.info(403, '管理员密码错误');
    return Msg.html_json(200, onepoint.config);
}

ajax_funcs['cache'] = () => {
    //return Msg.html_json(200, cache);
    return Msg.html_json(200, oneCache.search());
}

ajax_funcs['event'] = () => {
    return Msg.html_json(200, _event);
}

ajax_funcs['logs'] = () => {
    return Msg.html_json(200, oneCache.eventlog[Number(_event.query.type) || 0]);
}

ajax_funcs['share'] = () => {
    let url = `${_event.query.path}?token=${getmd5(DRIVE_MAP[_event.query.path].password + _event.query.time)}&expiresdate=${_event.query.time}`;
    return Msg.html_json(200, { url });
}

ajax_funcs['save'] = async () => {
    let config = onepoint.config;
    let newConfig = _event.body;

    if (newConfig.G_CONFIG) {
        if (newConfig.G_CONFIG.admin_password || newConfig.G_CONFIG.admin_username) {
            if (newConfig.G_CONFIG.admin_password_old !== config.G_CONFIG.admin_password) {
                return Msg.info(403, '密码错误,保存失败');
            } else {
                delete newConfig.G_CONFIG.admin_password_old;
            }
        }
        config.G_CONFIG = Object.assign(config.G_CONFIG, newConfig.G_CONFIG);
    }
    //@flag 这里先这样设置
    if (newConfig.DOMAIN_MAP) {
        config.DOMAIN_MAP = newConfig.DOMAIN_MAP;
        config.DRIVE_MAP = newConfig.DRIVE_MAP;
    } else if (newConfig.DRIVE_MAP) {
        for (let k in config.DRIVE_MAP) {
            if (newConfig.DRIVE_MAP[k]) {
                if (!newConfig.DRIVE_MAP[k].isNew) newConfig.DRIVE_MAP[k] = config.DRIVE_MAP[k];
                else delete newConfig.DRIVE_MAP[k].isNew;
            }
        }
        config.DRIVE_MAP = newConfig.DRIVE_MAP;
    }
    onepoint.updateConfig(config);//body is an object
    await onepoint.saveConfig();
    return Msg.info(200, 'success');
}

const vue_html = fs.readFileSync(path.resolve(__dirname, '../views/admin/index.html')).toString();