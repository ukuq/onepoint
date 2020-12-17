let Msg = {
    file: Msg_file,
    list: Msg_list,
    info: Msg_info,
    html: Msg_html,
    m301: Msg_m301
}

function Msg_file(fileInfo, downloadUrl, headers) {
    return {
        type: 0, //0_file 固定值
        statusCode: 200,//200 固定值
        headers: headers,
        data: {
            fileInfo: fileInfo,
            downloadUrl: downloadUrl
        }
    }
}

function Msg_list(content, prevHref, nextHref, headers) {
    return {
        type: 1, //1_dir 固定值
        statusCode: 200,// 固定值
        headers: headers,
        data: {
            content: content,
            prevHref: prevHref,
            nextHref: nextHref
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

function Msg_m301(location) {
    return {
        type: 3,
        statusCode: 301,
        headers: {
            'Location': location
        },
        data: {
            html: "301:" + location
        }
    }
}

function formatDate(str) {
    let oDate = new Date(str);
    if ('Invalid Date' == oDate) return oDate;
    let oYear = oDate.getFullYear(),
        oMonth = oDate.getMonth() < 9 ? "0" + (oDate.getMonth() + 1) : (oDate.getMonth() + 1),
        oDay = oDate.getDate() < 10 ? "0" + oDate.getDate() : oDate.getDate(),
        oHour = oDate.getHours() < 10 ? "0" + oDate.getHours() : oDate.getHours(),
        oMinute = oDate.getMinutes() < 10 ? "0" + oDate.getMinutes() : oDate.getMinutes(),
        oSecond = oDate.getSeconds() < 10 ? "0" + oDate.getSeconds() : oDate.getSeconds(),
        oTime = oYear + '-' + oMonth + '-' + oDay + " " + oHour + ":" + oMinute + ":" + oSecond;//最后拼接时间
    return oTime;
};

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
    if (isNaN(size)) return "";
    if (size === undefined) return "";
    else size = Number(size);
    let count = 0;
    while (size >= 1024) {
        size /= 1024;
        count++;
    }
    size = size.toFixed(2);
    size += [' B', ' KB', ' MB', ' GB'][count];
    return size;
};
module.exports = { Msg, formatDate, formatSize, urlSpCharEncode };
