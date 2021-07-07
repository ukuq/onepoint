exports.query2Obj = function (s = '', o = {}) {
    for (const [k, v] of new URLSearchParams(s)) {
        o[k] = v;
    }
    return o;
};

exports.cookie2Str = function (n, v, o = {}) {
    let s = encodeURIComponent(n) + '=' + encodeURIComponent(v);
    const { maxAge, domain, path, expires, httpOnly, secure, sameSite } = o;
    s += typeof maxAge === 'number' ? '; Max-Age=' + maxAge : '';
    domain ? (s += '; Domain=' + domain) : '';
    path ? (s += '; Path=' + path) : '';
    expires ? (s += '; Expires=' + expires) : '';
    httpOnly ? (s += '; HttpOnly') : '';
    secure ? (s += '; Secure') : '';
    sameSite ? (s += '; SameSite=' + sameSite) : '';
    return s;
};

exports._sha1 = require('./tiny-sha1');

exports.path = {
    basename: (s) => (s ? s.slice(s.lastIndexOf('/') + 1) : ''),
    extname: (s) => (s ? s.slice(s.lastIndexOf('.') + 1) : ''),
};

const request = (exports.request = require('./tiny-request'));
request.defaults.timeout = 5000;

exports.exposeHeadersWhenProxy = function (k) {
    if (typeof k !== 'string') {
        return false;
    }
    k = k.toLowerCase();
    if (k.startsWith('content-')) {
        return k;
    }
    return ['accept-ranges', 'date'].includes(k);
};

const mime = require('./mime.js');
exports.mime = {
    get: (path) => mime[path.slice(path.lastIndexOf('.') + 1)] || 'application/vnd.op-unknown',
};

const NUM_CHARS = {};
'0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'.split('').forEach((v, i) => {
    NUM_CHARS[i] = v;
    NUM_CHARS[v] = i;
});

exports.NumberUtil = {
    parse62: (s) => {
        let num = 0,
            base = 1;
        s.split('')
            .reverse()
            .forEach((c) => {
                num += NUM_CHARS[c] * base;
                base *= 62;
            });
        return num;
    },
    to62: (n) => {
        const arr = [];
        while (n > 0) {
            arr.push(NUM_CHARS[n % 62]);
            n = Math.floor(n / 62);
        }
        if (arr.length === 0) {
            return '0';
        }
        return arr.reverse().join('');
    },
};

const { parseErrorMsg } = require('./error-message');

class RTError extends Error {
    constructor(status, type, data) {
        super(parseErrorMsg(type, data || {}));
        this.status = status;
        this.type = type;
        this.data = data || {};
        this.expose = true;
    }
}

exports.RTError = RTError;

const logger = require('./logger');

class IDHelper {
    constructor(root) {
        this.root = root;
        this.icache = {};
        this.etime = Date.now() + 3600 * 1000;
    }

    get isValid() {
        return Date.now() < this.etime;
    }

    async findChildItem(pid, name) {
        return Promise.reject(new RTError(500, 'unsupported method: findChildItem(' + pid + ',' + name + ')'));
    }

    async getIDByPath(path = '/') {
        return this.getItemByPath(path).then((e) => e.id);
    }

    async getItemByPath(path) {
        return this._getItemByPath(
            path.split('/').filter((e) => e),
            { type: 1, id: this.root }
        );
    }

    async _getItemByPath(paths, item) {
        if (paths.length === 0) {
            return item;
        }
        const pid = item.id;
        const cache = this.icache[pid] || {};
        const name = paths.shift();
        if (!cache[name] || cache[name].etime < Date.now()) {
            logger.info('pid:' + pid + ' ' + name);
            const cItem = await this.findChildItem(pid, name);
            if (!cItem) {
                throw new RTError(404, 'ItemNotExist');
            }
            cItem.etime = Date.now() + 300000;
            cache[name] = cItem;
            // 保证path中出现的都是文件夹
            if (cItem.type !== 1 && paths.length > 0) {
                throw new RTError(404, 'ItemNotExist');
            }
        }
        this.icache[pid] = cache;
        return this._getItemByPath(paths, cache[name]);
    }
}

exports.IDHelper = IDHelper;

exports.P = exports._P = (name, value, desc, level, meta, textarea, star) => {
    const r = { name, value, desc, level };
    if (Array.isArray(meta)) {
        r.select = meta;
    } else {
        r.placeholder = meta;
        if (textarea) {
            r.textarea = true;
        }
    }
    if (star) {
        r.star = true;
    }
    if (meta.hidden) {
        r.hidden = true;
    }
    return r;
};

exports.beautifyObject = function beautifyObject(ob) {
    if (Array.isArray(ob)) {
        return ob.map((e) => beautifyObject(e));
    }
    if (typeof ob === 'string' || typeof ob === 'number' || typeof ob === 'boolean') {
        return ob;
    }
    const nob = {};
    Object.keys(ob)
        .sort()
        .forEach((k) => {
            nob[k] = typeof ob[k] === 'object' ? beautifyObject(ob[k]) : ob[k];
        });
    return nob;
};

exports.deleteAttributes = function (obj, arr) {
    arr.forEach((e) => delete obj[e]);
};
