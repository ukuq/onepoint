const { formatSize ,urlSpCharEncode } = require('../utils/msgutils');
exports.render = render;

//仅支持最基本的文件列出功能,不预览,不代理,不更新,不维护
function render(responseMsg, event, G_CONFIG) {
    let splitPath = event.splitPath;
    let p_h0 = urlSpCharEncode(splitPath.ph + splitPath.p0);
    let p_12 = urlSpCharEncode(splitPath.p_12);
    let p_h012 = p_h0 + p_12;
    let data = responseMsg.data;
    let html = `<html lang="zh-CN"><head><meta charset="UTF-8"><link rel="shortcut icon" href="${G_CONFIG.site_icon}"></head>`;
    html += `<body>`;
    let tmpIncPath = p_h0 + '/';
    html += `<div><a href="${tmpIncPath}">home</a><span>/</span>`;
    p_12.split('/').forEach((e, i, t) => {
        if (e) {
            tmpIncPath += e;
            tmpIncPath += '/';
            if (i !== t.length - 1) html += `<span><a href="${tmpIncPath}">${e}</a></span>`;
            else html += `<span>${e}</span>`;
        }
    });
    html += `</div>`;
    switch (responseMsg.type) {
        case 0://file
            break;
        case 1://list
            html += `<table><thead><tr><th>Name</th><th>Last modified</th><th>Size</th></tr></thead><tbody>`
            if (data.prev) {
                html += `<tr><td><a href="${data.prev}">上一页</a></td><td></td><td></td><tr>`
            } else if (p_12 !== '/') {
                html += `<tr><td><a href="../">..</a></td><td></td><td></td>`
            }
            data.list.forEach(e => {
                if (e.type === 1 || e.type === 3) {//文件夹 
                    html += `<tr><td><a href="${p_h012}${e.name}/">${e.name}/</a></td><td>${e.time}</td><td>${formatSize(e.size)}</td><tr>`
                } else if (e.type === 0) {//文件
                    html += `<tr><td><a href="${p_h012}${e.name}">${e.name}</a></td><td>${e.time}</td><td>${formatSize(e.size)}</td><td><tr>`
                }
            });
            if (data.next) html += `<tr><td><a href="${data.next}">下一页</a></td><td></td><td></td><tr>`;
            html += `</tbody></table>`;
            break;
        case 2://info
            if (responseMsg.statusCode === 401) {
                let pass = data.info.split(':');
                html += `<form action="" method="post"><input type="password" name="${pass[0]}" placeholder="${pass[1]}"><input type="submit" value="submit" ></form>`;
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





