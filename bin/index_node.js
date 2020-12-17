const http = require('http');
const url = require('url');
const cookie = require('../local_modules/cookie');
const querystring = require('querystring');
const { main_func } = require('./main');
let server;
module.exports = () => {

    if (server) server.close();
    server = http.createServer((req, res) => {

        let query = querystring.parse(url.parse(req.url).query);
        for (let q in query) if (query[q] === '') query[q] = true;

        let headers = req.headers;

        let tcookie = headers['cookie'] ? cookie.parse(headers['cookie']) : {};

        let body = "";
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', async () => {
            if (headers['content-type'] === 'application/x-www-form-urlencoded') {
                body = querystring.parse(body);
            } else if (headers['content-type'] === 'application/json') {
                body = JSON.parse(body);// 此处不捕捉 parse error
            }
            let event = {
                method: req.method,
                headers: headers,
                body: body || {},
                cookie: tcookie,
                query: query,
                sourceIp: "0.0.0.0",
                splitPath: {
                    ph: '//' + headers.host,
                    p0: '',
                    p_12: url.parse(req.url).pathname
                }
            };
            try {
                let r = await main_func(event);
                res.writeHead(r.statusCode, r.headers);
                res.write(r.body);
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