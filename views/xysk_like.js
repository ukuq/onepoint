const { formatSize, urlSpCharEncode } = require('../utils/msgutils');
exports.render = render;

//仅支持最基本的文件列出功能,不预览,不代理,不更新,不维护
function render(responseMsg, event, G_CONFIG) {
    let splitPath = event.splitPath;
    let p_h0 = urlSpCharEncode(splitPath.ph + splitPath.p0);
    let p_12 = urlSpCharEncode(splitPath.p_12);
    let p_h012 = p_h0 + p_12;
    let data = responseMsg.data;
    let html = `<html lang="zh-CN"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge, Chrome=1"><meta name="robots" content="noindex,nofollow"><meta name="renderer" content="webkit"><meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"><title>${G_CONFIG.site_title} - index of ${p_12}</title><link rel="shortcut icon" href="${G_CONFIG.site_icon}"><meta name="keywords" content="${G_CONFIG.site_keywords}"><meta name="description" content="${G_CONFIG.site_description}"><link href="https://cdn.bootcss.com/mdui/0.4.3/css/mdui.min.css" rel="stylesheet"><link href="https://cdn.bootcss.com/highlight.js/9.15.10/styles/github.min.css" rel="stylesheet"><link href="https://cdn.bootcss.com/github-markdown-css/3.0.1/github-markdown.min.css" rel="stylesheet"><style>body{background-color:#f2f5fa}.nexmoe-item{margin:20px -8px 0!important;padding:15px!important;border-radius:5px;background-color:#fff;-webkit-box-shadow:0 .5em 3em rgba(161,177,204,.4);box-shadow:0 .5em 3em rgba(161,177,204,.4);background-color:#fff}.mdui-img-fluid,.mdui-video-fluid{border-radius:5px;border:1px solid #eee}.mdui-list{padding:0}.mdui-list-item{margin:0!important;border-radius:5px;padding:0 10px 0 5px!important;border-bottom:1px solid #eee;margin-bottom:10px!important}.mdui-list-item:last-child{margin-bottom:0!important}.mdui-toolbar{width:auto}.mdui-appbar .mdui-toolbar{height:56px;font-size:16px}.mdui-toolbar>*{padding:0 6px;margin:0 2px}.mdui-toolbar>.mdui-typo-headline{padding:0 16px 0 0}.mdui-toolbar>i{padding:0}.mdui-toolbar h3.title{padding:0 16px;line-height:30px;border-radius:30px;border:1px solid #eee;opacity:1;background-color:#1e89f2;color:#ffff}.mdui-toolbar>a:hover,a.active,a.mdui-typo-headline{opacity:1}.mdui-list>.th{background-color:initial}.mdui-list-item>a{width:100%;line-height:48px}.mdui-toolbar>a{padding:0 16px;line-height:30px;border-radius:30px;border:1px solid #eee}.mdui-toolbar>a:last-child{opacity:1;background-color:#1e89f2;color:#ffff}@media screen and (max-width:980px){.mdui-list-item .mdui-text-right{display:none}.mdui-container{width:100%!important;margin:0}.mdui-toolbar>.mdui-typo-headline,.mdui-toolbar>a:last-child,.mdui-toolbar>i:first-child{display:block}}#main-page{cursor:pointer}.nav-path{cursor:pointer}.nav-path:hover{text-decoration:underline}.file{width:100%;display:flex;align-items:center}.loading-wrapper{display:none;position:fixed;height:2em;line-height:2em;margin-top:.5em;width:100%;z-index:1}.loading{color:#fff;background:#dad7d7;height:100%;width:8em;margin:0 auto;text-align:center;border-radius:1em}.markdown-body{min-width:200px;margin:0 auto;padding:.7em 1em;font-size:1em}.markdown-body h1,h2,h3,h4,h5,h6{margin-top:0}.markdown-body img{max-width:90%;max-height:800px;width:auto;height:auto;display:block;margin:0 auto}.password{display:flex;align-items:center;margin:0 auto;padding-top:1em;display:none}a{text-decoration:none;color: #000000;}</style></head><body class="mdui-theme-primary-blue-grey mdui-theme-accent-blue"><div class="container mdui-container">`;
    let tmpIncPath = p_h0 + '/';
    html += `<div class="mdui-container-fluid"><div class="mdui-toolbar nexmoe-item nav"><i class="mdui-list-item-icon mdui-icon material-icons mdui-text-color-blue" id="main-page"><a href="${tmpIncPath}" style="text-decoration:none;color: #2196f3!important;">home</a></i><span id="path"><span class="nav-arr">/</span>`;
    p_12.split('/').forEach((e, i, t) => {
        if (e) {
            tmpIncPath += e;
            tmpIncPath += '/';
            if (i !== t.length - 1) html += `<span class="nav-path"><a href="${tmpIncPath}" style="text-decoration:none;">${e}</a></span><span class="nav-arr">/</span>`;
            else html += `<span class="nav-path">${e}</span>`;
        }
    });
    html += `</span></div></div>`;

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
                    html += `<div class="row file-wrapper mdui-list-item mdui-ripple"><a href="${p_h012}${e.name}/"><div class="file"><i class="mdui-icon material-icons">folder_open</i><span class="name mdui-col-xs-12 mdui-col-sm-7 mdui-text-truncate">${e.name}</span><span class="time mdui-col-sm-3 mdui-text-right">${e.time}</span><span class="size mdui-col-sm-2 mdui-text-right">${formatSize(e.size)}</span></div></a></div>`
                } else if (e.type === 0) {//文件
                    html += `<div class="row file-wrapper mdui-list-item mdui-ripple"><a href="${p_h012}${e.name}"><div class="file"><i class="mdui-icon material-icons">image_aspect_ratio</i><span class="name mdui-col-xs-12 mdui-col-sm-7 mdui-text-truncate">${e.name}</span><span class="time mdui-col-sm-3 mdui-text-right">${e.time}</span><span class="size mdui-col-sm-2 mdui-text-right">${formatSize(e.size)}</span></div></a></div>`
                }
            });
            if (data.next) html += `<li class="mdui-list-item mdui-ripple"><a href="${data.next}"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_downward</i>下一页</div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
            html += `</ul></div></div></div>`;
            break;
        case 2://info
            if (responseMsg.statusCode === 401) {
                let pass = data.info.split(':');
                html += `<div class="main mdui-container-fluid"><div class="nexmoe-item list-wrapper"><div class="password" style="display: initial;"><div class="mdui-textfield"><form action="" method="post"><input type="password" class="mdui-textfield-input"  name="${pass[0]}" placeholder="${pass[1]}"><input type="submit" class="mdui-btn mdui-color-theme-accent mdui-ripple" style="margin: 15px 0;"value="提交" ></form></div></div></div></div>`;
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


