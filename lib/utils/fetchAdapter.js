'use strict';

// https://github.com/sgammon/axios/blob/feature/fetch/lib/adapters/fetch.js

const settle = require('axios/lib/core/settle');
const buildURL = require('axios/lib/helpers/buildURL');
const buildFullPath = require('axios/lib/core/buildFullPath');
const createError = require('axios/lib/core/createError');

module.exports = function fetchAdapter(config) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {
        const requestData = config.data;
        const requestHeaders = config.headers;

        // HTTP basic authentication
        if (config.auth) {
            const username = config.auth.username || '';
            const password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
            requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        const fullPath = buildFullPath(config.baseURL, config.url);
        const request = new Request(buildURL(fullPath, config.params, config.paramsSerializer));

        // copy headers in
        const headers = new Headers();
        for (const key in requestHeaders) {
            if (requestHeaders.hasOwnProperty(key)) {
                headers.append(key, requestHeaders[key]);
            }
        }

        const abort = { state: false, schedule: null };

        if (config.timeout) {
            let timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
            if (config.timeoutErrorMessage) {
                timeoutErrorMessage = config.timeoutErrorMessage;
            }

            abort.schedule = setTimeout(function popTimeout() {
                abort.state = true;
                reject(createError(timeoutErrorMessage, config, 'ECONNABORTED', config, null));
            }, config.timeout);
        }

        const fetcher = fetch(request, {
            method: config.method.toUpperCase(),
            headers: headers,
            body: requestData,
        });

        fetcher.then(
            function fetchFollowup(response) {
                if (abort.state) {
                    return;
                }
                if (abort.schedule) {
                    clearTimeout(abort.schedule);
                }

                // Prepare the response
                const responseHeaders = response.headers;
                let responseData = null;
                switch (config.responseType) {
                    case 'text':
                        responseData = response.text();
                        break;
                    case 'json':
                        responseData = response.json();
                        break;
                    case 'blob':
                        responseData = response.blob();
                        break;
                    default:
                        responseData = response.text();
                        break;
                }

                // consume response
                if (!responseData) {
                    reject(createError('Failed to resolve response stream.', config, 'STREAM_FAILED', request, response));
                } else {
                    responseData.then(
                        function handleResponseData(data) {
                            const axiosResponse = {
                                data: data,
                                status: response.status,
                                statusText: response.statusText,
                                headers: responseHeaders,
                                config: config,
                                request: request,
                                requestHeaders: requestHeaders,
                            };

                            // we're good to go
                            settle(resolve, reject, axiosResponse);
                        },
                        function handleDataError(dataErr) {
                            reject(dataErr || createError('Stream decode error', config, response.statusText, request, response));
                        }
                    );
                }
            },
            function handleFetchError(err) {
                if (abort.state) {
                    return;
                }
                if (abort.schedule) {
                    clearTimeout(abort.schedule);
                }
                if (err instanceof Error) {
                    reject(err);
                } else {
                    reject(createError('Network Error', config, null, request, err));
                }
            }
        );
    });
};
