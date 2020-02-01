const _url = require('url');
const _cookie = require('cookie');
const querystring = require('querystring');

exports.genEvent = genEvent;

function genEvent(method, url, headers, body, adapter, sourceIp = '0.0.0.0', p0 = '', query, cookie) {
    if (!body) body = {};
    else if (typeof body === 'string') {
        if (headers['content-type']) {
            if (headers['content-type'].startsWith('application/x-www-form-urlencoded')) {
                body = querystring.parse(body);
            } else if (headers['content-type'].startsWith('application/json')) {
                body = JSON.parse(body);
            }
        }
    }
    let event = {
        method, url, headers, body, adapter, sourceIp,
        query: query || querystring.parse(_url.parse(url).query),
        cookie: cookie || (headers['cookie'] ? _cookie.parse(headers['cookie']) : {}),
        splitPath: {
            ph: '//' + headers.host,
            p0: p0,
            p_12: decodeURIComponent(_url.parse(url).pathname.slice(p0.length) || '/')
        }
    }
    return event;
}
