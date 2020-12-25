const app = require('../app');

const COS = require('cos-nodejs-sdk-v5');

const env = process.env;
const cosConfig = {
    SecretId: env.COS_SECRETID,
    SecretKey: env.COS_SECRETKEY,
    Bucket: env.COS_BUCKET,
    Region: env.COS_REGIN,
    Key: env.COS_KEY,
};

const cos = new COS({
    SecretId: cosConfig.SecretId,
    SecretKey: cosConfig.SecretKey,
});

async function readConfig() {
    if (!cosConfig.SecretId) {
        throw new Error('未配置COS,无法读写配置');
    }
    return new Promise((resolve, reject) => {
        cos.getObject(
            {
                Bucket: cosConfig.Bucket,
                Region: cosConfig.Region,
                Key: cosConfig.Key,
            },
            function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.parse(String(data.Body)));
                }
            }
        );
    });
}

async function writeConfig(config) {
    if (!cosConfig.SecretId) {
        throw new Error('未配置COS,无法读写配置');
    }
    return new Promise((resolve, reject) => {
        cos.putObject(
            {
                Bucket: cosConfig.Bucket,
                Region: cosConfig.Region,
                Key: cosConfig.Key,
                Body: JSON.stringify(config),
            },
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

app.initialize({
    name: 'scf',
    readConfig,
    writeConfig,
    params: [],
});

exports.main_handler = async (event) => {
    event.headers['x-real-ip'] = event.requestContext.sourceIp;
    let p_12 = event.path;
    // 处理域名和路径,分离得到 p0 p12
    let requestContext_path = event.requestContext.path;
    if (requestContext_path.endsWith('/')) {
        requestContext_path = requestContext_path.slice(0, -1);
    } // / or /abc/
    if (event.headers.host.startsWith(event.requestContext.serviceId)) {
        // 长域名
        event.headers['x-op-p0'] = `/${event.requestContext.stage}${requestContext_path}`;
        p_12 = p_12.slice(requestContext_path.length) || '/'; //  只有scf网关不规范 ,例如 /abc 前者才为
    }
    return await app.handleRequest({
        method: event.httpMethod,
        path: p_12,
        headers: event.headers,
        body: event.body,
        query: event.queryString,
    });
};
