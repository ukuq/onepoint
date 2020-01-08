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
    let html = `<html lang="zh-CN"><head><meta charset="UTF-8"><link rel="shortcut icon" href="https://ukuq.github.io/onepoint/favicon.png"><meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"><script src="https://cdn.jsdelivr.net/npm/js-cookie@beta/dist/js.cookie.min.js"></script><script src="https://cdn.bootcss.com/marked/0.7.0/marked.js"></script></head>`;
    html += `<body><h1>Index of ${G_CONFIG.site_name}</h1>`;
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
    html += `</div><div><select id="proxy-opt"><option value="">none</option>`;
    G_CONFIG.proxy.forEach((e) => {
        html += `<option value="${e}">${e}</option>`;
    });
    html += `</select><button id="proxy-submit">启用代理</button><span >time: ${new Date()-event.start_time} ms</span></div><hr style=" width: 500; margin-left: 0;">`;
    switch (responseMsg.type) {
        case 0://file
            let fileInfo = data.fileInfo;
            let downloadUrl = data.downloadUrl;
            if (event.cookie.proxy) downloadUrl = event.cookie.proxy + '?url=' + encodeURIComponent(downloadUrl);
            let type = fileInfo['mime'].slice(0, fileInfo['mime'].indexOf('/'));
            html += `<div><a href="${downloadUrl}" id="download-btn"  style="margin: 5px;">下载</a><a href="javascript:void" id="share-btn" style="margin: 5px;">分享</a><a href="javascript:void" id="quote-btn" style="margin: 5px;">md引用</a></div><hr style="width: 500; margin-left: 0;">`;
            if (type === 'image') {
                html += `<div><img src="${downloadUrl}"/></div>`;
            } else if (type === 'video') {
                html += `<link class="dplayer-css" rel="stylesheet" href="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.css">
                <script src="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.js"></script>
                <div class="mdui-center" id="dplayer"></div>
                <script>const dp = new DPlayer({container: document.getElementById('dplayer'),lang:'zh-cn',video: {url: '${downloadUrl}',pic: '',type: 'auto'}});</script>`;
            } else if (type === 'audio') {
                html += `<div><audio src="${downloadUrl}" controls autoplay style="width: 100%;"></audio></div>`;
            } else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'mpp', 'rtf', 'vsd', 'vsdx'].includes(mime.getExtension(fileInfo['mime']))) {
                html += `<iframe src="https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(downloadUrl)}" width="100%" height="100%" style="border:0;border-radius: 5px;margin-top: 15px;">This browser does not support iframe</iframe>`;
            } else if (fileInfo['mime'].endsWith('pdf')) {
                html += `<div id="pdf-preview"></div><script src="https://cdn.bootcss.com/pdfobject/2.1.1/pdfobject.min.js"></script><script>PDFObject.embed("${downloadUrl}", "#pdf-preview");</script>`;
            } else if (type === 'text' || (fileInfo['size'] < 1024)) {
                html += `<div id="code-preview">loading...</div>`;
                html += `<script src="https://cdn.bootcss.com/highlight.js/9.15.10/highlight.min.js"></script><script>fetch('${downloadUrl}').then(response => response.text()).then(data => {document.getElementById('code-preview').innerHTML ='<pre><code>'+marked(data)+'</code></pre>';hljs.highlightBlock(document.getElementById('code-preview'));}).catch(err => document.getElementById('code-preview').innerHTML="Oh, error:" + err);</script>`;
            } else {
                html += `<div>此格式不支持预览 :-(</div>`;
            }
            html += `<hr style="width: 500; margin-left: 0;">`;
            html += `<script>document.querySelector('#share-btn').addEventListener('click',(event)=>{copyTextContent(null,window.location.href.slice(0,window.location.href.indexOf('?')));let target=event.target;let tt=target.textContent;target.innerHTML='已复制';setTimeout(()=>target.innerHTML=tt,250)});document.querySelector('#quote-btn').addEventListener('click',(event)=>{copyTextContent(null,'![]('+window.location.href.slice(0,window.location.href.indexOf('?'))+')');let target=event.target;let tt=target.textContent;target.innerHTML='已复制';setTimeout(()=>target.innerHTML=tt,250)});function copyTextContent(source,text){let result=false;let target=document.createElement('pre');target.style.opacity='0';target.textContent=text||source.textContent;document.body.appendChild(target);try{let range=document.createRange();range.selectNode(target);window.getSelection().removeAllRanges();window.getSelection().addRange(range);document.execCommand('copy');window.getSelection().removeAllRanges();result=true}catch(e){}document.body.removeChild(target);return result}</script>`;
            break;
        case 1://list
            html += `<table style="border-spacing:15px 0px;"><tbody><tr><th colspan="4"><hr></th></tr><tr><th>Name</th><th>Last modified</th><th>Size</th><th>Operate</th></tr><tr><th colspan="4"><hr></th></tr>`
            if (data.prevHref) {
                html += `<tr><td><a href="${p_h01}${data.prevHref}">上一页</a></td><td></td><td></td><td></td>`
            } else if (splitPath.p_12 !== '/') {
                html += `<tr><td><a href="../">..</a></td><td></td><td></td><td></td>`
            }
            data.content.forEach(e => {
                if (e.type === 1 || e.type === 3) {//文件夹 
                    html += `<tr><td><a href="${splitPath.p_h012}${e.name}/">${e.name}/</a></td><td>${e.time}</td><td>${formatSize(e.size)}</td><td>-</td>`
                } else if (e.type === 0) {//文件
                    if (e.name === 'README.md') { readmeFlag = true };
                    html += `<tr><td><a href="${splitPath.p_h012}${e.name}?preview">${e.name}</a></td><td>${e.time}</td><td>${formatSize(e.size)}</td><td><a href="${splitPath.p_h012}${e.name}">下载</a></td>`
                }
            });
            if (data.nextHref) html += `<tr><td><a href="${p_h01}${data.prevHref}">下一页</a></td><td></td><td></td><td></td>`;
            html += `<tr><th colspan="4"><hr></th></tr></tbody></table>`;
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
    html += `<div id="readMe" class="markdown-body"></div>`;
    html += `${G_CONFIG.site_script}${event.script}<script>if(Cookies.get('proxy')){let s = document.getElementById('proxy-opt').options;let c = Cookies.get('proxy');for(let i=0;i< s.length;i++){if(s[i].value===c)s[i].selected = "selected";}};document.getElementById('proxy-submit').onclick = function(){Cookies.set('proxy',document.getElementById('proxy-opt').value,{ expires: 7 });window.location.reload();};`
    if (readmeFlag) html += `fetch('./README.md').then(response => response.text()).then(data => document.getElementById('readMe').innerHTML =marked(data)).catch(err => document.getElementById('readMe').innerHTML="Oh, error:" + err)`;
    html += `</script><div>Powered by <a href="https://github.com/ukuq/onepoint">OnePoint</a></div></body></html>`;
    return html;
}





