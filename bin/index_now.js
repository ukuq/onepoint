const fs = require('fs');
const path = require('path');
const { op } = require('onepoint');
const axios = require("axios");

// 部署now时, 配置文件和本文件为同目录
let _config = JSON.parse(fs.readFileSync(path.resolve(__dirname, './config.json'), 'utf8'));

if (_config.G_CONFIG['x-nowsh-token']) op.initialize({ name: "now.sh", readConfig, writeConfig });//支持保存功能
else op.initialize({ name: "now.sh", readConfig });//只读,未提供保存功能

module.exports = async (req, res) => {
    try {
        let r = await op.handleRaw(req.method, req.url, req.headers, req.body, req.headers['x-real-ip'], '', req.query, req.cookies);
        res.writeHead(r.statusCode, r.headers);
        res.write(r.body);
        res.end();
    } catch (error) {
        console.log(error);
        res.writeHead(500, {});
        res.write("error");
        res.end();
    }
};

async function readConfig() {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, './config.json'), 'utf8'));
}

async function writeConfig(config) {
    await axios.default.post("https://point.onesrc.cn/github/nowsh-deploy", { token: config.G_CONFIG['x-nowsh-token'], config_json: JSON.stringify(config, null, 2) });
}