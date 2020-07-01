let { Msg } = require("./msgutils");
let { getmime } = require('./nodeutils');

class OneCache {

    constructor() {
        this.createTime = new Date();
    }

    initDrives(keyPaths, file_max_age = 300, list_max_age = 86400) {//5min
        this.initTime = new Date();
        this.eventlog = [[], [], [], []];//normal, api, xx, admin
        this.root = { type: undefined, data: { type: 3, name: 'root', size: NaN, mime: "", time: this.initTime }, next_obj: {} };
        this.LIST_MAX_MILLSEC = list_max_age * 1000;
        this.FILE_MAX_MILLSEC = file_max_age * 1000;
        this.driveCache = {};
        let date = new Date().toISOString();
        keyPaths.forEach((path) => {
            let ps = path.split('/').filter((e) => { return !!e });
            let pt = this.root;
            for (let i = 0; i < ps.length; i++) {
                if (!pt.next_obj[ps[i]]) pt.next_obj[ps[i]] = { type: undefined, drive: path, data: { type: 3, name: ps[i], size: NaN, mime: "", time: date }, next_obj: {} };
                pt = pt.next_obj[ps[i]];
            }
        });
        OneCache._genNextDrive(this.root);
    }
    getNodeByPath(path) {
        let ps = path.split('/').filter((e) => { return !!e });
        let pt = this.root;
        for (let i = 0; i < ps.length; i++) {
            if (!pt.next_obj[ps[i]]) pt.next_obj[ps[i]] = { type: undefined, next_obj: {} };
            pt = pt.next_obj[ps[i]];
        }
        return pt;
    }

    addList(pt, msg, sp_page) {
        let next_obj = sp_page === -1 ? {} : pt.next_obj;
        msg.data.list.forEach(e => {
            if (e.url) {
                next_obj[e.name] = { type: 0, data: e, url: e.url, date: Date.now() + this.FILE_MAX_MILLSEC, next_obj: {} };
                delete e.url;
            } else next_obj[e.name] = { type: undefined, data: e, next_obj: {} };
            //@info 这种是处理不声明mime的流氓式上传导致的mime不准确问题
            if (e.mime === 'application/octet-stream') e.mime = getmime(e.name);
        });


        //@info 这里可能会出现挂载drive不显示在列表中,小概率事件 不添加
        if (sp_page === -1 && pt.next_drive) {//map add
            pt.next_drive.forEach(e => {
                next_obj[e.data.name] = e;
            });
            let next_arr = [];
            for (let e in next_obj) {
                next_arr.push(next_obj[e].data);
            }
            msg.data.list = next_arr;
        }

        msg.data.list.sort((e1, e2) => {
            if (e1.type > e2.type) return -1;//云盘 文件夹 文件 排序
            else if (e1.type < e2.type) return 1;
            let x1 = e1.name.toLowerCase();
            let x2 = e2.name.toLowerCase();
            if (x1 < x2) return -1;
            else if (x1 > x2) return 1;
            else return 0;
        });

        if (sp_page === -1) {
            pt.type = 1;
            pt.next_obj = next_obj;
            pt.next_arr = msg.data.list;
            pt.date = Date.now() + this.LIST_MAX_MILLSEC;
        } else {
            msg.date = Date.now() + this.LIST_MAX_MILLSEC;
            if (!pt.sp_list) pt.sp_list = {};
            pt.sp_list[sp_page] = msg;
            if (sp_page !== 0) {
                let prev = Object.keys(pt.sp_list).find(k => {
                    return pt.sp_list[k].data.nextToken === sp_page;
                });
                if (prev) msg.data.prev = "?sp_page=" + prev;
            }
        }

    }

    delPathCache(path) {
        let ps = path.split('/').filter((e) => { return !!e });
        let pt = this.root, i;
        for (i = 0; i < ps.length - 1; i++) {//删除一个节点时,需要更新父节点,所以此处只需要找到父节点即可
            if (!pt.next_obj[ps[i]]) return;//找不到说明没有该项缓存,返回即可
            pt = pt.next_obj[ps[i]];
        }
        pt.type = undefined;
        let next_obj = {};//在该节点为列表时,列表下的子列表也有可能失效,需要更新
        if (pt.next_drive) {//恢复原有的drive map 否则将会找不到模块
            pt.next_drive.forEach(e => {
                next_obj[e.data.name] = e;
            });
        }
        pt.next_obj = next_obj;
        if (pt.sp_list) delete pt.sp_list;
    }
    /**
     * 注意此项先缓存,后再取缓存结果. 即 msg 可能会被改变
     */
    addMsg(path, msg, cmd, desPath) {
        if (cmd === 'ls') {
            let pt = this.getNodeByPath(path);
            if (msg.type === 0) {
                let file = msg.data.file;
                if (file.mime === 'application/octet-stream') file.mime = getmime(file.name);
                pt.type = 0;
                pt.data = file;
                pt.url = msg.data.url;
                pt.date = Date.now() + this.FILE_MAX_MILLSEC;
            } else if (msg.type === 1) {
                this.addList(pt, msg, msg.sp_page);
            }
        } else if (['mkdir', 'touch', 'upload', 'ren', 'rm'].includes(cmd)) {
            this.delPathCache(path);//mkdir 多层的处理起来比较麻烦,这里假设每次只新建一个文件夹
        } else if (['mv', 'cp'].includes(cmd)) {
            this.delPathCache(path);
            this.delPathCache(desPath);
        }
    }
    getDrivePath(path) {
        let ps = path.split('/').filter((e) => { return !!e });
        let pt = this.root;
        let dpath = '/';
        for (let i = 0; i < ps.length; i++) {
            if (!pt.next_obj[ps[i]]) break;
            pt = pt.next_obj[ps[i]];
            if (pt.data && pt.data.type === 3) dpath += ps[i] + '/';
        }
        return dpath;
    }
    getMsg(path, sp_page) {
        sp_page = sp_page || 0;
        let ps = path.split('/').filter((e) => { return !!e });
        let pt = this.root, i;
        for (i = 0; i < ps.length; i++) {
            if (!pt.next_obj[ps[i]]) break;
            pt = pt.next_obj[ps[i]];
        }
        let msg;
        if (i < ps.length) {
            if (i === ps.length - 1 && pt.type !== undefined) return Msg.info(404);//充分条件, 不为undefined一定是404,反过来不一定成立.
        } else if (pt.type === 1 && pt.date > Date.now()) {
            msg = Msg.list(pt.next_arr);
            msg.sp_page = -1;
        } else if (pt.type === 0 && pt.date > Date.now()) {
            msg = Msg.file(pt.data, pt.url);
        } else if (pt.sp_list && pt.sp_list[sp_page] && pt.sp_list[sp_page].date > Date.now()) {
            msg = pt.sp_list[sp_page];
        }
        if(msg)msg.isCache = true;
        return msg;
    }

    search(q) {
        return { root: OneCache._search(this.root) };
    }

    addEventLog(event, type) {
        this.eventlog[type].push({
            url: event.url,
            ip: event.sourceIp,
            time: event.start_time
        });
    }
}
OneCache._genNextDrive = (Obj) => {
    Obj.next_drive = Object.values(Obj.next_obj);
    if (Obj.next_drive && Obj.next_drive.length > 0) Obj.next_drive.forEach((e) => { OneCache._genNextDrive(e) });
}

OneCache._search = (Obj, name = 'root') => {
    //如果是文件夹节点,且不知道后面节点的状态
    // if (Obj.type === undefined && Obj.data.type !== 0) {
    //     return { name: Obj.data.name, data: null };
    // }
    let arr = [];
    console.log("search in: " + name);
    Object.keys(Obj.next_obj).forEach((e) => {
        let pt = Obj.next_obj[e];
        if (pt.data && pt.data.type === 0) {
            arr.push(e);
        }
        else {
            let folder = {};
            folder[e] = OneCache._search(pt, e);
            arr.push(folder);
        }
    });
    if (Obj.type === undefined) {
        if (arr.length > 0) arr.unshift(null);
        else return null;
    }
    return arr;
}

exports.OneCache = OneCache;

// DRIVE_MAP_KEY = ['/a/', '/b/', '/a/b/c/', '/a/b/d/', '/a/b/c/d', '/a/b/d/'];
// let one = new OneCache();
// one.initDrives(DRIVE_MAP_KEY);
// console.log(JSON.stringify(one.root, null, 2));