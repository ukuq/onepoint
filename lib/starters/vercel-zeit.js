const fs = require('fs');
const app = require('../app');
const { request, P } = require('../utils/node');
const logger = require('../utils/logger');
const op = require('../core/op');

let META; // process.env['VERCEL_URL'];

async function readConfig() {
    return typeof CONFIG_OBJ === 'undefined' ? {} : CONFIG_OBJ;
}

async function writeConfig(config, { x_zeit_token, x_zeit_project_name }) {
    if (!x_zeit_token) {
        return Promise.reject(new Error('未配置 zeit token'));
    }
    const flag = await checkDeployment(x_zeit_token);
    if (op.config.version !== 1 && !flag) {
        return Promise.reject(new Error('lock! 之前已经提交过部署了，请等待生效后再试'));
    }
    const c = `const CONFIG_OBJ=${JSON.stringify(config)};const r3030958164335045=19218526256549961;\n`;
    let f = fs.readFileSync(__filename, 'utf-8').replace(/^const CONFIG_OBJ=.*;const r3030958164335045=19218526256549961;\n/, c);
    if (!f.startsWith('const CONFIG_OBJ=')) {
        f = c + f;
    }
    return request
        .post(
            'https://api.vercel.com/v12/now/deployments', {
                name: x_zeit_project_name,
                files: [{ file: 'api/index.js', data: f }],
                target: 'production',
                meta: { last: META },
                functions: { 'api/index.js': { maxDuration: 10 } },
                routes: [{ src: '/.*', dest: 'api/index.js' }],
                projectSettings: { framework: null },
            }, {
                headers: {
                    Authorization: `Bearer ${x_zeit_token}`,
                },
            }
        )
        .then((d) => {
            logger.log(d);
            return (op.runtime.now = d.data.url);
        });
}

async function checkDeployment(token) {
    return request
        .get('https://api.vercel.com/v5/now/deployments/', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                'meta-last': META,
            },
        })
        .then((d) => {
            logger.log(d.request.header);
            logger.log(d.data.deployments.length);
            return d.data.deployments.length === 0;
        });
}

app.initialize({
    name: 'now.sh',
    readConfig,
    writeConfig,
    params: [
        P('x_zeit_token', '', 'token', 8, '', false, true),
        P('x_zeit_project_name', 'onepoint', 'project name', 8, '', false, true)
    ]
});

module.exports = async(req, res) => {
    try {
        if (META === undefined) {
            META = req.headers['x-vercel-deployment-url'];
        }
        req.path = req.url;
        const r = await app.handleRequest(req);
        res.writeHead(r.status, r.headers);
        res.end(r.body);
    } catch (err) {
        logger.log(err);
        res.writeHead(err.status || 500, {
            'access-control-allow-origin': '*',
            'content-type': 'application/json',
        });
        res.end(
            JSON.stringify({
                error: err.type || 'UnknownError',
                data: err.data || {},
                message: err.message,
            })
        );
    }
};