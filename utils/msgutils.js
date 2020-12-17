let Msg = {
    file: Msg_file,
    list: Msg_list,
    info: Msg_info,
    html: Msg_html,
    html_json: Msg_html_json,
    error: Msg_error,
    down: Msg_download,
    constants: {
        'Incomplete_folder_path': 'Incomplete folder path',
        'No_such_command': 'No such command',
        'Just_for_mounting': 'Just for mounting |-_-',
        'Download_not_allowed': 'Download not allowed',
        'File_already_exists': 'File already exists',
        'Content_Range_is_invalid': 'Content-Range is invalid',
        'Offset_is_invalid': 'Offset is invalid',
        'Range_is_invalid': 'Range is invalid',
        'S404_not_found': '404 Not Found',
        'Permission_denied': 'Permission denied',
        'System_not_initialized': 'The system is not initialized'
    }
}

function Msg_file(file, url = '?download') {
    return {
        type: 0, //0_file 固定值
        statusCode: 200,//200 固定值
        data: {
            file: file,
            url: url
        }
    }
}

function Msg_list(list, nextToken) {
    return {
        type: 1, //1_dir 固定值
        statusCode: 200,// 固定值
        data: {
            list, nextToken
        }
    };
}

function Msg_info(statusCode, info, headers) {
    let m = {
        type: 2, //2_info 固定值
        statusCode: statusCode,//enum: 200 301 401 403 404 500
        headers: headers,
        data: {
            info: info || statusCode
        }
    };
    return m;
}

function Msg_html(statusCode, html, headers) {
    return {
        type: 3, //3_html 固定值
        statusCode: statusCode,//enum: 200 301 401 403 404 500
        headers: headers || { 'Content-Type': 'text/html' },
        data: {
            html: html//html text
        }
    }
}

function Msg_html_json(statusCode, obj, headers) {
    return {
        type: 3, //3_html 固定值
        statusCode: statusCode,
        headers: headers || { 'Content-Type': 'application/json' },
        data: {
            html: JSON.stringify(obj)
        }
    }
}


function Msg_error(statusCode, info, headers) {
    let m = {
        type: 2,
        statusCode: statusCode,
        headers: headers,
        data: {
            info: info || statusCode
        }
    };
    let e = new Error(m.data.info);
    return Object.assign(e, m);
}

const { axios } = require('./nodeutils');
async function Msg_download(req) {
    // if (authorization) headers.authorization = this.authorization;
    // if (range) headers.range = this.range;
    //@flag 以后支持导出下载链接
    let res = await axios({ url: req.url, headers: req.headers, method: req.method || 'get', responseType: 'stream' });
    return Msg.html(res.status, res.data, res.headers);
}

function urlSpCharEncode(s) {
    return !s ? s : s.replace(/%/g, '%25').replace(/#/g, '%23');
}
function formatSize(size) {
    if (typeof size !== "number") size = NaN;
    let count = 0;
    while (size >= 1024) {
        size /= 1024;
        count++;
    }
    size = size.toFixed(2);
    size += [' B', ' KB', ' MB', ' GB', ' TB'][count];
    return size;
};
function formatDate(str) {
    let oDate = new Date(str);
    if ('Invalid Date' == oDate) return oDate;
    let oYear = oDate.getFullYear(),
        oMonth = oDate.getMonth() < 9 ? "0" + (oDate.getMonth() + 1) : (oDate.getMonth() + 1),
        oDay = oDate.getDate() < 10 ? "0" + oDate.getDate() : oDate.getDate(),
        oHour = oDate.getHours() < 10 ? "0" + oDate.getHours() : oDate.getHours(),
        oMinute = oDate.getMinutes() < 10 ? "0" + oDate.getMinutes() : oDate.getMinutes(),
        oSecond = oDate.getSeconds() < 10 ? "0" + oDate.getSeconds() : oDate.getSeconds(),
        oTime = oYear + '-' + oMonth + '-' + oDay + " " + oHour + ":" + oMinute + ":" + oSecond;
    return oTime;
}
module.exports = { Msg, formatSize, urlSpCharEncode };
