const { formatSize ,urlSpCharEncode } = require('../utils/msgutils');
const { mime } = require('../utils/nodeutils');
exports.render = render;

//暂时不处理特殊字符
function render(responseMsg, event, G_CONFIG) {
    let splitPath = event.splitPath;
    let p_h0 = splitPath.p_h0;
    let p_12 = splitPath.p_12;
    let data = responseMsg.data;
    let readmeFlag = false;
    let html = `<html lang="zh-CN"><head><meta charset="UTF-8"><link rel="shortcut icon" href="https://ukuq.github.io/onepoint/favicon.png"></head>`;
    html += `<body>`;
    let tmpIncPath = p_h0 + '/';
    html += `<div><a href="${tmpIncPath}">home</a><span>/</span>`;
    let flag = p_h0.endsWith('/');
    p_12.split('/').forEach((e, i, t) => {
        if (e) {
            tmpIncPath += e;
            if (flag || i !== t.length - 1) tmpIncPath += '/';
            html += `<span><a href="${tmpIncPath}">${e}</a></span>`;
            if (i !== t.length - 1) html += `<span>/</span>`;
        }
    });
    html += `</div>`;
    switch (responseMsg.type) {
        case 0://file
            break;
        case 1://list
            html += `<table><thead><tr><th>Name</th><th>Last modified</th><th>Size</th></tr></thead><tbody>`
            if (data.prevHref) {
                html += `<tr><td><a href="${data.prevHref}">上一页</a></td><td></td><td></td><tr>`
            } else if (splitPath.p_12 !== '/') {
                html += `<tr><td><a href="../">..</a></td><td></td><td></td>`
            }
            data.content.forEach(e => {
                if (e.type === 1 || e.type === 3) {//文件夹 
                    html += `<tr><td><a href="${splitPath.p_h012}${e.name}/">${e.name}/</a></td><td>${e.time}</td><td>${formatSize(e.size)}</td><tr>`
                } else if (e.type === 0) {//文件
                    if (e.name === 'README.md') { readmeFlag = true };
                    html += `<tr><td><a href="${splitPath.p_h012}${e.name}">${e.name}</a></td><td>${e.time}</td><td>${formatSize(e.size)}</td><td><tr>`
                }
            });
            if (data.nextHref) html += `<tr><td><a href="${data.nextHref}">下一页</a></td><td></td><td></td><tr>`;
            html += `</tbody></table>`;
            break;
        case 2://info
            if (responseMsg.statusCode === 401) {
                html += `<form action="" method="post"><input type="password" name="password" placeholder="${data.info}"><input type="submit" value="提交" ></form>`;
            } else {
                html += `<div><span>${data.info}</span></div>`
            }
            break;
        default:
            throw new Error("no such response type");
    }
    html += `${G_CONFIG.site_script}</body></html>`;
    return html;
}





