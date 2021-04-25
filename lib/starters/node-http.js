const { PORT, NODE_ENV } = require('../conf/sys-config');
process.env.NODE_ENV = NODE_ENV;

const http = require('http');
const app = require('../app');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { RTError, _P, mime, axios } = require('../utils/node');

const CONFIG_FILE_PATHS = [path.resolve('/', 'etc/op-config.json'), path.resolve(__dirname, '../conf/op-config.json')];

async function readConfig() {
    for (const path of CONFIG_FILE_PATHS) {
        if (fs.existsSync(path)) {
            logger.log('read config from:' + path);
            return JSON.parse(fs.readFileSync(path, 'utf8'));
        }
    }
    throw new Error('configuration file not find');
}

async function writeConfig(config) {
    const config_file_path = config.starter.x_node_config_path;
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

async function downloadForProxy({ url, headers, body, method }, reqHeaders, resHeaders) {
    const reqHttpRange = reqHeaders.range;
    if (url.startsWith('file://')) {
        const p = url.slice('file://'.length);
        const stats = fs.statSync(p);
        if (!stats.isFile()) {
            throw new RTError(403, 'NotDownloadable', { name: path.basename(p) });
        }
        const size = stats.size;

        const h = resHeaders;
        h['content-type'] = mime.get(p);
        h['accept-ranges'] = 'bytes';
        h['content-disposition'] = 'attachment; filename=' + encodeURIComponent(path.basename(p));
        if (reqHttpRange) {
            const m = /bytes=(?<start>\d*)-(?<end>\d*)/.exec(reqHttpRange) || { groups: {} };
            const start = Number(m.groups.start) || 0;
            const end = Number(m.groups.end) || size - 1;
            if (!(start <= end && end < size)) {
                throw new RTError(403, 'InvalidHttpRange', { range: reqHttpRange, size });
            }
            h['content-length'] = end - start + 1;
            h['content-range'] = `bytes ${start}-${end}/${size}`;
            return [206, h, fs.createReadStream(p, { start, end })];
        } else {
            h['content-length'] = size;
            return [200, h, fs.createReadStream(p)];
        }
    } else if (url.startsWith('http')) {
        ['accept', 'accept-encoding', 'range'].forEach((k) => {
            if (reqHeaders[k]) {
                headers[k] = reqHeaders[k];
            }
        });
        return axios
            .request({
                method,
                data: body,
                headers,
                url,
                responseType: 'stream',
            })
            .then(({ status, data, headers }) => {
                ['content-type', 'content-disposition', 'content-length', 'content-range', 'content-encoding'].forEach((k) => {
                    if (headers[k]) {
                        resHeaders[k] = headers[k];
                    }
                });
                return [status, resHeaders, data];
            });
    } else {
        throw new RTError(403, 'InvalidDownloadUrl');
    }
}

app.initialize({
    name: 'node-http',
    readConfig,
    writeConfig,
    params: [_P('x_node_config_path', CONFIG_FILE_PATHS[1], '配置文件存放位置', 8, CONFIG_FILE_PATHS, false, true)],
});

const server = http
    .createServer((req, res) => {
        const s = process.hrtime.bigint();
        new Promise((resolve) => {
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
                request.stream = req;
                resolve(request);
            } else {
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk;
                });
                req.on('end', () => {
                    request.body = body;
                    resolve(request);
                });
            }
        })
            .then(async (request) => {
                const response = await app.handleRequest(request);
                if (response.callback_down) {
                    const r = await downloadForProxy(response.callback_down, req.headers, response.headers);
                    res.writeHead(r[0], r[1]);
                    r[2].pipe(res);
                } else {
                    res.writeHead(response.status, response.headers);
                    res.end(response.body);
                }
                logger.debug(`time consume:${Number(process.hrtime.bigint() - s) / 1000000}`);
            })
            .catch((err) => {
                res.writeHead(err.status || 500, {
                    'access-control-allow-origin': '*',
                    'content-type': 'application/json',
                });
                res.end(JSON.stringify({ error: err.type || 'UnknownError', data: err.data || {}, message: err.message }));
            });
    })
    .listen(PORT);

if (server.address()) {
    logger.log(`Running on ${process.platform}, port:${server.address().port}`);
    Object.values(require('os').networkInterfaces())
        .map((e) => (e[0].family === 'IPv6' ? e[1].address : e[0].address))
        .filter((e) => e)
        .sort()
        .forEach((e) => logger.log(`http://${e}:${PORT}`));
}
