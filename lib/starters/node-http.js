const http = require('http');
const app = require('../app');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const {RTError, _P} = require('../utils/node');
const {mime, axios} = require('../utils/node');

const CONFIG_FILE_PATHS = [path.resolve('/', 'etc/op-config.json'), path.resolve(__dirname, '../conf/op-config.json')];

let config_file_path = CONFIG_FILE_PATHS[2];

async function readConfig() {
    for (const path of CONFIG_FILE_PATHS) {
        if (fs.existsSync(path)) {
            config_file_path = path;
            logger.log('read config from:' + config_file_path);
            return JSON.parse(fs.readFileSync(path, 'utf8'));
        }
    }
    throw new Error('CONFIG_FILE_PATHS is invalid');
}

async function writeConfig(config) {
    config_file_path = config.starter.x_node_config_path;
    if (!CONFIG_FILE_PATHS.includes(config_file_path)) {
        throw new Error('config_file_path is invalid: ' + config_file_path);
    }

    for (const path of CONFIG_FILE_PATHS) {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
        if (config_file_path === path) {
            break;
        }
    }

    return new Promise((resolve, reject) => {
        fs.writeFile(config_file_path, JSON.stringify(config, null, 2), (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function downloadForProxy({url, headers, body, method}, reqHttpRange, resHeaders) {
    if (url.startsWith('file://')) {
        const p = url.slice('file://'.length);
        const stats = fs.statSync(p);
        if (!stats.isFile()) {
            throw new RTError(403, 'NotDownloadable', {name: path.basename(p)});
        }
        const size = stats.size;

        const h = resHeaders;
        h['Content-Type'] = mime.get(p);
        h['Accept-Ranges'] = 'bytes';
        h['Content-Disposition'] = 'attachment; filename=' + encodeURIComponent(path.basename(p));

        const range = reqHttpRange;
        if (range) {
            const r = range.slice('bytes='.length).split('-');
            const start = Number(r[0]) || 0;
            const end = Number(r[1]) || size - 1;
            if (!(start <= end && end < size)) {
                throw new RTError(403, 'InvalidHttpRange', {range, size});
            }
            h['Content-Length'] = end - start + 1;
            h['Content-Range'] = `bytes ${start}-${end}/${size}`;
            return [206, h, fs.createReadStream(p, {start, end})];
        } else {
            h['Content-Length'] = size;
            return [200, h, fs.createReadStream(p)];
        }
    } else if (url.startsWith('http')) {
        if (reqHttpRange) {
            headers.range = reqHttpRange;
        }
        return axios
            .request({
                method,
                data: body,
                headers,
                url,
                responseType: 'stream',
            })
            .then(({status, data, headers}) => {
                ['Content-Type', 'Accept-Ranges', 'Content-Disposition', 'Content-Length', 'Content-Range'].forEach((k) => {
                    const t = headers[k.toLowerCase()];
                    if (t) {
                        resHeaders[k] = t;
                    }
                });
                return [status, resHeaders, data];
            });
    } else {
        throw new RTError(403, 'InvalidDownload');
    }
}

app.initialize({
    name: 'node-http',
    readConfig,
    writeConfig,
    params: [_P('x_node_config_path', '', '配置文件存放位置', 8, CONFIG_FILE_PATHS, false, true)],
});

const server = http
    .createServer(async (req, res) => {
        const s = process.hrtime.bigint();
        new Promise((resolve) => {
            const request = {method: req.method, path: req.url, headers: req.headers, body: '', query: req.url};
            req.headers['x-real-ip'] = req.connection.remoteAddress;
            if (req.method === 'PUT') {
                request.stream = req;
                resolve(request);
            } else {
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk;
                });
                req.on('end', async () => {
                    request.body = body;
                    resolve(request);
                });
            }
        })
            .then(async (request) => {
                const response = await app.handleRequest(request);
                if (response.callback_down) {
                    const r = await downloadForProxy(response.callback_down, req.headers.range, response.headers);
                    res.writeHead(r[0], r[1]);
                    r[2].pipe(res);
                } else {
                    res.writeHead(response.status, response.headers);
                    res.end(response.body);
                }
                logger.debug(`time consume:${Number(process.hrtime.bigint() - s) / 1000000}`);
            })
            .catch((err) => {
                res.writeHead(500);
                res.end(err.message);
            });
    })
    .listen(80);
logger.log(`Running on ${process.platform}: ${JSON.stringify(server.address())}`);
