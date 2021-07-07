function request({ method, url, headers, body }, config) {
    return new Promise((resolve, reject) => {
        const abort = { state: false, schedule: null };

        if (config.timeout) {
            abort.schedule = setTimeout(() => {
                abort.state = true;
                reject(new Error('timeout of ' + config.timeout + 'ms exceeded'));
            }, config.timeout);
        }
        fetch(url, {
            method,
            headers: new Headers(headers),
            body,
            redirect: 'manual',
        })
            .then((res) => {
                if (abort.state) {
                    return;
                }
                if (abort.schedule) {
                    clearTimeout(abort.schedule);
                }

                const h = {};
                for (const [k, v] of res.headers) {
                    h[k] = v;
                }
                if (h['set-cookie']) {
                    // set-cookie is special
                    h['set-cookie'] = h['set-cookie'].split(/(?<!=\w{3}),/).filter((e) => e.trim());
                }

                const response = {
                    status: res.status,
                    headers: h,
                    data: '',
                };

                if (config.responseType === 'stream') {
                    response.data = res.body;
                    return resolve(response);
                }

                if ((response.status >= 300 && response.status < 400) || response.status === 204 || method === 'HEAD') {
                    return resolve(response);
                }

                // just delete
                if (['gzip', 'compress', 'deflate'].includes(response.headers['content-encoding'])) {
                    delete response.headers['content-encoding'];
                }

                let responseData = res;
                switch (config.responseType) {
                    case 'arraybuffer':
                        responseData = responseData.arrayBuffer();
                        break;
                    case 'blob':
                        responseData = responseData.blob();
                        break;
                    default:
                        responseData = responseData.text();
                }

                // consume response
                if (!responseData) {
                    reject(new Error('Failed to resolve response stream.'));
                } else {
                    responseData.then(
                        (data) => {
                            response.data = data;
                            resolve(response);
                        },
                        (dataErr) => {
                            reject(dataErr || new Error('Stream decode error'));
                        }
                    );
                }
            })
            .catch((err) => {
                if (abort.state) {
                    return;
                }
                if (abort.schedule) {
                    clearTimeout(abort.schedule);
                }
                if (err instanceof Error) {
                    reject(err);
                } else {
                    reject(new Error('Network Error'));
                }
            });
    });
}

module.exports = request;
