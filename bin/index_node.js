#!/usr/bin/env node
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
                res.writeHead(r.statusCode, r.headers);
                if (r.headers['x-type'] === "stream") r.body.pipe(res);
                else res.end(r.body);
            } catch (error) {
                console.log(error);
                res.writeHead(500, {});
                res.write("error");
                res.end();
            }
        });
    }).listen(8020);
}
module.exports();
console.log('OnePoint is running at http://localhost:8020');

async function readConfig() {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config.json'), 'utf8'));
}

async function writeConfig(config) {
    return new Promise((resolve) => {
        fs.writeFile(path.resolve(__dirname, '../config.json'), JSON.stringify(config), (err) => {
            if (err) resolve(false);
            else resolve(true);
        })
    });
}