const { RTError } = require('../utils/node');
const { cookie: _cookie, querystring } = require('../utils/node');

class AppRequest {
    constructor({ method, path, headers, body, query, cookies, baseURL, ip }) {
        // UpperCase
        this.method = method;

        // parse path, path is just path,not url
        this.path = decodeURIComponent(/^[^?]+/.exec(path)[0]);

        this.headers = headers;

        // parse body, stream is not supposed
        this.body = {};
        if (method === 'POST' && typeof body === 'string' && headers['content-type']) {
            if (headers['content-type'].includes('application/x-www-form-urlencoded')) {
                this.body = querystring.parse(body);
            } else if (headers['content-type'].includes('application/json')) {
                this.body = JSON.parse(body);
            }
        }

        // parse query, object or like ?a=1&b=2 or a=1&b=2
        this.query = typeof query === 'string' ? querystring.parse(/^([^?]*\?)?(.*)/.exec(query)[2]) : query;

        // parse cookie
        this.cookies = cookies ? cookies : headers.cookie ? _cookie.parse(headers.cookie) : {};

        // empty or like https://example.com or https://example.com/sub
        if (baseURL) {
            this.baseURL = baseURL;
            const p0 = new URL(baseURL).pathname;
            this.baseURLP0 = p0.endsWith('/') ? p0.slice(0, -1) : p0;
        } else {
            this.baseURL = 'https://' + headers.host;
            this.baseURLP0 = '';
        }
        this.ip = ip;
    }
}

class AppResponse {
    constructor() {
        this.headers = { 'content-type': 'text/html; charset=utf-8' };
        this.body = '[Default Message]';
        this.update(200);
    }

    update(status, type = '', data = { message: 'success' }) {
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
        if (!this.headers['set-cookie']) {
            this.headers['set-cookie'] = [];
        }
        this.headers['set-cookie'].push(_cookie.serialize(name, value, options));
    }
}

class AppContext {
    constructor(request) {
        this.request = new AppRequest(request);
        this.response = new AppResponse();
        this.state = { level: 0, time: Date.now(), p1: '', p2: '/' };
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
            this.response.update(status, '', { message: data });
        } else {
            this.response.update(status, '', data);
        }
    }

    respondList(list, nextToken = null) {
        this.response.update(200, 'list', { list, nextToken });
    }

    respondOne(item, down = null) {
        if (item.type === 0) {
            this.response.update(200, 'file', { file: item });
            this.response.down = down;
        } else {
            this.response.update(200, 'folder', { folder: item });
        }
    }

    respondRaw(status, headers = {}, body) {
        headers['content-type'] = headers['content-type'] || 'text/html; charset=utf-8';
        this.response.update(status, 'raw', '[raw object]');
        this.response.headers = headers;
        this.response.body = body;
    }

    redirect(url, always = false) {
        if (url.startsWith('&')) {
            const { path, query, baseURL } = this.request;
            const q = querystring.stringify(Object.assign({}, query, querystring.parse(url.slice(1))));
            url = baseURL + encodeURI(path) + '?' + q;
        } else if (url.startsWith('?')) {
            const { path, baseURL } = this.request;
            url = baseURL + encodeURI(path) + url;
        } else if (!url.startsWith('//') && url.startsWith('/')) {
            url = this.request.baseURL + encodeURI(url);
        }
        const headers = this.response.headers;
        headers.Location = url;
        headers['content-type'] = 'text/html; charset=utf-8';
        headers['referrer-policy'] = 'same-origin'; // ali-drive none referrer
        this.respondRaw(always ? 301 : 302, headers, `Redirecting to <a href="${url}">${url}</a>.`);
    }

    addCookie(name, value, options) {
        if (this.request.baseURLP0 && options && options.path) {
            options.path = this.request.baseURLP0 + options.path;
        }
        this.response.addCookie(name, value, options);
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
