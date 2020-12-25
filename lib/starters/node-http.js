const http = require('http');
const app = require('../app');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE_PATHS = [
    path.resolve('/', 'etc/op-config.json'),
    path.resolve(__dirname, '../../config.json'),
    path.resolve(__dirname, '../conf/op-config.json')
];

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
    config_file_path = config.x_node_config_path;
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

app.initialize({
    name: 'node-http',
    readConfig,
    writeConfig,
    params: [{name: 'x_node_config_path', desc: '配置文件存放位置', value: '', star: true, level: 8, select: CONFIG_FILE_PATHS}],
});

const server = http
    .createServer(async (req, res) => {
        const s = process.hrtime.bigint();
        new Promise((resolve) => {
            const request = {method: req.method, path: req.url, headers: req.headers, body: 'req.body', query: req.url};
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
        }).then(async (request) => {
            const response = await app.handleRequest(request);
            res.writeHead(response.status, response.headers);
            if (response.stream) {
                response.stream().pipe(res);
            } else {
                res.end(response.body);
            }
            logger.debug(`time consume:${Number(process.hrtime.bigint() - s) / 1000000}`);
        });
    })
    .listen(80);
logger.log(`Running on ${process.platform}: ${JSON.stringify(server.address())}`);
