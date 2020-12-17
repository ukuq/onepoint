const { formatSize, urlSpCharEncode } = require('../utils/msgutils');
exports.render = render;
//@info proxy部分提至main.js,自动根据cookie觉得是否代理.
//考虑到文件名或路径中包含% ? # 等 字符是小概率事件, 故将 urlSpCharEncode 的调用移到前端完成
//为提高渲染速度,同样将formatSize formatDate 移动到前端
function render(responseMsg, event, G_CONFIG) {
    let splitPath = event.splitPath;
    let p_h0 = splitPath.ph + splitPath.p0;
    let p_12 = splitPath.p_12;
    let p_h012 = p_h0 + p_12;
    let data = responseMsg.data;
    let readmeFlag = false;
    let html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link href="https://cdn.bootcss.com/twitter-bootstrap/4.3.1/css/bootstrap.min.css" rel="stylesheet">
    <link rel="shortcut icon" href="${G_CONFIG.site_icon}"><title>${G_CONFIG.site_title}</title><style>a#down-btn-a {color: #6c757d;}a:hover,a#down-btn-a:hover{color:red;text-decoration: none;}</style>
    </head><body><nav class="navbar sticky-top navbar-dark bg-dark navbar-expand-lg"><div class="container"><a target="_self" href="https://github.com/ukuq/onepoint" class="navbar-brand"><img src="${G_CONFIG.site_icon}" alt="logo" class="d-inline-block align-top" style="width: 30px;">${G_CONFIG.site_name}</a></div></nav><div class="container mt-3">`;

    //导航栏
    html += `<nav id="navbar-href" aria-label="breadcrumb"><ol class="breadcrumb">`;
    let tmpIncPath = p_h0 + '/';
    html += `<li class="breadcrumb-item"><a href="${tmpIncPath}">Home</a></li>`;
    p_12.split('/').forEach((e, i, t) => {
        if (e) {
            tmpIncPath += e;
            tmpIncPath += '/';
            if (i !== t.length - 1) html += `<li class="breadcrumb-item"><a href="${tmpIncPath}">${e}</a></li>`;
            else html += `<li class="breadcrumb-item active" aria-current="page">${e}</li>`;
        }
    });
    html += `</ol></nav>`;

    switch (responseMsg.type) {
        case 0://file
            //代理
            html += `<div class="input-group"><select class="custom-select" id="proxy-opt"><option value="">No Proxy (default)</option>`;
            G_CONFIG.proxy.forEach((e) => {
                html += `<option value="${e}">${e}</option>`;
            });

            let file = data.file;
            let url = data.url;
            let type = file['mime'].slice(0, file['mime'].indexOf('/'));
            html += `</select><div class="input-group-append"><button class="btn btn-outline-secondary" id="proxy-submit" type="button">Proxy</button><button type="button" class="btn btn-outline-secondary"><a href="${url}" id="down-btn-a">Down</a></button><button type="button" class="btn btn-outline-secondary" id="share-btn">Share</button></div></div>`;
            html += `<div class="border rounded my-3 p-3">`;
            if (type === 'image') {
                html += `<img src="${url}" class="rounded mx-auto d-block" max-width="100%">`;
            } else if (type === 'video') {
                html += `<link class="dplayer-css" rel="stylesheet" href="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.css">
                <script src="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.js"></script>
                <div id="dplayer"></div>
                <script>const dp = new DPlayer({container: document.getElementById('dplayer'),lang:'zh-cn',video: {url: '${url}',pic: '',type: 'auto'}});</script>`;
            } else if (type === 'audio') {
                html += `<audio src="${url}" controls autoplay style="width: 75%;" class="rounded mx-auto d-block"></audio>`;
            } else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'mpp', 'rtf', 'vsd', 'vsdx'].includes(file.name.slice(file.name.lastIndexOf('.') + 1))) {
                html += `<ul><li><a href="https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}">使用 office apps 预览</a></li>`;
                html += `<li><a href="http://api.idocv.com/view/url?url=${encodeURIComponent(url)}">使用 I Doc View 预览</a></li></ul>`;
            } else if (file['mime'].endsWith('pdf')) {
                html += `<div id="pdf-preview"></div><script src="https://cdn.bootcss.com/pdfobject/2.1.1/pdfobject.min.js"></script><script>PDFObject.embed("${url}", "#pdf-preview");</script><style>.pdfobject{height:1600px!important;}</style>`;
            } else if (type === 'text' || (file['size'] < 1024)) {
                html += `<div class="border"><pre><code id="code-preview">loading...</code></pre></div>`;
                html += `<script src="https://cdn.bootcss.com/highlight.js/9.15.10/highlight.min.js"></script><script>
                
                fetch('${url}').then(response => { if (response.ok) { return response.text() } else throw new Error('response error'); }).then(data => { document.getElementById('code-preview').textContent = data; hljs.highlightBlock(document.getElementById('code-preview')); }).catch(err => document.getElementById('code-preview').innerHTML = "Oh, " + err);

                </script>`;
            } else {
                html += `<div>此格式不支持预览 :-(</div>`;
            }
            html += `</div><script src="https://cdn.bootcss.com/js-cookie/2.2.1/js.cookie.min.js"></script><script>if(Cookies.get('proxy')){let s = document.getElementById('proxy-opt').options;let c = Cookies.get('proxy');for(let i=0;i< s.length;i++){if(s[i].value===c)s[i].selected = "selected";}};document.getElementById('proxy-submit').onclick = function(){Cookies.set('proxy',document.getElementById('proxy-opt').value,{ expires: 7 });window.location.reload();};document.querySelector('#share-btn').addEventListener('click',(event)=>{copyTextContent(null,window.location.href.slice(0,window.location.href.indexOf('?')));let target=event.target;let tt=target.textContent;target.innerHTML='已复制';setTimeout(()=>target.innerHTML=tt,500)});function copyTextContent(source,text){let result=false;let target=document.createElement('pre');target.style.opacity='0';target.textContent=text||source.textContent;document.body.appendChild(target);try{let range=document.createRange();range.selectNode(target);window.getSelection().removeAllRanges();window.getSelection().addRange(range);document.execCommand('copy');window.getSelection().removeAllRanges();result=true}catch(e){}document.body.removeChild(target);return result}</script>`;
            break;
        case 1://list
            html += `<style>@media (max-width: 768px) {thead>tr>th:nth-child(2),tbody>tr>td:nth-child(2),thead>tr>th:nth-child(3),tbody>tr>td:nth-child(3) {display: none;}}</style><div class="border rounded mt-3 table-responsive"><table class="table table-hover mb-0"><thead class="thead-light"><tr><th scope="col">Name</th><th scope="col" style="width: 220px;">Time</th><th scope="col" class="text-right" style="width: 120px;">Size</th></tr></thead><tbody>`;
            if (data.prev) {
                html += `<tr><td><a href="${data.prev}">Previous...</a></td><td></td><td></td></tr>`;
            } else if (p_12 !== '/') {
                html += `<tr><td><a href="../">..</a></td><td></td><td></td></tr>`;
            }
            data.list.forEach(e => {
                if (e.type === 1 || e.type === 3) {//文件夹 
                    html += `<tr><td><a href="${p_h012 + e.name}/">${e.name}/</a></td><td>${e.time}</td><td class="text-right">${e.size}</td></tr>`;
                } else if (e.type === 0) {//文件
                    if (e.name === 'README.md') { readmeFlag = true };
                    html += `<tr><td><a href="${p_h012 + e.name}?preview" class="file">${e.name}</a></td><td>${e.time}</td><td class="text-right">${e.size}</td></tr>`;
                }
            });
            if (data.next) html += `<tr><td><a href="${data.next}">Next...</a></td><td></td><td></td></tr>`;
            html += `</tbody></table></div>`;
            break;
        case 2://info
            if (responseMsg.statusCode === 401) {
                let pass = data.info.split(':');
                html += `<div class="border rounded my-3 pt-3"><form method="post" class="form-inline"><div class="form-group mx-sm-3 mb-2"><input type="password" name="${pass[0]}" class="form-control" placeholder="${pass[1]}"></div><button type="submit" class="btn btn-primary mb-2">Submit</button></form></div>`
            } else {
                html += `<div class="border rounded my-3 p-3"><span>${data.info}</span></div>`
            }
            break;
        default:
            throw new Error("no such response type");
    }
    //readme
    html += `<div class="card mt-3"><div class="card-header">README.md</div><div class="card-body markdown-body" id="readMe">${event.readme}</div></div>`;
    //限制一下, 仅对2xx 401 显示
    if (G_CONFIG['x-valine-enabled'] && responseMsg.statusCode <= 401) {
        html += `<script src='//unpkg.zhimg.com/valine/dist/Valine.min.js'></script><div id="vcomments" class="mt-3"></div><script>new Valine({el: '#vcomments',appId: '${G_CONFIG['x-valine-appId']}',appKey: '${G_CONFIG['x-valine-appKey']}',notify:false,verify:false,avatar:'mp',placeholder: 'just go go'})</script><style>#vcomments .vpower.txt-right{display:none;}</style>`
    }
    //footer
    html += `<div class="text-right"><span class="text-muted">Powered by <a href="https://github.com/ukuq/onepoint">OnePoint</a></span><span class="text-muted ml-2">Processing time: <a href="javascript:void">${new Date() - event.start_time}ms${responseMsg.isCache ? '(hit)' : ''}</a></span></div>`;
    html += `</div><script src="https://cdn.bootcss.com/marked/0.7.0/marked.js"></script>${G_CONFIG.site_script}`;
    if (readmeFlag) html += `<script>fetch('./README.md').then(response => { if (response.ok) { return response.text() } else throw new Error('response error'); }).then(data => document.getElementById('readMe').innerHTML =marked(data)).catch(err => document.getElementById('readMe').innerHTML = "Oh, " + err);</script>`;
    else html += `<script>if(${!event.readme})document.getElementById('readMe').parentNode.style.display="none";else document.getElementById('readMe').innerHTML = marked(document.getElementById('readMe').textContent);</script>`
    html += `<script>
    function urlSpCharEncode(s) {return !s ? s : s.replace(/%/g, '%25').replace(/#/g, '%23');}
    function formatSize(size) {if (size === "" || size ==="NaN") return "";size=Number(size); let count = 0;while (size >= 1024) {size /= 1024;count++;}size = size.toFixed(2);size += [' B', ' KB', ' MB', ' GB', ' TB'][count];return size;}
    function formatDate(str) {let oDate = new Date(str);if ('Invalid Date' == oDate) return "";let oYear = oDate.getFullYear(),oMonth = oDate.getMonth() < 9 ? "0" + (oDate.getMonth() + 1) : (oDate.getMonth() + 1),oDay = oDate.getDate() < 10 ? "0" + oDate.getDate() : oDate.getDate(),oHour = oDate.getHours() < 10 ? "0" + oDate.getHours() : oDate.getHours(),oMinute = oDate.getMinutes() < 10 ? "0" + oDate.getMinutes() : oDate.getMinutes(),oSecond = oDate.getSeconds() < 10 ? "0" + oDate.getSeconds() : oDate.getSeconds(),oTime = oYear + '-' + oMonth + '-' + oDay + " " + oHour + ":" + oMinute + ":" + oSecond;return oTime;}
    (function(){
        document.getElementById('navbar-href').querySelectorAll('a').forEach(e=>{e.href=urlSpCharEncode(e.getAttribute('href'))});
        document.querySelectorAll('tbody>tr>td:nth-child(1)>a:not(.file)').forEach(e=>{e.href=urlSpCharEncode(e.getAttribute('href'))});
        document.querySelectorAll('tbody>tr>td:nth-child(1)>a.file').forEach(e=>{e.href=urlSpCharEncode(e.getAttribute('href').slice(0,-8))+'?preview'});
        document.querySelectorAll('tbody>tr>td:nth-child(2)').forEach(e=>{e.textContent=formatDate(e.textContent)});
        document.querySelectorAll('tbody>tr>td:nth-child(3)').forEach(e=>{e.textContent=formatSize(e.textContent)});
    })();
    </script>`
    html += `</body></html>`;
    return html;
}