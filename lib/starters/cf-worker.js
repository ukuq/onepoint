require('../utils/node').axios.defaults.adapter = require('../utils/fetchAdapter');
require('../conf/sys-config').LOAD_ART_TEMPLATE = false;

const app = require('../app');
const {RTError} = require("../utils/node");

async function readConfig() {
    if (typeof OPCONFIG === 'undefined') {
        throw new Error('no kv, 未配置KV, 请配置KV后访问');
    }
    return JSON.parse(await OPCONFIG.get('op-config'));
}

async function writeConfig(config) {
    if (typeof OPCONFIG === 'undefined') {
        throw new Error('no kv');
    }
    return OPCONFIG.put('op-config', JSON.stringify(config));
}

async function downloadForProxy({url, headers, body = null, method = 'GET'}, reqHttpRange, resHeaders) {
    if (url.startsWith('http')) {
        if (reqHttpRange) {
            headers.range = reqHttpRange;
        }
        return fetch(url, {method, headers, body}).then((res) => {
            ['Content-Type', 'Accept-Ranges', 'Content-Disposition', 'Content-Length', 'Content-Range'].forEach(k => {
                const t = res.headers.get(k);
                if (t) {
                    resHeaders[k] = t;
                }
            });
            return {status: res.status, body: res.body};
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
    event.respondWith(handleEvent(event).catch((err) => {
        return new Response(JSON.stringify({error: 500, err}), {
            status: 500,
            headers: new Headers({'content-type': 'application/json'})
        });
    }));
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
        baseURL: 'https://' + headers.host
    };
    const res = await app.handleRequest(req).then(async response => {
        if (response.callback_down) {
            const r = await downloadForProxy(response.callback_down, request.headers.get('range'), response.headers);
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
