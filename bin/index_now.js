const url = require('url');
const cookie = require('../local_modules/cookie');
const { main_func } = require('./main');

module.exports = async (req, res) => {
    let event = {
        method: req.method,
        headers: req.headers,
        body: req.body || {},
        cookie: req.cookies,
        query: req.query || {},
        sourceIp: req.headers['x-real-ip'],
        splitPath: {
            ph: '//' + req.headers.host,
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
}