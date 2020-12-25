exports.url = require('url');
exports.querystring = require('querystring');
exports.cookie = require('cookie');

const crypto = require('crypto');
exports.md5 = function (data) {
    return crypto.createHash('md5').update(data).digest('hex');
};

exports.axios = require('axios').create({
    timeout: 10000,
});
exports.axios.interceptors.request.use(
    (config) => {
        if (config.headers['request-type'] === 'form') {
            delete config.headers['request-type'];
            config.headers['content-type'] = 'application/x-www-form-urlencoded';
            config.data = exports.querystring.stringify(config.data);
        }
        config.url = encodeURI(config.url);
        return config;
    },
    (error) => Promise.reject(error)
);

exports.axios.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

const mime = require('./mime.js');
exports.mime = {
    get: (path) => mime[path.slice(path.lastIndexOf('.') + 1)] || 'application/vnd.op-unknown',
};
