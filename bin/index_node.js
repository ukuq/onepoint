const http = require('http');
const fs = require('fs');
const path = require('path');
const { op } = require('./main');
let server;
op.initialize({ readConfig, writeConfig });
module.exports = () => {
    if (server) server.close();
    server = http.createServer((req, res) => {
        let body = "";
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', async () => {
            try {
                let r = await op.handleRaw(req.method, req.url, req.headers, body, "node", req.connection.remoteAddress);
                //@info 本地测试用
                if (req.method === 'OPTIONS' && req.headers['access-control-request-headers']) {

                    r.statusCode = 204,
                        r.headers = {
                            'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
                            'access-control-allow-headers': 'Content-Type',
                            'access-control-max-age': '1728000'
                        },
                        r.body = ""
                }

                r.headers['Access-Control-Allow-Origin'] = 'http://localhost:8080';
                r.headers['Access-Control-Allow-Credentials'] = true;

                res.writeHead(r.statusCode, r.headers);
                res.end(r.body);
            } catch (error) {
                console.log(error);
                res.writeHead(500, {});
                res.write("error");
                res.end();
            }
        });
    }).listen(80);
}
module.exports();

async function readConfig() {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config.json'), 'utf8'));
}

async function writeConfig(config) {
    fs.writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify(config));
}