const fs = require('fs');
const path = require('path');
const { genEvent } = require('../utils/eventutil');
const { OnePoint } = require('./main');
let op = new OnePoint();
op.initialize(JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config.json'), 'utf8')));

module.exports = async (context, req) => {
    try {
        let r = await op.handleEvent(genEvent(req.method, req.url, req.headers, req.body, "azure", req.headers['client-ip'], '/api/onepoint', req.query, req.cookies));
        context.res = {
            status: r.statusCode,
            headers: r.headers,
            body: r.body
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: "error"
        };
        console.log(error);
    }
}