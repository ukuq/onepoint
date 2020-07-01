require('../test/proxy');
require('../bin/index_node')
const fs = require('fs');
const path = require('path');
require('../bin/main').op.initialize({readConfig});
async function readConfig() {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp-config.json'), 'utf8'));
}

async function writeConfig(config) {
    return new Promise((resolve) => {
        fs.writeFile(path.resolve(__dirname, '../tmp-config.json'), JSON.stringify(config, null, 2), (err) => {
            if (err) resolve(false);
            else resolve(true);
        })
    });
}