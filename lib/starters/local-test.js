require('../utils/node').axios.defaults.proxy = {
    host: '127.0.0.1',
    port: '8899',
};
require('../conf/sys-config').NODE_ENV = 'dev';
require('../conf/sys-config').PORT = 80;

const { themes } = require('../conf/sys-config');
const path = require('path');
const pathPrefix = path.resolve(__dirname, '../views/art/') + '/';
Object.values(themes).forEach((v) => {
    if (v.type === 'art') {
        const p = pathPrefix + v.name;
        v.render = (t) => require('art-template')(p, t);
    }
});
require('./node-http');
const fs = require('fs');
const p = path.resolve(__dirname, '../../tmp/op-config.json');

require('../views/art2js').watch(true);

require('../core/op').initialize({
    name: 'node-http',
    async readConfig() {
        return Promise.resolve(JSON.parse(fs.readFileSync(p, 'utf8')));
    },
    async writeConfig(config) {
        fs.writeFileSync(p, JSON.stringify(config, null, 2));
        return Promise.resolve();
    },
    params: [],
});
