const app = require('../app');
app.initialize({
    name: 'now.sh',
    readConfig,
    writeConfig,
    params: [],
});
module.exports = async (req, res) => {
    const r = await app.handleRequest(req);
    res.writeHead(r.status, r.headers);
    res.end(r.body);
};

const fs = require('fs');
const path = require('path');

async function readConfig() {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../conf/op-config.json'), 'utf8'));
}

async function writeConfig() {
    throw new Error('cannot write');
}
