const { formatSize, urlSpCharEncode } = require('../utils/msgutils');
exports.render = render;

//仅支持最基本的文件列出功能,不预览,不代理,不更新,不维护
function render(responseMsg, event, G_CONFIG) {
    let splitPath = event.splitPath;
    let p_h0 = urlSpCharEncode(splitPath.ph + splitPath.p0);
    let p_12 = urlSpCharEncode(splitPath.p_12);
    let p_h012 = p_h0 + p_12;
    let data = responseMsg.data;
    let html = `<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0,maximum-scale=1.0, user-scalable=no"><title>${G_CONFIG.site_title} - index of ${p_12}</title><link rel="shortcut icon" href="${G_CONFIG.site_icon}"><meta name="keywords" content="${G_CONFIG.site_keywords}"><meta name="description" content="${G_CONFIG.site_description}"><link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"><link href="https://cdn.bootcss.com/mdui/0.4.3/css/mdui.min.css" rel="stylesheet"><style>body{background-color:#f2f5fa;padding-bottom:60px;background-position:center bottom;background-repeat:no-repeat;background-attachment:fixed}.nexmoe-item{margin:20px -8px 0!important;padding:15px!important;border-radius:5px;background-color:#fff;-webkit-box-shadow:0 .5em 3em rgba(161,177,204,.4);box-shadow:0 .5em 3em rgba(161,177,204,.4);background-color:#fff}.mdui-img-fluid,.mdui-video-fluid{border-radius:5px;border:1px solid #eee}.mdui-list{padding:0}.mdui-list-item{margin:0!important;border-radius:5px;padding:0 10px 0 5px!important;border:1px solid #eee;margin-bottom:10px!important}.mdui-list-item:last-child{margin-bottom:0!important}.mdui-list-item:first-child{border:0}.mdui-toolbar{width:auto;margin-top:60px!important}.mdui-appbar .mdui-toolbar{height:56px;font-size:16px}.mdui-toolbar>*{padding:0 6px;margin:0 2px;opacity:.5}.mdui-toolbar>.mdui-typo-headline{padding:0 16px 0 0}.mdui-toolbar>i{padding:0}.mdui-toolbar>a:hover,a.mdui-typo-headline,a.active{opacity:1}.mdui-container{max-width:980px}.mdui-list>.th{background-color:initial}.mdui-list-item>a{width:100%;line-height:48px}.mdui-toolbar>a{padding:0 16px;line-height:30px;border-radius:30px;border:1px solid #eee}.mdui-toolbar>a:last-child{opacity:1;background-color:#1e89f2;color:#ffff}@media screen and (max-width:980px){.mdui-list-item .mdui-text-right{display:none}.mdui-container{width:100%!important;margin:0}.mdui-toolbar>*{display:none}.mdui-toolbar>a:last-child,.mdui-toolbar>.mdui-typo-headline,.mdui-toolbar>i:first-child{display:block}}</style></head><body class="mdui-theme-primary-blue-grey mdui-theme-accent-blue"><div class="mdui-container">`;

    html += `<div class="mdui-container-fluid"><div class="mdui-toolbar nexmoe-item">`;
    let tmpIncPath = p_h0 + '/';
    html += `<a href="${tmpIncPath}">/</a>`;
    p_12.split('/').forEach((e, i, t) => {
        if (e) {
            tmpIncPath += e;
            tmpIncPath += '/';
            if (i !== t.length - 1) html += `<i class="mdui-icon material-icons mdui-icon-dark" style="margin:0;">chevron_right</i><a href="${tmpIncPath}">${e}</a>`;
            else html += `<span>${e}</span>`;
        }
    });
    html += `</div></div>`;

    switch (responseMsg.type) {
        case 0://file
            break;
        case 1://list
            html += `<div class="mdui-container-fluid"><style>.thumb .th{display:none}.thumb .mdui-text-right{display:none}.thumb .mdui-list-item a,.thumb .mdui-list-item{width:217px;height:230px;float:left;margin:10px 10px!important}.thumb .mdui-col-xs-12,.thumb .mdui-col-sm-7{width:100%!important;height:230px}.thumb .mdui-list-item .mdui-icon{font-size:100px;display:block;margin-top:40px;color:#7ab5ef}.thumb .mdui-list-item span{float:left;display:block;text-align:center;width:100%;position:absolute;top:180px}</style><div class="nexmoe-item"><div class="mdui-row"><ul class="mdui-list"><li class="mdui-list-item th"><div class="mdui-col-xs-12 mdui-col-sm-7">文件 <i class="mdui-icon material-icons icon-sort" data-sort="name" data-order="downward">expand_more</i></div><div class="mdui-col-sm-3 mdui-text-right">修改时间 <i class="mdui-icon material-icons icon-sort" data-sort="date" data-order="downward">expand_more</i></div><div class="mdui-col-sm-2 mdui-text-right">大小 <i class="mdui-icon material-icons icon-sort" data-sort="size" data-order="downward">expand_more</i></div></li>`;
            if (data.prev) {
                html += `<li class="mdui-list-item mdui-ripple"><a href="${data.prev}"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_upward</i>上一页</div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
            } else if (p_12 !== '/') {
                html += `<li class="mdui-list-item mdui-ripple"><a href="../"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_upward</i>.. </div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
            }
            data.list.forEach(e => {
                if (e.type === 1 || e.type === 3) {//文件夹 
                    html += `<li class="mdui-list-item dir mdui-ripple realFile"><a href="${p_h012}${e.name}/"><div class="mdui-col-xs-12 mdui-col-sm-7 mdui-text-truncate"><i class="mdui-icon material-icons">folder_open</i><span>${e.name}</span></div><div class="mdui-col-sm-3 mdui-text-right">${e.time}</div><div class="mdui-col-sm-2 mdui-text-right">${formatSize(e.size)}</div></a></li>`;
                } else if (e.type === 0) {//文件
                    html += `<li class="mdui-list-item file mdui-ripple realFile"><a href="${p_h012}${e.name}"><div class="mdui-col-xs-12 mdui-col-sm-7 mdui-text-truncate"><i class="mdui-icon material-icons">insert_drive_file</i><span>${e.name}</span></div><div class="mdui-col-sm-3 mdui-text-right">${e.time}</div><div class="mdui-col-sm-2 mdui-text-right">${formatSize(e.size)}</div></a></li>`;
                }
            });
            if (data.next) html += `<li class="mdui-list-item mdui-ripple"><a href="${data.next}"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_downward</i>下一页</div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
            html += `</ul></div></div></div>`;
            break;
        case 2://info
            if (responseMsg.statusCode === 401) {
                let pass = data.info.split(':');
                html += `<div class="mdui-container-fluid"><div class="mdui-col-md-6 mdui-col-offset-md-3"><center><h1 class="mdui-typo-display-2-opacity">${pass[0]}</h1></center><form action="" method="post"><div class="mdui-textfield mdui-textfield-floating-label"><i class="mdui-icon material-icons">https</i><input name="${pass[0]}" class="mdui-textfield-input" type="password" placeholder="${pass[1]}"></div><br><button type="submit" class="mdui-center mdui-btn mdui-btn-raised mdui-ripple mdui-color-theme"><i class="mdui-icon material-icons">fingerprint</i>查看</button></form></div></div>`;
            } else {
                html += `<div class="mdui-container-fluid"><div class="nexmoe-item"><div class="" style="font-size: 40px;font-family: sans-serif;margin: 30px;text-align: center;">${data.info}</div></div></div>`;
            }
            break;
        default:
            throw new Error("no such response type");
    }
    html += `${G_CONFIG.site_script}<div class="text-right" style="float: right;"><span class="text-muted">Powered by <a href="https://github.com/ukuq/onepoint" style="color: cornflowerblue;">OnePoint</a></span><span class="text-muted ml-2" style="margin-left: 10px;">Processing time: <a href="javascript:void" style="color: cornflowerblue;">${new Date() - event.start_time}ms</a></span></div></div></body></html>`;
    return html;
}