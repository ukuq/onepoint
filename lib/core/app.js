const { cookie: _cookie, querystring, url: _url } = require('../utils/node');
const { PAGE_PREFIX, PATH_DOWN } = require('../conf/sys-config');

// 必要时可以对 nextToken resolvePathDown 签名,防止恶意构造

class AppResponse {
    constructor() {
        this.headers = { 'Content-Type': 'text/html' };
        this.body = '[Default Message]';
        this.cookies = [];
        this.update(200);
    }

    update(status, type = '', data = {}) {
        this.status = status;
        this.type = type;
        this.data = data;
        this.stream = null;
    }

    get isPlain() {
        return this.type === '';
    }

    get isFile() {
        return this.type === 'file';
    }

    get isList() {
        return this.type === 'list';
    }

    get isRaw() {
        return this.type === 'raw';
    }

    addCookie(name, value, options) {
        this.cookies.push({ name, value, options });
    }
}

class AppContext {
    constructor({ method, path, headers = {}, body, query, cookies, stream = null, baseURL }) {
        const request = {};
        request.method = method;
        request.headers = headers;
        request.body = {};
        request.stream = stream;
        request.baseURL = baseURL || '//' + headers.host;

        // parse path
        request.path = decodeURIComponent(path.includes('?') ? _url.parse(path).pathname : path);

        // parse body
        if (method === 'POST' && typeof body === 'string' && headers['content-type']) {
            if (headers['content-type'].includes('application/x-www-form-urlencoded')) {
                request.body = querystring.parse(body);
            } else if (headers['content-type'].includes('application/json')) {
                request.body = JSON.parse(body);
            }
        }

        // parse query
        request.query = query ? (typeof query === 'string' ? querystring.parse(_url.parse(query).query) : query) : {};

        // parse cookie
        request.cookies = cookies ? cookies : headers.cookie ? _cookie.parse(headers.cookie) : {};

        this.request = request;
        this.state = { level: 0, time: Date.now() };
        this.response = new AppResponse();
    }

    throw(status, msg, properties = {}) {
        const err = new Error(msg);
        err.status = status;
        err.expose = true;
        err.data = properties;
        throw err;
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
        if (nextToken) {
            nextToken = PAGE_PREFIX + nextToken;
        }
        this.response.update(200, 'list', { list, nextToken });
    }

    respondOne(file) {
        this.response.update(200, 'file', { file });
    }

    respondRaw(status, headers = {}, body) {
        headers['Content-Type'] = headers['Content-Type'] || 'text/html';
        this.response.update(status, 'raw', '[raw object]');
        this.response.headers = headers;
        this.response.body = body;
    }

    respondJson(status, headers = {}, data) {
        headers['Content-Type'] = 'application/json';
        this.response.update(status, 'raw', '[json object]');
        this.response.headers = headers;
        this.response.body = JSON.stringify(data);
    }

    respondStream(status, headers, stream) {
        headers['Content-Type'] = 'application/octet-stream';
        this.response.update(status, 'raw', '[stream object]');
        this.response.headers = headers;
        this.response.body = '[stream object]';
        this.response.stream = stream;
    }

    resolvePathDown(path) {
        return encodeURI(this.request.baseURL + PATH_DOWN + this.state.p1 + path);
    }
    resolvePath(url) {
        return encodeURI(this.request.baseURL + this.state.p1 + url);
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
                return await middleware[index](ctx, async () => {
                    await useMiddleware(ctx, index + 1);
                });
            }
        })(ctx, 0);
        return ctx;
    },
};
