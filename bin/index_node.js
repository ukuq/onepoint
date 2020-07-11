const http = require('http');
const fs = require('fs');
const path = require('path');
const { op } = require('./main');
const process = require('process');
let port = process.env.PORT || 8020;
let server;
op.initialize({ name: "node", readConfig, writeConfig });
const CONFIG_FILE_PATH = fs.existsSync("/etc") ? "/etc/onepoint_config.json" : path.resolve(__dirname, '../config.json');
module.exports = () => {
    if (server) server.close();
    server = http.createServer((req, res) => {
        if (req.method !== 'PUT') {
            let body = "";
            req.on('data', (chunk) => {
                body += chunk;
            });
            req.on('end', async () => {
                handleReq(body);
            });
        } else {
            handleReq(req);
        }
        async function handleReq(body) {
            try {
                let r = await op.handleRaw(req.method, req.url, req.headers, body, req.connection.remoteAddress);
                res.writeHead(r.statusCode, r.headers);
                if (typeof r.body.pipe === 'function') r.body.pipe(res);
                else res.end(r.body);
            } catch (error) {
                console.log(error);
                res.writeHead(500, {});
                res.write("error");
                res.end();
            }
        }
    }).listen(port);
}
module.exports();
console.log('OnePoint is running at http://localhost:' + port);

async function readConfig() {
    let p = (fs.existsSync(CONFIG_FILE_PATH)) ? CONFIG_FILE_PATH : path.resolve(__dirname, '../config.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function writeConfig(config) {
    return new Promise((resolve, reject) => {
        fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), (err) => {
            if (err) reject(err);
            else resolve();
        })
    });
}