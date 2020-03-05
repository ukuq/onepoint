'use strict';
const { axios } = require('../utils/nodeutils');
const parser = require('fast-xml-parser');

class WebDav {
    /**
     * @flag 此处以后还会修改 @test
     * @param {*} url 
     * @param {*} auth 
     */
    constructor(url, auth) {
        this.baseURL = url;
        this.auth = auth;
    }
    async init() {

    }
    async ls(path) {
        let res = await axios({ baseURL: this.baseURL, headers: { Authorization: this.auth, Depth: 1 }, method: 'propfind', url: path, responseType: "text"});
        return parser.parse(res.data, { ignoreNameSpace: true }, true);
    }
    async download(path, headers = {}) {
        headers.Authorization = this.auth;
        let res = await axios({ baseURL: this.baseURL, headers, method: 'get', url: path, responseType: 'stream' });
        res.headers['x-type'] = "stream";
        return res;
    }
}
exports.WebDav = WebDav;