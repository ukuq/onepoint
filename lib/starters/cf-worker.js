const adapter = require('../utils/fetchAdapter');
require('../utils/node').axios.defaults.adapter = adapter;
require('../conf/sys-config').LOAD_ART_TEMPLATE = false;

const app = require('../app');

async function readConfig() {
    if (!OPCONFIG) {
        throw new Error('no kv');
    }
    return JSON.parse(await OPCONFIG.get('op-config'));
}

async function writeConfig(config) {
    if (!OPCONFIG) {
        throw new Error('no kv');
    }
    return OPCONFIG.put('op-config', JSON.stringify(config));
}

app.initialize({
    name: 'cf-worker',
    readConfig,
    writeConfig,
    params: [],
});

addEventListener('fetch', (event) => {
    event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
    const request = event.request;
    const url = new URL(request.url);
    const headers = {};
    for (const [k, v] of request.headers.entries()) {
        headers[k] = v;
    }
    const req = {method: request.method, path: url.pathname, headers, body: await request.text(), query: url.search};
    const res = await app.handleRequest(req);
    return new Response(res.body, {
        status: res.status,
        headers: res.headers,
    });
}
