let { Msg, formatDate } = require("./msgutils");

class OneCache {

    initDrives(keyPaths) {
        this.root = { type: undefined, next_obj: {} };
        let date = formatDate(new Date());
        keyPaths.forEach((path) => {
            let ps = path.split('/').filter((e) => { return !!e });
            let pt = this.root;
            for (let i = 0; i < ps.length; i++) {
                if (!pt.next_obj[ps[i]]) pt.next_obj[ps[i]] = { type: undefined, drive: path, data: { type: 3, name: ps[i], size: NaN, mime: "folder/onepoint", time: date }, next_obj: {} };
                pt = pt.next_obj[ps[i]];
            }
        });
        OneCache._genNextDrive(this.root);
    }
    addFile(path, fileInfo, downloadUrl) {
        if (path === '/') throw "Add you kidding me? File path should not be a '/'!";
        let ps = path.split('/').filter((e) => { return !!e });
        let pt = this.root;
        for (let i = 0; i < ps.length; i++) {
            if (!pt.next_obj[ps[i]]) pt.next_obj[ps[i]] = { type: undefined, next_obj: {} };
            pt = pt.next_obj[ps[i]];
        }
        pt.type = 0;
        pt.data = {};
        pt.data.fileInfo = fileInfo;
        pt.data.downloadUrl = downloadUrl;
        pt.date = new Date(new Date().valueOf() + 300000);//5 min
    }
    addList(path, fileInfoArr) {
        let ps = path.split('/').filter((e) => { return !!e });
        let pt = this.root;
        for (let i = 0; i < ps.length; i++) {
            if (!pt.next_obj[ps[i]]) pt.next_obj[ps[i]] = { type: undefined, next_obj: {} };
            pt = pt.next_obj[ps[i]];
        }
        let next_obj = {};
        fileInfoArr.forEach(e => {
            next_obj[e.name] = { type: undefined, data: e, next_obj: {} };
        });

        if (pt.next_drive) {//map add
            pt.next_drive.forEach(e => {
                next_obj[e.data.name] = e;
            });
        }

        let next_arr = [];
        for (let e in next_obj) {
            next_arr.push(next_obj[e].data);
        }
        next_arr.sort((e1, e2) => {
            let x1 = e1.name.toLowerCase();
            let x2 = e2.name.toLowerCase();
            if (x1 < x2) return -1;
            else if (x1 > x2) return 1;
            else return 0;
        });
        pt.type = 1;
        pt.next_obj = next_obj;
        pt.next_arr = next_arr;
        return next_arr;
    }
    /**
     * 注意此项先缓存,后再取缓存结果. 即 msg 可能会被改变
     */
    addMsg(path, msg) {
        if (msg.type === 0) this.addFile(path, msg.data.fileInfo, msg.data.downloadUrl);
        else if (msg.type === 1 && !msg.data.prevHref && !msg.data.nextHref) {
            msg.data.content = this.addList(path, msg.data.content);
        }
    }
    getMsg(path) {
        let ps = path.split('/').filter((e) => { return !!e });
        let pt = this.root, i;
        let dpath = '/';
        let msg;
        for (i = 0; i < ps.length; i++) {
            if (!pt.next_obj[ps[i]]) break;
            pt = pt.next_obj[ps[i]];
            if (pt.data && pt.data.type === 3) dpath += ps[i] + '/';
        }
        if (i < ps.length) {
            if (pt.type !== undefined) msg = Msg.info(404);//充分条件, 不为undefined一定是404,反过来不一定成立.
            else msg = Msg.info(0);////flag 标记未找到cache
        } else if (pt.type === 1) {
            msg = Msg.list(pt.next_arr);
        } else if (pt.type === 0 && pt.date > new Date()) {
            msg = Msg.file(pt.data.fileInfo, pt.data.downloadUrl);
        } else msg = Msg.info(0);
        msg.dpath = dpath;
        return msg;
    }
}
OneCache._genNextDrive = (Obj) => {
    Obj.next_drive = Object.values(Obj.next_obj);
    if (Obj.next_drive && Obj.next_drive.length > 0) Obj.next_drive.forEach((e) => { OneCache._genNextDrive(e) });
}

exports.OneCache = OneCache;

// DRIVE_MAP_KEY = ['/a/', '/b/', '/a/b/c/', '/a/b/d/', '/a/b/c/d', '/a/b/d/'];
// let one = new OneCache();
// one.initDrives(DRIVE_MAP_KEY);
// console.log(JSON.stringify(one.root, null, 2));