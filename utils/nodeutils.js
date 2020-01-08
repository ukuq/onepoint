const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cookie = require('cookie');
const url = require('url');
const mime = require('mime');
const querystring = require("querystring");
function getmd5(data) {
  if (!data) return data;
  const hash = crypto.createHash('md5');
  hash.update(data);
  return hash.digest('hex');
}
exports.fs = fs;
exports.path = path;
exports.cookie = cookie;
exports.path = path;
exports.mime = mime;
exports.url = url;
exports.querystring = querystring;

exports.getmd5 = getmd5;
const axios = require('axios');
const service = axios.create({
  timeout: 5000,
  // proxy: {
  //   host: '127.0.0.1',
  //   port: 8899
  // }
});
service.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.log(error);
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

exports.axios = service;