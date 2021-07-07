require('../conf/sys-config').NODE_ENV = 'dev';
require('../conf/sys-config').PORT = 80;
require('../utils/node').request.defaults.proxy = {
    host: '127.0.0.1',
    port: '8899',
};
const path = require('path');
const pathPrefix = path.resolve(__dirname, '../views/art/') + '/';
const op = require('../core/op');
Object.values(op.themes).forEach((v) => {
    if (v.type === 'art') {
        const p = pathPrefix + v.name;
        v.render = (t) => require('art-template')(p, t);
    }
});
require('./node-http');
const fs = require('fs');
const p = path.resolve(__dirname, '../../tmp/op-config.json');

require('../views/art2js')(true);

require('../core/op').initialize({
    name: 'node-http',
    async readConfig() {
        return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
    },
    async writeConfig(config) {
        fs.writeFileSync(p, JSON.stringify(config, null, 2));
    },
    params: [],
});
