globalThis.module = {};
globalThis.require = () => 0;
globalThis.__dirname = '';

const app = require('../app');
const { P, exposeHeadersWhenProxy, request: _request } = require('../utils/node');

//otherwise, Date.now() is 0
function initApp() {
    initApp = () => 0;

    const KVConfig = typeof OPCONFIG === 'undefined' ? null : OPCONFIG;

    function ensureConfigExist() {
        if (typeof KVConfig === 'undefined') {
            throw new Error('KV Namespace not found');
        }
    }

    async function readConfig() {
        return KVConfig ? JSON.parse((await KVConfig.get('op-config')) || '{}') : {};
    }

    async function writeConfig(config) {
        ensureConfigExist();
        return KVConfig.put('op-config', JSON.stringify(config));
    }

    const h = '注意，必需新建KV，并将其绑定到对应的 Workers KV Namespace，绑定的名称为OPCONFIG';

    app.initialize({
        name: 'cf-worker',
        readConfig,
        writeConfig,
        params: [P('x_empty', '', h, 8, 'just let me empty', false, false)],
    });
}

async function handleEvent(event) {
    initApp();
    const request = event.request;
    const url = new URL(request.url);
    const h = {};
    for (let [k, v] of request.headers) {
        h[k] = v;
    }
    const req = {
        method: request.method,
        path: url.pathname,
        headers: h,
        body: await request.text(),
        query: url.search,
        ip: [request.headers.get('CF-Connecting-IP')],
    };
    return app.handleRequest(req).then((response) => {
        if (response.callback_down) {
            const { url, method, headers = {}, body } = response.callback_down;
            h.range && (headers.range = h.range);
            return _request.request({ url, method, headers, body, responseType: 'stream' }).then((r) => {
                const h2 = response.headers;
                Object.entries(r.headers).forEach(([k, v]) => exposeHeadersWhenProxy(k) && (h2[k] = v));
                return new Response(r.data, {
                    status: r.status,
                    headers: h2,
                });
            });
        }
        return new Response(response.body, {
            status: response.status,
            headers: response.headers,
        });
    });
}

addEventListener('fetch', (event) => {
    event.respondWith(
        handleEvent(event).catch((err) => {
            return new Response(
                JSON.stringify({
                    error: err.type || 'UnknownError',
                    data: err.data || {},
                    msg: err.message,
                }),
                {
                    status: err.status || 500,
                    headers: {
                        'access-control-allow-origin': '*',
                        'content-type': 'application/json',
                    },
                }
            );
        })
    );
});
