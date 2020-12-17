const { main_func } = require('./main');
const cookie = require('../local_modules/cookie');
const querystring = require('querystring');

exports.main_handler = async (event, context, callback) => {

    event['method'] = event['httpMethod'];
    
    event['path'] = decodeURIComponent(event['path']);//处理中文字符

    if (event['headers']['content-type'] === 'application/x-www-form-urlencoded') {
        event['body'] = querystring.parse(event['body'])
    } else if (event['headers']['content-type'] === 'application/json') {
        event['body'] = JSON.parse(event['body']);// 此处不捕捉 parse error
    }

    event['cookie'] = event['headers']['cookie'] ? cookie.parse(event['headers']['cookie']) : {};

    event['query'] = event['queryString'];

    //处理域名和路径,分离得到 p0 p12
    let splitPath = { 'ph': '//' + event['headers']['host'] };
    let requestContext_path = event['requestContext']['path'];
    if (requestContext_path.endsWith('/')) requestContext_path = requestContext_path.slice(0, -1);// / or /abc/
    if (event['headers']['host'].startsWith(event['requestContext']['serviceId'])) {//长域名
        splitPath['p0'] = `/${event['requestContext']['stage']}${requestContext_path}`;
        splitPath['p_12'] = event['path'].slice(requestContext_path.length) || '/';//  只有scf网关不规范 ,例如 /abc 前者才为假
    } else {
        splitPath['p0'] = "";
        splitPath['p_12'] = event['path'];
    }
    event['splitPath'] = splitPath;

    event['sourceIp'] = event['requestContext']['sourceIp'];
    
    return await main_func(event, context, callback);
}