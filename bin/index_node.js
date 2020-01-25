const http = require('http');
const fs = require('fs');
const path = require('path');
const { genEvent } = require('../utils/eventutil');
const { OnePoint } = require('./main');
let server;
let op = new OnePoint();
op.initialize(JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config.json'), 'utf8')));
module.exports = () => {
    if (server) server.close();
    server = http.createServer((req, res) => {
        let body = "";
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', async () => {
            try {
                let r = await op.handleEvent(genEvent(req.method,req.url,req.headers,body,"node"));
                res.writeHead(r.statusCode, r.headers);
                res.end(r.body);
                res.end();
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