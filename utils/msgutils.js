let Msg = {
    file: Msg_file,
    list: Msg_list,
    info: Msg_info,
    json: Msg_json,
    html: Msg_html,
    html_json: Msg_html_json
}

function Msg_file(file, url) {
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

function Msg_json(statusCode, obj, headers) {
    let m = {
        type: 2, //2_info 固定值
        statusCode: statusCode,//enum: 200 301 401 403 404 500
        headers: headers,
        data: {
            info: 'json msg',
            json: obj
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

function urlSpCharEncode(s) {
    if (!s) return s;
    let res = '';
    for (let len = s.length, i = 0; i < len; i++) {
        let ch = s[i];
        switch (ch) {
            case '%':
                res += '%25';
                break;
            case '?':
                res += '%3f';
                break;
            case '#':
                res += '%23';
                break;
            case ' ':
                res += '%20';
                break;
            default:
                res += ch;
        }
    }
    return res;
}
function formatSize(size) {
    if (typeof size !== "number") size = NaN;
    let count = 0;
    while (size >= 1024) {
        size /= 1024;
        count++;
    }
    size = size.toFixed(2);
    size += [' B', ' KB', ' MB', ' GB'][count];
    return size;
};
module.exports = { Msg, formatSize, urlSpCharEncode };
