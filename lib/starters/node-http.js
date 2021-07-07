const { PORT, NODE_ENV } = require('../conf/sys-config');
process.env.NODE_ENV = NODE_ENV;

const http = require('http');
const app = require('../app');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { RTError, P, mime, request, exposeHeadersWhenProxy } = require('../utils/node');

const CONFIG_FILE_PATHS = [path.resolve('/', 'etc/op-config.json'), path.resolve(__dirname, '../conf/op-config.json')];

async function readConfig() {
    for (const path of CONFIG_FILE_PATHS) {
        if (fs.existsSync(path)) {
            logger.log('read config from:' + path);
            return JSON.parse(fs.readFileSync(path, 'utf8'));
        }
    }
    return {};
}

async function writeConfig(config, { x_node_config_path: config_file_path }) {
    if (!CONFIG_FILE_PATHS.includes(config_file_path)) {
        throw new Error('config-file-path is invalid: ' + config_file_path);
    }

    for (const path of CONFIG_FILE_PATHS) {
        if (config_file_path === path) {
            break;
        }
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
    }
    fs.writeFileSync(config_file_path, JSON.stringify(config, null, 2));
}

app.initialize({
    name: 'node-http',
    readConfig,
    writeConfig,
    params: [P('x_node_config_path', CONFIG_FILE_PATHS[1], '配置文件存放位置', 8, CONFIG_FILE_PATHS, false, true)],
});

async function handleRequest(req, res) {
    const s = process.hrtime.bigint();
    return new Promise((resolve, reject) => {
        const request = {
            method: req.method,
            path: req.url,
            headers: req.headers,
            body: '',
            query: req.url,
            ip: [req.connection.remoteAddress],
            baseURL: 'http://' + req.headers.host,
        };
        if (req.method === 'PUT') {
            request.body = req;
            resolve(request);
        } else {
            const buffer = [];
            req.on('data', (chunk) => {
                buffer.push(chunk);
            });
            req.on('end', () => {
                request.body = Buffer.concat(buffer).toString('utf8');
                resolve(request);
            });
            req.on('error', (err) => {
                reject(err);
            });
        }
    })
        .then((request) => app.handleRequest(request))
        .then((response) => {
            if (response.callback_down) {
                const { url, method, headers = {}, body } = response.callback_down;
                req.headers.range && (headers.range = req.headers.range);
                if (url.startsWith('file:')) {
                    const p = url.slice('file://'.length);
                    // file download
                    const stats = fs.statSync(p);
                    if (!stats.isFile()) {
                        throw new RTError(403, 'NotDownloadable', { name: path.basename(p) });
                    }
                    const size = stats.size;
                    const h = response.headers;
                    h['accept-ranges'] = 'bytes';
                    h['content-type'] = mime.get(p);
                    h['content-disposition'] = 'attachment; filename=' + encodeURIComponent(path.basename(p));
                    const reqHttpRange = headers.range;
                    if (reqHttpRange) {
                        const m = /bytes=(?<start>\d*)-(?<end>\d*)/.exec(reqHttpRange) || { groups: {} };
                        const start = Number(m.groups.start) || 0;
                        const end = Number(m.groups.end) || Math.min(start + 1024 * 1024 * 5, size - 1);
                        if (!(start <= end && end < size)) {
                            throw new RTError(403, 'InvalidHttpRange', { range: reqHttpRange, size });
                        }
                        h['content-length'] = end - start + 1;
                        h['content-range'] = `bytes ${start}-${end}/${size}`;
                        res.writeHead(206, h);
                        fs.createReadStream(p, { start, end }).pipe(res);
                    } else {
                        h['content-length'] = size;
                        res.writeHead(200, h);
                        fs.createReadStream(p).pipe(res);
                    }
                } else {
                    // http
                    return request.request({ url, method, headers, body, responseType: 'stream' }).then((r) => {
                        const h2 = response.headers;
                        Object.entries(r.headers).forEach(([k, v]) => exposeHeadersWhenProxy(k) && (h2[k] = v));
                        res.writeHead(r.status, h2);
                        r.data.pipe(res);
                    });
                }
                logger.debug('stream: ' + url + ' ' + headers.range);
            } else {
                res.writeHead(response.status, response.headers);
                res.end(response.body);
                logger.debug(`time consume:${Number(process.hrtime.bigint() - s) / 1000000}`);
            }
        })
        .catch((err) => {
            res.writeHead(err.status || 500, {
                'access-control-allow-origin': '*',
                'content-type': 'application/json',
            });
            res.end(
                JSON.stringify({
                    error: err.type || 'UnknownError',
                    data: err.data || {},
                    message: err.message,
                })
            );
        });
}

const server = http.createServer(handleRequest).listen(PORT);

if (server.address()) {
    logger.log(`Running on ${process.platform}, port:${server.address().port}`);
    Object.values(require('os').networkInterfaces())
        .map((e) => (e[0].family === 'IPv6' ? e[1].address : e[0].address))
        .filter((e) => e)
        .sort()
        .forEach((e) => logger.log(`http://${e}:${PORT}`));
}
