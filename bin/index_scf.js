const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const { genEvent } = require('../utils/eventutil');
const { OnePoint } = require('./main');
let op = new OnePoint();
op.initialize(JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config.json'), 'utf8')));

exports.main_handler = async (event, context, callback) => {

    let url = event['path'] + '?' + querystring.stringify(event['queryString']);

    let _event = genEvent(event['httpMethod'], url, event.headers, event.body, "scf",event['requestContext']['sourceIp'],'',event['queryString']);
    
    //处理域名和路径,分离得到 p0 p12
    let requestContext_path = event['requestContext']['path'];
    if (requestContext_path.endsWith('/')) requestContext_path = requestContext_path.slice(0, -1);// / or /abc/
    if (event['headers']['host'].startsWith(event['requestContext']['serviceId'])) {//长域名
        _event.splitPath['p0'] = `/${event['requestContext']['stage']}${requestContext_path}`;
        _event.splitPath['p_12'] = event['path'].slice(requestContext_path.length) || '/';//  只有scf网关不规范 ,例如 /abc 前者才为假
    }

    return await op.handleEvent(_event);
}