const http = require('http');
const url = require('url');
const cookie = require('./local_modules/cookie');
const querystring = require('querystring');
const process = require('process');
const { main_func } = require('./bin/main');
const { main_handler: main_scf } = require('./index_scf');
function proxy() {
    http.createServer((req, res) => {

        let query = querystring.parse(url.parse(req.url).query);
        for (let q in query) if (query[q] === '') query[q] = true;

        let headers = req.headers;

        let tcookie = headers['cookie'] ? cookie.parse(headers['cookie']) : {};

        let body = "";
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', async () => {
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
if (process.env['USER'] !== 'qcloud') proxy();
exports.main_handler = async (event, context, callback) => {
    if (process.env['USER'] === 'qcloud') return main_scf(event, context, callback);
    else throw "unknown env";
}
