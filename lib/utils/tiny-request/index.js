/**
 * 很純粹的http请求工具
 *
 * 不支持重定向，需要手动处理
 *
 * method 需要大写
 * url 可以包含中文字符
 * headers 字段大写格式
 * responseType 支持 json text
 *
 * 支持默认baseURL, headers
 */

function setIfUndefined(o, a, v) {
    o[a] === undefined ? (o[a] = v) : '';
}

const adapters = {};
adapters.n = require('./node-http');
adapters.f = require('./browser-fetch');

function getDefaultAdapter() {
    return adapters[typeof fetch === 'function' ? 'f' : 'n'];
}

function mergeConfig(config1, config2) {
    return Object.assign({}, config1, config2, { headers: Object.assign({}, config1.headers, config2.headers) });
}

function buildFullURL(url, baseURL, params) {
    const u = new URL(url, baseURL || 'http://example.com');
    if (!['http:', 'https:'].includes(u.protocol)) {
        // url中包含了 :
        if (url[0] === '/') {
            u.href = baseURL;
            u.pathname = url;
        } else {
            u.href = baseURL + url;
        }
    }

    if (params) {
        const _searchParams = u.searchParams;
        Object.entries(params).forEach(([k, v]) => _searchParams.set(k, v.toString()));
    }

    return u.href;
}

const defaults = {
    baseURL: '',
    headers: {},
    responseType: 'json',
    adapter: getDefaultAdapter(),
    onResponse: (d) => d,
};

class Request {
    constructor(config) {
        this.defaults = config;
    }

    async request(config) {
        config = mergeConfig(this.defaults, config);

        const { url, method, headers, body, data, baseURL, params } = config;
        const req = { method: (method || 'GET').toUpperCase(), headers };

        req.url = buildFullURL(url, baseURL, params);

        setIfUndefined(headers, 'User-Agent', 'tiny-request/0.0');
        setIfUndefined(headers, 'Accept', 'application/json, text/plain, */*');

        if (['GET', 'HEAD'].includes(req.method)) {
            req.body = null;
        } else if (body) {
            req.body = body;
        } else if (data instanceof URLSearchParams) {
            setIfUndefined(headers, 'Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
            req.body = data.toString();
        } else if (data && typeof data === 'object') {
            setIfUndefined(headers, 'Content-Type', 'application/json;charset=utf-8');
            req.body = JSON.stringify(data);
        } else if (typeof data === 'string') {
            req.body = data;
        } else {
            req.body = '';
        }

        return config
            .adapter(req, config)
            .then((res) => {
                if (res.data && config.responseType === 'json' && typeof res.data === 'string') {
                    try {
                        res.data = JSON.parse(res.data);
                    } catch (e) {}
                }
                res.request = req;
                res.config = config;
                return res;
            })
            .then(config.onResponse)
            .catch((e) => {
                e.isHttpError = true;
                if (Object.getPrototypeOf(e) === Error.prototype) {
                    e.message = 'Internal HttpError: ' + e.message;
                }
                return Promise.reject(e);
            });
    }

    async reject() {}
}

// Provide aliases for supported request methods
['delete', 'get', 'head', 'options'].forEach((m) => {
    Request.prototype[m] = function (url, config = {}) {
        config.method = m;
        config.url = url;
        return this.request(config);
    };
});

['post', 'put', 'patch'].forEach((m) => {
    Request.prototype[m] = function (url, data = '', config = {}) {
        config.method = m;
        config.url = url;
        config.data = data;
        return this.request(config);
    };
});

// Create the default instance to be exported
const request = new Request(defaults);

request.Request = Request;

// Factory for creating new instances
request.create = function create(config) {
    return new Request(mergeConfig(this.defaults, config));
};

module.exports = request;

// Allow use of default import syntax in TypeScript
module.exports.default = request;
