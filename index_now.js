const url = require('url');
const { main_func } = require('./bin/main');

module.exports = async (req, res) => {
    let event = {
        method: req.method,
        headers: req.headers,
        body: req.body || {},
        cookie: req.cookie || {},
        query: req.query || {},
        sourceIp: "0.0.0.0",
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