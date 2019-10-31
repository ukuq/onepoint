exports.funcs = { Msg_file, Msg_info, Msg_list, formatSize, formatDate, getExtByName, urlSpCharEncode };

/**
 * onepoint ukuq
 * time:191029
 */

function Msg_file(fileInfo, readMe_type, readMe_txt, script) {
    return {
        'statusCode': 200,
        'type': 0,
        'data': {
            'fileInfo': fileInfo
        },
        'readMe': {
            type: readMe_type || 2,
            txt: readMe_txt || "## Powered by [OnePoint](https://github.com/ukuq/onepoint)\\n\\n"
        },
        'script': script || ""
    }
}

function Msg_list(content, prevHref, nextHref, readMe_type, readMe_txt, script) {
    return {
        'statusCode': 200,
        'type': 1,
        'data': {
            'content': content,
            'prevHref': prevHref || "",
            'nextHref': nextHref || ""
        },
        'readMe': {
            type: readMe_type || 2,
            txt: readMe_txt || "## Powered by [OnePoint](https://github.com/ukuq/onepoint)\\n\\n"
        },
        'script': script || ""
    }
}

function Msg_info(statusCode, info, readMe_type, readMe_txt, script) {
    return {
        'statusCode': statusCode,
        'info': info || "开发者没有填写, 我也不知道是啥",
        'readMe': {
            type: readMe_type || 0,
            txt: readMe_txt || ""
        },
        'script': script || ""
    };
}


function formatDate(str) {
    let oDate = new Date(str);
    if ('Invalid Date' === oDate) return oDate;
    let oYear = oDate.getFullYear(),
        oMonth = oDate.getMonth() < 9 ? "0" + (oDate.getMonth() + 1) : (oDate.getMonth() + 1),
        oDay = oDate.getDate() < 10 ? "0" + oDate.getDate() : oDate.getDate(),
        oHour = oDate.getHours() < 10 ? "0" + oDate.getHours() : oDate.getHours(),
        oMinute = oDate.getMinutes() < 10 ? "0" + oDate.getMinutes() : oDate.getMinutes(),
        oSecond = oDate.getSeconds() < 10 ? "0" + oDate.getSeconds() : oDate.getSeconds(),
        oTime = oYear + '-' + oMonth + '-' + oDay + " " + oHour + ":" + oMinute + ":" + oSecond;//最后拼接时间
    return oTime;
};


/**
 * 格式化文件大小信息
 * @param {*} size 
 */
function formatSize(size) {
    if (!size) return size;
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


function getExtByName(name) {
    let pos = name.lastIndexOf('.');
    if (pos === -1) return "";
    else return name.slice(pos + 1);
}

function urlSpCharEncode(s) {
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