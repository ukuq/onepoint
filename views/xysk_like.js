// https://xysk.net/onedrive.html

exports.render = { r200_list, r200_file, rxxx_info, r401_auth };

/**
 * onepoint ukuq
 * time:191120
 */
function r401_auth(info, readMe, script, splitPath, G_CONFIG) {
    let html = get_html_head(splitPath.ph + splitPath.p0, splitPath.p1 + splitPath.p2, G_CONFIG);
    html += `<div class="main mdui-container-fluid"><div class="nexmoe-item list-wrapper"><div class="password" style="display: initial;"><div class="mdui-textfield"><form action="" method="post"><input type="password" class="mdui-textfield-input"  name="password" placeholder="${info}"><input type="submit" class="mdui-btn mdui-color-theme-accent mdui-ripple" style="margin: 15px 0;"value="提交" ></form></div></div></div></div>`;
    html += get_html_readMe(readMe);
    html += `${script}${G_CONFIG.site_script}`;
    html += `</div></body></html>`;
    return html;
}
function r200_list(data, readMe, script, splitPath, G_CONFIG) {
    let html = get_html_head(splitPath.ph + splitPath.p0, splitPath.p1 + splitPath.p2, G_CONFIG);
    let p_h01 = splitPath.ph + splitPath.p0 + splitPath.p1, preview;
    if (G_CONFIG.enablePreview) preview = "?&preview";
    else preview = "";
    html += `<div class="main mdui-container-fluid"><div class="nexmoe-item list-wrapper"><div class="list-header" style="display: initial;"><div class="file mdui-list-item th"><span class="name mdui-col-xs-12 mdui-col-sm-7">列表</span><span class="time mdui-col-sm-3 mdui-text-right">时间</span><span class="size mdui-col-sm-2 mdui-text-right">大小</span></div></div><div id="file-list" style="display: initial;">`;
    if (data.prevHref) {
        html += `<li class="mdui-list-item mdui-ripple"><a href="${p_h01}${data.prevHref}"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_upward</i>上一页</div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
    } else if (splitPath.p1 + splitPath.p2 !== '/') {
        html += `<li class="mdui-list-item mdui-ripple"><a href="../"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_upward</i>.. </div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
    }
    data.content.forEach(e => {
        if (e.nodeType === 1) {//文件夹 
            html += `<div class="row file-wrapper mdui-list-item mdui-ripple"><a href="${p_h01}${e.url_p2}"><div class="file"><i class="mdui-icon material-icons">folder_open</i><span class="name mdui-col-xs-12 mdui-col-sm-7 mdui-text-truncate">${e.name}</span><span class="time mdui-col-sm-3 mdui-text-right">${e.modified}</span><span class="size mdui-col-sm-2 mdui-text-right">${e.size}</span></div></a></div>`
        } else if (e.nodeType === 0) {//文件
            html += `<div class="row file-wrapper mdui-list-item mdui-ripple"><a href="${p_h01}${e.url_p2}${preview}"><div class="file"><i class="mdui-icon material-icons">image_aspect_ratio</i><span class="name mdui-col-xs-12 mdui-col-sm-7 mdui-text-truncate">${e.name}</span><span class="time mdui-col-sm-3 mdui-text-right">${e.modified}</span><span class="size mdui-col-sm-2 mdui-text-right">${e.size}</span></div></a></div>`
        } else {//映射盘
            html += `<div class="row file-wrapper mdui-list-item mdui-ripple"><a href="${p_h01}${e.url_p2}"><div class="file"><i class="mdui-icon material-icons">folder_open</i><span class="name mdui-col-xs-12 mdui-col-sm-7 mdui-text-truncate">${e.name}</span><span class="time mdui-col-sm-3 mdui-text-right">${e.modified}</span><span class="size mdui-col-sm-2 mdui-text-right">${e.size}</span></div></a></div>`
        }
    });

    if (data.nextHref) html += `<li class="mdui-list-item mdui-ripple"><a href="${p_h01}${data.nextHref}"><div class="mdui-col-xs-12 mdui-col-sm-7"><i class="mdui-icon material-icons">arrow_downward</i>下一页</div><div class="mdui-col-sm-3 mdui-text-right"></div><div class="mdui-col-sm-2 mdui-text-right"></div></a></li>`;
    html += `</ul></div></div></div>`;
    html += get_html_readMe(readMe);
    html += `${script}${G_CONFIG.site_script}`;
    html += `</div></body></html>`;
    return html;
}

function r200_file(fileInfo, readMe, script, splitPath, G_CONFIG) {
    let html = get_html_head(splitPath.ph + splitPath.p0, splitPath.p1 + splitPath.p2, G_CONFIG);
    let url = splitPath.ph + splitPath.p0 + splitPath.p1 + fileInfo['url_p2'];
    let downloadUrl = fileInfo['downloadUrl'];
    let type = fileInfo['fileType'];
    if (['bmp', 'jpg', 'jpeg', 'png', 'gif'].includes(type)) {
        html += `<div class="mdui-container-fluid"><div class="nexmoe-item"><img class="mdui-img-fluid mdui-center" src="${downloadUrl}"/></div></div>`;
    } else if (['mp4', 'mkv', 'webm', 'avi', 'mpg', 'mpeg', 'rm', 'rmvb', 'mov', 'wmv', 'mkv', 'asf'].includes(type)) {
        html += `<link class="dplayer-css" rel="stylesheet" href="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.css">
        <script src="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.js"></script>
        <div class="mdui-container-fluid"><div class="nexmoe-item"><div class="mdui-center" id="dplayer"></div></div></div>
        <script>const dp = new DPlayer({container: document.getElementById('dplayer'),lang:'zh-cn',video: {url: '${downloadUrl}',pic: '',type: 'auto'}});</script>`;
    } else if (['ogg', 'mp3', 'wav'].includes(type)) {
        html += `<div class="mdui-container-fluid"><div class="nexmoe-item"><audio class="mdui-center" src="${downloadUrl}" controls autoplay style="width: 100%;"></audio></div></div>`;
    } else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'mpp', 'rtf', 'vsd', 'vsdx'].includes(type)) {
        html += `<iframe src="https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(downloadUrl)}" width="100%" height="100%" style="border:0;border-radius: 5px;margin-top: 15px;">This browser does not support iframe</iframe>`;
    } else if (['txt', 'js', 'json', 'css', 'html', 'java', 'c', 'cpp', 'php', 'cmd', 'ps1', 'bat', 'sh', 'py', 'go', 'asp', 'md'].includes(type)) {
        html += `<div class="mdui-container-fluid"><div class="nexmoe-item" id="code-preview"><div class="" style="font-size: 40px;font-family: sans-serif;margin: 30px;text-align: center;">loading...</div></div></div>`;
        html += `<script src="https://cdn.bootcss.com/highlight.js/9.15.10/highlight.min.js"></script><script>let xhr=new XMLHttpRequest();let pre = document.getElementById('code-preview');xhr.open("GET",'${downloadUrl}');xhr.send();xhr.onload=function(){if(xhr.status==200){let prehtml = '<pre><code>';prehtml+= xhr.responseText;prehtml+='</code></pre>';pre.innerHTML=prehtml;hljs.highlightBlock(pre);}else{alert("something unexpected wrong");}}</script>`;
    } else if ('pdf' === type) {
        html += `<div id="pdf-preview"></div><script src="https://cdn.bootcss.com/pdfobject/2.1.1/pdfobject.min.js"></script><script>PDFObject.embed("${downloadUrl}", "#pdf-preview");</script>`;
    } else if (fileInfo['size'].endsWith(' B')) {
        html += `<div class="mdui-container-fluid"><div class="nexmoe-item" id="code-preview"><div class="" style="font-size: 40px;font-family: sans-serif;margin: 30px;text-align: center;">loading... trying to open as txt</div></div></div>`;
        html += `<script src="https://cdn.bootcss.com/highlight.js/9.15.10/highlight.min.js"></script><script>let xhr=new XMLHttpRequest();let pre = document.getElementById('code-preview');xhr.open("GET",'${downloadUrl}');xhr.send();xhr.onload=function(){if(xhr.status==200){let prehtml = '<pre><code>';prehtml+= xhr.responseText;prehtml+='</code></pre>';pre.innerHTML=prehtml;hljs.highlightBlock(pre);}else{alert("something unexpected wrong");}}</script>`;
    } else {
        html += `<div class="mdui-container-fluid"><div class="nexmoe-item"><div class="" style="font-size: 40px;font-family: sans-serif;margin: 30px;text-align: center;">此格式不支持预览 :-(</div></div></div>`;
    }
    html += `<div class="mdui-container-fluid"><div class="nexmoe-item">MENU<br><br><a class="mdui-btn mdui-btn-raised mdui-color-theme-accent mdui-ripple" href="${downloadUrl}" id="download-btn"  style="margin: 5px;">下载</a><button class="mdui-btn mdui-btn-raised mdui-color-theme-accent mdui-ripple" id="share-btn" style="margin: 5px;">分享</button><button class="mdui-btn mdui-btn-raised mdui-color-theme-accent mdui-ripple" id="quote-btn" style="margin: 5px;">md引用</button></div></div>`;
    html += `<script>document.querySelector('#share-btn').addEventListener('click',(event)=>{copyTextContent(null,window.location.href.slice(0,window.location.href.indexOf('?')));let target=event.target;let tt=target.textContent;target.innerHTML='已复制';setTimeout(()=>target.innerHTML=tt,250)});document.querySelector('#quote-btn').addEventListener('click',(event)=>{copyTextContent(null,'![]('+window.location.href.slice(0,window.location.href.indexOf('?'))+')');let target=event.target;let tt=target.textContent;target.innerHTML='已复制';setTimeout(()=>target.innerHTML=tt,250)});function copyTextContent(source,text){let result=false;let target=document.createElement('pre');target.style.opacity='0';target.textContent=text||source.textContent;document.body.appendChild(target);try{let range=document.createRange();range.selectNode(target);window.getSelection().removeAllRanges();window.getSelection().addRange(range);document.execCommand('copy');window.getSelection().removeAllRanges();result=true}catch(e){}document.body.removeChild(target);return result}</script>`;
    html += `${script}${G_CONFIG.site_script}`;
    html += `</div></body></html>`;
    return html;
}


function rxxx_info(info, readMe, script, splitPath, G_CONFIG) {
    let html = get_html_head(splitPath.ph + splitPath.p0, splitPath.p1 + splitPath.p2, G_CONFIG);
    html += `<div class="mdui-container-fluid"><div class="nexmoe-item"><div class="" style="font-size: 40px;font-family: sans-serif;margin: 30px;text-align: center;">${info}</div></div></div>`;
    html += get_html_readMe(readMe);
    html += `${script}${G_CONFIG.site_script}`;
    html += `</div></body></html>`;
    return html;
}

function get_html_head(p_h0, p_12, G_CONFIG) {
    let html = `<html lang="zh-CN"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge, Chrome=1"><meta name="robots" content="noindex,nofollow"><meta name="renderer" content="webkit"><meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"><title>${G_CONFIG.site_title} - index of ${p_12}</title><link rel="shortcut icon" href="${G_CONFIG.site_icon}"><meta name="keywords" content="${G_CONFIG.site_keywords}"><meta name="description" content="${G_CONFIG.site_description}"><link href="https://cdn.bootcss.com/mdui/0.4.3/css/mdui.min.css" rel="stylesheet"><link href="https://cdn.bootcss.com/highlight.js/9.15.10/styles/github.min.css" rel="stylesheet"><link href="https://cdn.bootcss.com/github-markdown-css/3.0.1/github-markdown.min.css" rel="stylesheet"><style>body{background-color:#f2f5fa}.nexmoe-item{margin:20px -8px 0!important;padding:15px!important;border-radius:5px;background-color:#fff;-webkit-box-shadow:0 .5em 3em rgba(161,177,204,.4);box-shadow:0 .5em 3em rgba(161,177,204,.4);background-color:#fff}.mdui-img-fluid,.mdui-video-fluid{border-radius:5px;border:1px solid #eee}.mdui-list{padding:0}.mdui-list-item{margin:0!important;border-radius:5px;padding:0 10px 0 5px!important;border-bottom:1px solid #eee;margin-bottom:10px!important}.mdui-list-item:last-child{margin-bottom:0!important}.mdui-toolbar{width:auto}.mdui-appbar .mdui-toolbar{height:56px;font-size:16px}.mdui-toolbar>*{padding:0 6px;margin:0 2px}.mdui-toolbar>.mdui-typo-headline{padding:0 16px 0 0}.mdui-toolbar>i{padding:0}.mdui-toolbar h3.title{padding:0 16px;line-height:30px;border-radius:30px;border:1px solid #eee;opacity:1;background-color:#1e89f2;color:#ffff}.mdui-toolbar>a:hover,a.active,a.mdui-typo-headline{opacity:1}.mdui-list>.th{background-color:initial}.mdui-list-item>a{width:100%;line-height:48px}.mdui-toolbar>a{padding:0 16px;line-height:30px;border-radius:30px;border:1px solid #eee}.mdui-toolbar>a:last-child{opacity:1;background-color:#1e89f2;color:#ffff}@media screen and (max-width:980px){.mdui-list-item .mdui-text-right{display:none}.mdui-container{width:100%!important;margin:0}.mdui-toolbar>.mdui-typo-headline,.mdui-toolbar>a:last-child,.mdui-toolbar>i:first-child{display:block}}#main-page{cursor:pointer}.nav-path{cursor:pointer}.nav-path:hover{text-decoration:underline}.file{width:100%;display:flex;align-items:center}.loading-wrapper{display:none;position:fixed;height:2em;line-height:2em;margin-top:.5em;width:100%;z-index:1}.loading{color:#fff;background:#dad7d7;height:100%;width:8em;margin:0 auto;text-align:center;border-radius:1em}.markdown-body{min-width:200px;margin:0 auto;padding:.7em 1em;font-size:1em}.markdown-body h1,h2,h3,h4,h5,h6{margin-top:0}.markdown-body img{max-width:90%;max-height:800px;width:auto;height:auto;display:block;margin:0 auto}.password{display:flex;align-items:center;margin:0 auto;padding-top:1em;display:none}a{text-decoration:none;color: #000000!important;}</style></head><body class="mdui-theme-primary-blue-grey mdui-theme-accent-blue"><div class="container mdui-container">`;
    let tmpIncPath = p_h0 + '/';
    html += `<div class="mdui-container-fluid"><div class="mdui-toolbar nexmoe-item nav"><i class="mdui-list-item-icon mdui-icon material-icons mdui-text-color-blue" id="main-page"><a href="${tmpIncPath}" style="text-decoration:none;color: #2196f3!important;">home</a></i><span id="path"><span class="nav-arr">/</span>`;
    let flag = p_h0.endsWith('/');
    p_12.split('/').forEach((e, i, t) => {
        if (e) {
            tmpIncPath += e;
            if (flag || i !== t.length - 1) tmpIncPath += '/';
            html += `<span class="nav-path"><a href="${tmpIncPath}" style="text-decoration:none;color: #000000!important;">${e}</a></span>`;
            if (i !== t.length - 1) html += `<span class="nav-arr">/</span>`;
        }
    });
    html += `</span></div></div>`;
    return html;
}


function get_html_readMe(readMe) {
    if (readMe.type === 0) return "";
    let html = `<div class="mdui-container-fluid"><div class="nexmoe-item list-wrapper"><div>README<br><br><br></div>`;
    let readText = "## Powered by [OnePoint](https://github.com/ukuq/onepoint)\n\n";
    if (readMe.type === 1) {
        readText = "load readme from:"
        readText += readMe.txt;
        html += `<script>console.log("前端加载文本, 暂不实现")</script>`;
    } else if (readMe.type === 2) {
        readText = readMe.txt;
    }
    html += `<div id="readMe"></div><textarea id="readme-raw-text" style="display:none;">${readText}</textarea></div></div>`;
    html += `<script src="https://cdn.bootcss.com/marked/0.7.0/marked.js"></script><script>document.getElementById('readMe').innerHTML =marked(document.getElementById('readme-raw-text').innerText);</script>`;
    html += `<div class="yuntucao-link"><a href="https://support.qq.com/products/102471"><div class="logo-wrap"><div class="logo"></div></div></a><div class="tips-wrap fade-in"><div class="tips"><span>意见反馈</span></div></div></div><style type="text/css">        .yuntucao-link {            position: fixed;            bottom: 40px;            right: 20px;            z-index: 9999        }        .yuntucao-link:hover .tips-wrap {            display: block        }        .yuntucao-link .logo-wrap {            cursor: pointer;            opacity: .9;            padding: 15px 10px 10px;            border-radius: 20px;            background: linear-gradient(-180deg, #dadfea, #ebedf5)        }        .yuntucao-link .logo-wrap:hover {            background: #418dff        }        .yuntucao-link .logo-wrap:hover .logo {            background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAcCAYAAAAAwr0iAAAABGdBTUEAALGPC/xhBQAAAe1JREFUSA29ls8uA1EUxjsqYSOIsCGNjX8bkbDgITyAjfAA3oOFlQXxEHZNI9hJRCJWgoigwkr8j0TQjt9hppk77ZmZzmTmJF/vPd85Pefr3Om9N5dzzLbtBXAEqiBNu6f4Juhxe+dw1tLsqNS+he/L8zGHkpWamuwmnbTqtxBwwGQ6u75GpycR8AOVN+jGzjf0KRgHVuOUOvYSRta6uy7iEC2MUZpL+pJlWROMq+JEsGNyRsEUsLV8ERDVik6iO4Z9bxvBFXBF4rmW3IyAGaeIO2o1Xf4vjyWWJRhySf8o74D6eHzJz/h7YBa0+WKau0OgAEa0hGYEaDUS8c0sQaJG2pdbtUAE/pGcdfDmyx3DX/RxuivvQExTd0/q3UStmWQJ1L8WP/dM/8lmJIkA+X9rdq0F/HwSAUFNgmKGhrgC5Fy4MyqZTtDTMTLjCiizxVaNSqaT+hMIaxAWr8mVJ/BS86JPAhvwdGTbfo1QriwCShES/SlffsLrswfIWSH3jDDbkrOglyw5uwfCsj1xeQnlJvXp4bzTYZxBL9FgfgL3fxNDRAEUQQWkbQ802AAdIsq4WkG2w+2DSQk69s44D3ZdIuH4wTtiqzUQcQhcu2Aih0t2RkNXQIl5V3adnU6OgGXGuJtUMs00lltsZvYLUPxHqiXJxFUAAAAASUVORK5CYII=) no-repeat 0        }        .yuntucao-link .logo-wrap .logo {            width: 32px;            height: 28px;            background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAcCAYAAAAAwr0iAAAABGdBTUEAALGPC/xhBQAAAqxJREFUSA21Vs9r1EAUfi/Z7bog1FU8KdWLv26ia1W0rApCD0qhdhdE8CdtL9WbBwX/gB48eShdqeJ1rb21KipbpSC9FARBoVIpiheVqkUQu+b5JWtKEjPJbNqdQ2bmvW++92XeZF6Y/rVypXoewwFi3iMi7NpXu2fiT8Q0njGz18517//qBCpXnt8SsgZWO1g0H3/IptJ58/bo5Gm88WA0uCne1pplbTLEoitNodcgxfZ3GkSyTwMLCC/h8YqZRQ+PFcTv8FxQ4YVkvQE2UwXw2Zkv95eO7gbhTZ9dOeGZdVTYmTbNfJRo7IBeMwxr3EYy1fu4Vcz0uFTiPxdPdcyR0FsVXluAZfFBm0So3qsIPXYHf29segM+6m0eu2/Iw5WqZk55AYfmmbCchIqMj0UxwRl4gjy3wb1DAaGUyvG/XXJQ2oPg2g3Bj8eBtVMQR5TU38AOBEIw4Ro1hljkh9djMe0ikQteW9Q4sQDkd6SvWLgRRl6+Xz0mQlvCfEFb4hTgQCo/LdSyN8FAqnliASLGnIoU9vcRPp8ruQAylEFAqvT5omOSUAAv9RUPfQySuXMxInfHhTl9IgHI/zzud8vH5Jng5mv2DkQHWJthfQF4k28e8VpDicnxmRMddgn+HkeGgjVvp+BhHDDoxx3wO2jzzicmZjMomzWvLXzMY3yn8mJjja0Z/JZtDgeFWZ2fk5cI8ivMi3qxHXVza6hv2civs625AzhPRMOVqTYIHsLWdmJhooO5zBs74C/4qXpgtqSvXuo6vOgIcNfcrVbXLH2mKQjZ69pwRhZRgs/mLHrq2lbSF4tHfoITIerNJ8A2lSuT0yij7Y6bedYwuau3u6B9tdZp9Z8R282PWlLS3szgtszQaojPY7C3p3A96rLRf8cGkSOj1XyDS1YE/wsT+LIWtt/NgQAAAABJRU5ErkJggg==) no-repeat 0        }        .yuntucao-link .tips-wrap {            position: relative;            display: none        }        .yuntucao-link .tips {            background: #4e4e4e;            border-radius: 4px;            position: absolute;            left: -98px;            top: -44px        }        .yuntucao-link .tips:after {            content: " ";            display: block;            width: 0;            height: 0;            border-top: 6px solid transparent;            border-bottom: 6px solid transparent;            border-left: 6px solid #4e4e4e;            position: absolute;            right: -6px;            top: 10px        }        .yuntucao-link .tips span {            line-height: 32px;            color: #fff;            padding: 0 15px        }</style>`;
    return html;
}