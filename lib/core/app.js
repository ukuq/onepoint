const {RTError} = require('../utils/node');
const {cookie: _cookie, querystring, url: _url} = require('../utils/node');

class AppRequest {
    constructor({method, path, headers, body, query, cookies, baseURL}) {
        this.method = method;

        // parse path
        this.path = decodeURIComponent(path.includes('?') ? _url.parse(path).pathname : path);

        this.headers = headers;

        // parse body
        if (method === 'POST' && typeof body === 'string' && headers['content-type']) {
            if (headers['content-type'].includes('application/x-www-form-urlencoded')) {
                this.body = querystring.parse(body);
            } else if (headers['content-type'].includes('application/json')) {
                this.body = JSON.parse(body);
            } else {
                this.body = {};
            }
        } else {
            this.body = body;
        }

        // parse query
        this.query = typeof query === 'string' ? querystring.parse(_url.parse(query).query) : query;

        // parse cookie
        this.cookies = cookies ? cookies : headers.cookie ? _cookie.parse(headers.cookie) : {};

        this.baseURL = baseURL || 'http://' + headers.host;
    }
}

class AppResponse {
    constructor() {
        this.headers = {'Content-Type': 'text/html; charset=utf-8'};
        this.body = '[Default Message]';
        this.update(200);
    }

    update(status, type = '', data = {message: 'success'}) {
        this.status = status;
        this.type = type;
        this.data = data;
    }

    get isPlain() {
        return this.type === '';
    }

    get isFile() {
        return this.type === 'file';
    }

    get isFolder() {
        return this.type === 'folder';
    }

    get isList() {
        return this.type === 'list';
    }

    get isRaw() {
        return this.type === 'raw';
    }

    addCookie(name, value, options) {
        if (!this.headers['Set-Cookie']) {
            this.headers['Set-Cookie'] = [];
        }
        this.headers['Set-Cookie'].push(_cookie.serialize(name, value, options));
    }
}

class AppContext {
    constructor(request) {
        this.request = new AppRequest(request);
        this.response = new AppResponse();
        this.state = {level: 0, time: Date.now(), p1: '', p2: '/'};
    }

    get path() {
        return this.state.p1 + this.state.p2;
    }

    throw(status, msg, properties) {
        throw new RTError(status, msg, properties);
    }

    assert(value, status, message, properties) {
        if (!value) {
            this.throw(status, message, properties);
        }
    }

    respond(status, data = 'success') {
        if (typeof data === 'string') {
            this.response.update(status, '', {message: data});
        } else {
            this.response.update(status, '', data);
        }
    }

    respondList(list, nextToken = null) {
        this.response.update(200, 'list', {list, nextToken});
    }

    respondOne(item, down = null) {
        if (item.type === 0) {
            this.response.update(200, 'file', {file: item});
            this.response.down = down;
        } else {
            this.response.update(200, 'folder', {folder: item});
        }
    }

    respondRaw(status, headers = {}, body) {
        headers['Content-Type'] = headers['Content-Type'] || 'text/html; charset=utf-8';
        this.response.update(status, 'raw', '[raw object]');
        this.response.headers = headers;
        this.response.body = body;
    }

    redirect(url) {
        if (url.startsWith('?')) {
            const {path, query, baseURL} = this.request;
            const q = querystring.stringify(Object.assign({}, query, querystring.parse(url)));
            url = baseURL + encodeURI(path) + q ? '?' + q : '';
        } else if (url.startsWith('//')) {
        } else if (url.startsWith('/')) {
            url = this.request.baseURL + encodeURI(url);
        }
        const headers = this.response.headers;
        headers.Location = url;
        headers['Content-Type'] = 'text/html; charset=utf-8';
        this.respondRaw(302, headers, `Redirecting to <a href="${url}">${url}</a>.`);
    }

    addCookie(name, value, options) {
        this._p0 = _url.parse(this.request.baseURL).pathname;
        if (this._p0.endsWith('/')) {
            this._p0 = this._p0.slice(0, -1);
        }
        if (this._p0 && options && options.path) {
            options.path = this._p0 + options.path;
        }
        this.response.addCookie(name, value, options);
    }

    lazySave() {
        this.state.save = true;
    }
}

module.exports = {
    middleware: [],
    use(fn) {
        if (typeof fn === 'function' && !this.middleware.includes(fn)) {
            this.middleware.push(fn);
        }
        return this;
    },
    async handleRequest(req) {
        const ctx = new AppContext(req);
        const middleware = this.middleware;
        await (async function useMiddleware(ctx, index) {
            if (index < middleware.length) {
                return middleware[index](ctx, async () => useMiddleware(ctx, index + 1));
            }
        })(ctx, 0);
        return ctx;
    },
};
