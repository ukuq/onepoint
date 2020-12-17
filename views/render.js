exports.render = { r200_list, r200_file, rxxx_info };

/**
 * onepoint ukuq
 * time:191029
 */

function r200_list(data, readMe, script, splitPath, G_CONFIG) {
    let p_h0, p_h01, p_12, preview;
    p_h0 = splitPath.host + splitPath.p0;
    p_h01 = p_h0 + splitPath.p1;
    p_12 = splitPath.p1 + splitPath.p2;
    if (G_CONFIG.enablePreview) preview = "?&preview";
    else preview = "";
    let html = get_html_head(p_h0, p_12, G_CONFIG);

    html += `<div class="mdui-container-fluid"><style>.thumb .th{display:none}.thumb .mdui-text-right{display:none}.thumb .mdui-list-item a,.thumb .mdui-list-item{width:217px;height:230px;float:left;margin:10px 10px!important}.thumb .mdui-col-xs-12,.thumb .mdui-col-sm-7{width:100%!important;height:230px}.thumb .mdui-list-item .mdui-icon{font-size:100px;display:block;margin-top:40px;color:#7ab5ef}.thumb .mdui-list-item span{float:left;display:block;text-align:center;width:100%;position:absolute;top:180px}</style><div class="nexmoe-item"><div class="mdui-row"><ul class="mdui-list"><li class="mdui-list-item th"><div class="mdui-col-xs-12 mdui-col-sm-7">文件 <i class="mdui-icon material-icons icon-sort" data-sort="name" data-order="downward">expand_more</i></div><div class="mdui-col-sm-3 mdui-text-right">修改时间 <i class="mdui-icon material-icons icon-sort" data-sort="date" data-order="downward">expand_more</i></div><div class="mdui-col-sm-2 mdui-text-right">大小 <i class="mdui-icon material-icons icon-sort" data-sort="size" data-order="downward">expand_more</i></div></li>`;
    if (data.prevHref) {
        html += `<li class="mdui-list-item mdui-ripple"><a href="${p_h01}${data.prevHref}"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_upward</i>上一页</div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
    } else if (p_12 !== '/') {
        html += `<li class="mdui-list-item mdui-ripple"><a href="../"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_upward</i>.. </div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
    }
    data.content.forEach(e => {
        if (e.nodeType != 0) {
            html += `<li class="mdui-list-item mdui-ripple realFile"><a href="${p_h01}${e.url_p2}"><div class="mdui-col-xs-12 mdui-col-sm-7 mdui-text-truncate"><i class="mdui-icon material-icons">folder_open</i><span>${e.name}</span></div><div class="mdui-col-sm-3 mdui-text-right">${e.modified}</div><div class="mdui-col-sm-2 mdui-text-right">${e.size}</div></a></li>`;
        } else {
            html += `<li class="mdui-list-item file mdui-ripple realFile"><a href="${p_h01}${e.url_p2}${preview}"><div class="mdui-col-xs-12 mdui-col-sm-7 mdui-text-truncate"><i class="mdui-icon material-icons">insert_drive_file</i><span>${e.name}</span></div><div class="mdui-col-sm-3 mdui-text-right">${e.modified}</div><div class="mdui-col-sm-2 mdui-text-right">${e.size}</div></a></li>`;
        }
    });

    if (data.nextHref) html += `<li class="mdui-list-item mdui-ripple"><a href="${p_h01}${data.nextHref}"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_downward</i>下一页</div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
    html += `</ul></div></div></div>`;
    html += get_html_readMe(readMe);
    html += `<a href="javascript:window.scrollTo(0,0);" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">flight</i></a>`;
    html += `${script}${G_CONFIG.site_script}`;
    html += `</div></body></html>`;
    return html;
}

function r200_file(fileInfo, readMe, script, splitPath, G_CONFIG) {
    let p_h0, p_h01, p_12;
    p_h0 = splitPath.host + splitPath.p0;
    p_h01 = p_h0 + splitPath.p1;
    p_12 = splitPath.p1 + splitPath.p2;
    let html = get_html_head(p_h0, p_12, G_CONFIG);
    let type = fileInfo['fileType'];
    let downloadUrl = fileInfo['downloadUrl'];
    let url = p_h01 + fileInfo['url_p2'];
    if (['bmp', 'jpg', 'jpeg', 'png', 'gif'].indexOf(type) != -1) {
        html += preview_image(downloadUrl, url);
    } else if (['mp4', 'mkv', 'webm', 'avi', 'mpg', 'mpeg', 'rm', 'rmvb', 'mov', 'wmv', 'mkv', 'asf'].indexOf(type) != -1) {
        html += preview_video_dplayer(downloadUrl, url);
    } else if (['ogg', 'mp3', 'wav'].indexOf(type) != -1) {
        html += preview_audio(downloadUrl, url);
    } else {
        html += preview_unsupposed(downloadUrl, url);
    }
    html += get_html_readMe(readMe);
    html += `<a href="${url}" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">file_download</i></a>`
    html += `${script}${G_CONFIG.site_script}`;
    html += `</div></body></html>`;
    return html;
}


function rxxx_info(statusCode, info, readMe, script, splitPath, G_CONFIG) {
    let p_h0, p_12;
    p_h0 = splitPath.host + splitPath.p0;
    p_12 = splitPath.p1 + splitPath.p2;
    let html = get_html_head(p_h0, p_12, G_CONFIG);
    html += `<div class="mdui-container-fluid"><div class="nexmoe-item"><div class="" style="font-size: 40px;font-family: sans-serif;margin: 30px;text-align: center;">${info}</div></div></div>`;
    html += get_html_readMe(readMe);
    html += `<a href="javascript:window.scrollTo(0,0);" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">flight</i></a>`;
    html += `${script}${G_CONFIG.site_script}`;
    html += `</div></body></html>`;
    return html;
}



function get_html_head(p_h0, reqPath, G_CONFIG) {
    let html = `<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0,maximum-scale=1.0, user-scalable=no"><title>${G_CONFIG.site_title} - index of ${reqPath}</title><link rel="shortcut icon" href="${G_CONFIG.site_icon}"><meta name="keywords" content="${G_CONFIG.site_keywords}"><meta name="description" content="${G_CONFIG.site_description}"><link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"><link href="https://cdn.bootcss.com/mdui/0.4.3/css/mdui.min.css" rel="stylesheet"><style>body{background-color:#f2f5fa;padding-bottom:60px;background-position:center bottom;background-repeat:no-repeat;background-attachment:fixed}.nexmoe-item{margin:20px -8px 0!important;padding:15px!important;border-radius:5px;background-color:#fff;-webkit-box-shadow:0 .5em 3em rgba(161,177,204,.4);box-shadow:0 .5em 3em rgba(161,177,204,.4);background-color:#fff}.mdui-img-fluid,.mdui-video-fluid{border-radius:5px;border:1px solid #eee}.mdui-list{padding:0}.mdui-list-item{margin:0!important;border-radius:5px;padding:0 10px 0 5px!important;border:1px solid #eee;margin-bottom:10px!important}.mdui-list-item:last-child{margin-bottom:0!important}.mdui-list-item:first-child{border:0}.mdui-toolbar{width:auto;margin-top:60px!important}.mdui-appbar .mdui-toolbar{height:56px;font-size:16px}.mdui-toolbar>*{padding:0 6px;margin:0 2px;opacity:.5}.mdui-toolbar>.mdui-typo-headline{padding:0 16px 0 0}.mdui-toolbar>i{padding:0}.mdui-toolbar>a:hover,a.mdui-typo-headline,a.active{opacity:1}.mdui-container{max-width:980px}.mdui-list>.th{background-color:initial}.mdui-list-item>a{width:100%;line-height:48px}.mdui-toolbar>a{padding:0 16px;line-height:30px;border-radius:30px;border:1px solid #eee}.mdui-toolbar>a:last-child{opacity:1;background-color:#1e89f2;color:#ffff}@media screen and (max-width:980px){.mdui-list-item .mdui-text-right{display:none}.mdui-container{width:100%!important;margin:0}.mdui-toolbar>*{display:none}.mdui-toolbar>a:last-child,.mdui-toolbar>.mdui-typo-headline,.mdui-toolbar>i:first-child{display:block}}</style></head><body class="mdui-theme-primary-blue-grey mdui-theme-accent-blue"><div class="mdui-container">`;
    html += `<div class="mdui-container-fluid"><div class="mdui-toolbar nexmoe-item">`;
    let tmpIncPath = p_h0 + '/';
    html += `<a href="${tmpIncPath}">/</a>`;
    reqPath.split('/').forEach(e => {
        if (e) {
            tmpIncPath += e;
            tmpIncPath += '/';
            html += `<i class="mdui-icon material-icons mdui-icon-dark" style="margin:0;">chevron_right</i><a href="${tmpIncPath}">${e}</a>`;
        }
    });
    html += `</div></div>`;
    return html;
}


function get_html_readMe(readMe) {
    if (readMe.type === 0) return "";
    let html = `<div class="mdui-typo mdui-shadow-3" style="padding: 20px;margin: 30px 0px 0px 0px; border-radius: 5px;"><div class="mdui-chip"><span class="mdui-chip-icon"><i class="mdui-icon material-icons">face</i></span><span class="mdui-chip-title">README.md</span></div>`;
    let readText = "## Powered by [OnePoint](https://github.com/ukuq/onepoint)\\n\\n";
    if (readMe.type === 1) {
        readText = "load readme from:"
        readText += readMe.txt;
        html += `<script>前端加载, 暂不实现</script>`;
    } else if (readMe.type === 2) {
        readText = readMe.txt;
    }
    html += `<div id="readMe"></div></div>`;
    html += `<script src="https://cdn.bootcss.com/marked/0.7.0/marked.js"></script><script>document.getElementById('readMe').innerHTML =marked('${readText}');</script>`;
    return html;
}

function preview_audio(downloadUrl, url) {
    return `<div class="mdui-container-fluid"><div class="nexmoe-item"><audio class="mdui-center" src="${downloadUrl}" controls autoplay style="width: 100%;"></audio><br>
	<!-- 固定标签 --><div class="mdui-textfield"><label class="mdui-textfield-label">下载地址</label><input class="mdui-textfield-input" type="text" value="${url}"/></div>
    <div class="mdui-textfield"><label class="mdui-textfield-label">引用地址</label><textarea class="mdui-textfield-input"><audio src="${url}"></audio></textarea></div></div></div>`;
}
function preview_image(downloadUrl, url) {
    return `<div class="mdui-container-fluid"><div class="nexmoe-item"><img class="mdui-img-fluid mdui-center" src="${downloadUrl}"/>
	<div class="mdui-textfield"><label class="mdui-textfield-label">下载地址</label><input class="mdui-textfield-input" type="text" value="${url}"/></div>
	<div class="mdui-textfield"><label class="mdui-textfield-label">HTML 引用地址</label><input class="mdui-textfield-input" type="text" value="<img src='${url}' />"/>
    </div><div class="mdui-textfield"><label class="mdui-textfield-label">Markdown 引用地址</label><input class="mdui-textfield-input" type="text" value="![](${url})"/></div></div></div>`;
}
function preview_video_dplayer(downloadUrl, url) {
    return `<link class="dplayer-css" rel="stylesheet" href="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.css">
    <script src="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.js"></script>
    <div class="mdui-container-fluid"><div class="nexmoe-item"><div class="mdui-center" id="dplayer"></div><!-- 固定标签 -->
    <div class="mdui-textfield"><label class="mdui-textfield-label">下载地址</label>
    <input class="mdui-textfield-input" type="text" value="${url}"/></div><div class="mdui-textfield">
    <label class="mdui-textfield-label">引用地址</label><textarea class="mdui-textfield-input"><video><source src="${url}" type="video/mp4"></video></textarea></div></div></div>
    <script>const dp = new DPlayer({container: document.getElementById('dplayer'),lang:'zh-cn',video: {url: '${downloadUrl}',pic: '',type: 'auto'}});</script>`;
}

function preview_video_dash(downloadUrl, url) {
    return `<link class="dplayer-css" rel="stylesheet" href="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.css"><script src="//cdn.bootcss.com/dashjs/3.0.0/dash.all.min.js"></script><script src="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.js"></script>
    <div class="mdui-container-fluid"><div class="nexmoe-item"><div class="mdui-center" id="dplayer"></div><!-- 固定标签 --><div class="mdui-textfield"><label class="mdui-textfield-label">下载地址</label>
    <input class="mdui-textfield-input" type="text" value="${url}"/></div><div class="mdui-textfield"><label class="mdui-textfield-label">引用地址</label>
    <textarea class="mdui-textfield-input"><video><source src="${url}" type="video/mp4"></video></textarea></div></div></div>
    <script>const dp = new DPlayer({container: document.getElementById('dplayer'),lang:'zh-cn',video: {url: '${downloadUrl}',pic: '',type: 'dash'}});</script>`;
}

function preview_video_html5(downloadUrl, url) {
    return `<div class="mdui-container-fluid"><div class="nexmoe-item"><video class="mdui-video-fluid mdui-center" preload controls ">
    <source src="${downloadUrl}" type="video/mp4"></video>
	<!-- 固定标签 --><div class="mdui-textfield"><label class="mdui-textfield-label">下载地址</label><input class="mdui-textfield-input" type="text" value="${url}"/></div>
	<div class="mdui-textfield"><label class="mdui-textfield-label">引用地址</label><textarea class="mdui-textfield-input"><video><source src="${url}" type="video/mp4"></video></textarea></div></div></div>`;
}


function preview_unsupposed(downloadUrl, url) {
    return `<div class="mdui-container-fluid"><div class="nexmoe-item"><div class="" style="font-size: 40px;font-family: sans-serif;margin: 30px;text-align: center;">此格式不支持预览 :-(</div>
    <div class="mdui-textfield"><label class="mdui-textfield-label">下载地址</label><input class="mdui-textfield-input" type="text" value="${url}"></div>
    <div class="mdui-textfield mdui-textfield-not-empty"><label class="mdui-textfield-label">直链地址</label><input class="mdui-textfield-input" type="text" value="${downloadUrl}"></div></div></div>`;
}



