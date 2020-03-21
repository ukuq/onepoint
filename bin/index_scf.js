const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const { op } = require('./main');
op.initialize({ readConfig, writeConfig });
let _config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config.json'), 'utf8'));

//@usage 如果需要使用保存功能,需要借用腾讯的cos,地区建议和云函数所在地区一致,内网之间流量免费
var COS = require('cos-nodejs-sdk-v5');
const cosConfig = {
    SecretId: '',
    SecretKey: '',
    Bucket: '',
    Region: 'ap-hongkong'
}

var cos = new COS({
    SecretId: cosConfig.SecretId,
    SecretKey: cosConfig.SecretKey
});

exports.main_handler = async (event, context, callback) => {

    let url = event['path'] + '?' + querystring.stringify(event['queryString']);

    let _event = op.genEvent(event['httpMethod'], url, event.headers, event.body, "scf", event['requestContext']['sourceIp'], '', event['queryString']);

    //处理域名和路径,分离得到 p0 p12
    let requestContext_path = event['requestContext']['path'];
    if (requestContext_path.endsWith('/')) requestContext_path = requestContext_path.slice(0, -1);// / or /abc/
    if (event['headers']['host'].startsWith(event['requestContext']['serviceId'])) {//长域名
        _event.splitPath['p0'] = `/${event['requestContext']['stage']}${requestContext_path}`;
        _event.splitPath['p_12'] = decodeURIComponent(event['path']).slice(requestContext_path.length) || '/';//  只有scf网关不规范 ,例如 /abc 前者才为
    }

    return await op.handleEvent(_event);
}

async function readConfig() {
    if (!cosConfig.SecretId) return _config;
    return new Promise((resolve) => {
        cos.getObject({
            Bucket: cosConfig.Bucket,
            Region: cosConfig.Region,
            Key: 'onepoint-config.json',
        }, function (err, data) {
            if (err) {
                console.log(err);
                resolve(_config);//通常不会加载失败;
            } else resolve(JSON.parse(String(data.Body)));
        });
    });
}

async function writeConfig(config) {
    return new Promise((resolve) => {
        cos.putObject({
            Bucket: cosConfig.Bucket,
            Region: 'ap-hongkong',
            Key: 'onepoint-config.json',
            Body: JSON.stringify(config),
        }, function (err) {
            if (err) resolve(false);
            else resolve(true);
        });
    });
}