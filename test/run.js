require('../test/proxy');
require('../bin/index_node')
const fs = require('fs');
const path = require('path');
require('../bin/main').op.initialize({ name: "node-test", readConfig });
async function readConfig() {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp-config.json'), 'utf8'));
}

async function writeConfig(config) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path.resolve(__dirname, '../tmp-config.json'), JSON.stringify(config, null, 2), (err) => {
            if (err) reject(err);
            else resolve();
        })
    });
}