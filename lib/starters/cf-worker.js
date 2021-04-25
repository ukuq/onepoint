require('../utils/node').axios.defaults.adapter = require('../utils/fetchAdapter');

const app = require('../app');
const { RTError } = require('../utils/node');

async function readConfig() {
    if (typeof OPCONFIG === 'undefined') {
        throw new Error('未配置KV,请配置KV后重试. 可参考:https://github.com/ukuq/onepoint/tree/master/worker');
    }
    const c = await OPCONFIG.get('op-config');
    if (!c) {
        throw new Error('配置为空');
    }
    return JSON.parse(c);
}

async function writeConfig(config) {
    if (typeof OPCONFIG === 'undefined') {
        throw new Error("未配置KV,请配置KV后重试. 可参考:https://github.com/ukuq/onepoint/tree/master/worker'");
    }
    return OPCONFIG.put('op-config', JSON.stringify(config));
}

async function downloadForProxy({ url, headers, body = null, method = 'GET' }, reqHeaders, resHeaders) {
    if (url.startsWith('http')) {
        ['accept', 'accept-encoding', 'range'].forEach((k) => {
            if (reqHeaders[k]) {
                headers[k] = reqHeaders[k];
            }
        });
        return fetch(url, { method, headers, body }).then((res) => {
            ['Content-Type', 'Accept-Ranges', 'Content-Disposition', 'Content-Length', 'Content-Range'].forEach((k) => {
                const t = res.headers.get(k);
                if (t) {
                    resHeaders[k] = t;
                }
            });
            return { status: res.status, body: res.body };
        });
    } else {
        throw new RTError(403, 'InvalidDownload');
    }
}

app.initialize({
    name: 'cf-worker',
    readConfig,
    writeConfig,
    params: [],
});

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
                    headers: new Headers({
                        'access-control-allow-origin': '*',
                        'content-type': 'application/json',
                    }),
                }
            );
        })
    );
});

async function handleEvent(event) {
    const request = event.request;
    const url = new URL(request.url);
    const headers = {};
    for (const [k, v] of request.headers.entries()) {
        headers[k] = v;
    }
    const req = {
        method: request.method,
        path: url.pathname,
        headers,
        body: await request.text(),
        query: url.search,
        baseURL: 'https://' + headers.host,
    };
    const res = await app.handleRequest(req).then(async (response) => {
        if (response.callback_down) {
            const r = await downloadForProxy(response.callback_down, headers, response.headers);
            response.status = r.status;
            response.body = r.body;
        }
        return response;
    });
    return new Response(res.body, {
        status: res.status,
        headers: res.headers,
    });
}
