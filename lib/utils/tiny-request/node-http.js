const http = require('http');
const https = require('https');
const zlib = require('zlib');

// utf8解码未处理bom
async function request({ method, url, headers, body }, config) {
    const u = new URL(url);
    const options = {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers,
    };

    if (config.proxy) {
        options.hostname = config.proxy.host;
        options.port = config.proxy.port;
        options.path = url;
        headers.Host = u.host;
    }

    return new Promise((resolve, reject) => {
        const transport = u.protocol === 'https:' && !config.proxy ? https : http;

        // Create the request
        const req = transport.request(options, function handleResponse(res) {
            if (req.aborted) {
                return;
            }

            const response = {
                status: res.statusCode,
                headers: res.headers,
                data: '',
            };
            // forward stream, do nothing!
            if (config.responseType === 'stream') {
                response.data = res;
                resolve(response);
                return;
            }

            // if redirect or no content or HEAD method, do not need body!
            if ((response.status >= 300 && response.status < 400) || response.status === 204 || method === 'HEAD') {
                resolve(response);
                return;
            }

            let stream = res;

            if (['gzip', 'compress', 'deflate'].includes(response.headers['content-encoding'])) {
                // add the unzipper to the body stream processing pipeline
                stream = stream.pipe(zlib.createUnzip());
                // remove the content-encoding in order to not confuse downstream operations
                delete response.headers['content-encoding'];
            }

            const responseBuffer = [];
            stream.on('data', function handleStreamData(chunk) {
                responseBuffer.push(chunk);
            });

            stream.on('error', function handleStreamError(err) {
                if (req.aborted) {
                    return;
                }
                reject(err);
            });

            stream.on('end', function handleStreamEnd() {
                let responseData = Buffer.concat(responseBuffer);
                if (config.responseType !== 'arraybuffer') {
                    responseData = responseData.toString('utf8');
                }
                response.data = responseData;
                resolve(response);
            });
        });

        // Handle errors
        req.on('error', function handleRequestError(err) {
            if (req.aborted) {
                return;
            }
            reject(err);
        });

        // Handle request timeout
        if (config.timeout) {
            // Sometime, the response will be very slow, and does not respond, the connect event will be block by event loop system.
            // And timer callback will be fired, and abort() will be invoked before connection, then get "socket hang up" and code ECONNRESET.
            // At this time, if we have a large number of request, nodejs will hang up some socket on background. and the number will up and up.
            // And then these socket which be hang up will devoring CPU little by little.
            // ClientRequest.setTimeout will be fired on the specify milliseconds, and can make sure that abort() will be fired after connect.
            req.setTimeout(config.timeout, function handleRequestTimeout() {
                req.abort();
                reject(new Error('timeout of ' + config.timeout + 'ms exceeded'));
            });
        }

        // Send the request
        req.end(body);
    });
}

module.exports = request;
