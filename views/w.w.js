const { formatSize, urlSpCharEncode } = require('../utils/msgutils');
const { getmime } = require('../utils/nodeutils');
exports.render = render;
//@info proxy部分提至main.js,自动根据cookie觉得是否代理.
function render(responseMsg, event, G_CONFIG) {
    let splitPath = event.splitPath;
    let p_h0 = urlSpCharEncode(splitPath.ph + splitPath.p0);
    let p_12 = urlSpCharEncode(splitPath.p_12);
    let p_h012 = p_h0 + p_12;
    let data = responseMsg.data;
    let readmeFlag = false;
    let html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link href="https://cdn.bootcss.com/twitter-bootstrap/4.3.1/css/bootstrap.min.css" rel="stylesheet">
    <link rel="shortcut icon" href="${G_CONFIG.site_icon}"><title>${G_CONFIG.site_title}</title></head><body><nav class="navbar sticky-top navbar-dark bg-dark navbar-expand-lg"><div class="container"><a target="_self" href="https://github.com/ukuq/onepoint" class="navbar-brand"><img src="${G_CONFIG.site_icon}" alt="logo" class="d-inline-block align-top" style="width: 30px;">${G_CONFIG.site_name}</a></div></nav><div class="container mt-3">`;

    //导航栏
    html += `<nav class="" aria-label="breadcrumb"><ol class="breadcrumb">`;
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
            html += `</select><div class="input-group-append"><button class="btn btn-outline-secondary" id="proxy-submit" type="button">Proxy</button><a type="button" class="btn btn-outline-secondary" href="${url}">Download</a><button type="button" class="btn btn-outline-secondary" id="share-btn">Share</button></div></div>`;
            html += `<div class="border rounded my-3 p-3">`;
            if (type === 'image') {
                html += `<img src="${url}" class="rounded mx-auto d-block">`;
            } else if (type === 'video') {
                html += `<link class="dplayer-css" rel="stylesheet" href="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.css">
                <script src="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.js"></script>
                <div class="border rounded" id="dplayer"></div>
                <script>const dp = new DPlayer({container: document.getElementById('dplayer'),lang:'zh-cn',video: {url: '${url}',pic: '',type: 'auto'}});</script>`;
            } else if (type === 'audio') {
                html += `<audio src="${url}" controls autoplay style="width: 75%;" class="rounded mx-auto d-block"></audio>`;
            } else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'mpp', 'rtf', 'vsd', 'vsdx'].includes(getmime(file['mime']))) {
                html += `<iframe src="https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}" class="border rounded" style="height: 1700px;width: 100%;">This browser does not support iframe</iframe>`;
            } else if (file['mime'].endsWith('pdf')) {
                html += `<div id="pdf-preview"></div><script src="https://cdn.bootcss.com/pdfobject/2.1.1/pdfobject.min.js"></script><script>PDFObject.embed("${url}", "#pdf-preview");</script><style>.pdfobject{height:1600px!important;}</style>`;
            } else if (type === 'text' || (file['size'] < 1024)) {
                html += `<div id="code-preview">loading...</div>`;
                html += `<script src="https://cdn.bootcss.com/highlight.js/9.15.10/highlight.min.js"></script><script>fetch('${url}').then(response => response.text()).then(data => {document.getElementById('code-preview').innerHTML ='<pre><code>'+marked(data)+'</code></pre>';hljs.highlightBlock(document.getElementById('code-preview'));}).catch(err => document.getElementById('code-preview').innerHTML="Oh, error:" + err);</script>`;
            } else {
                html += `<div>此格式不支持预览 :-(</div>`;
            }
            html += `</div><script src="https://cdn.bootcss.com/js-cookie/2.2.1/js.cookie.min.js"></script><script>if(Cookies.get('proxy')){let s = document.getElementById('proxy-opt').options;let c = Cookies.get('proxy');for(let i=0;i< s.length;i++){if(s[i].value===c)s[i].selected = "selected";}};document.getElementById('proxy-submit').onclick = function(){Cookies.set('proxy',document.getElementById('proxy-opt').value,{ expires: 7 });window.location.reload();};document.querySelector('#share-btn').addEventListener('click',(event)=>{copyTextContent(null,window.location.href.slice(0,window.location.href.indexOf('?')));let target=event.target;let tt=target.textContent;target.innerHTML='已复制';setTimeout(()=>target.innerHTML=tt,500)});function copyTextContent(source,text){let result=false;let target=document.createElement('pre');target.style.opacity='0';target.textContent=text||source.textContent;document.body.appendChild(target);try{let range=document.createRange();range.selectNode(target);window.getSelection().removeAllRanges();window.getSelection().addRange(range);document.execCommand('copy');window.getSelection().removeAllRanges();result=true}catch(e){}document.body.removeChild(target);return result}</script>`;
            break;
        case 1://list
            html += `<div class="border rounded mt-3 table-responsive"><table class="table table-hover mb-0"><thead class="thead-light"><tr><th scope="col" style="width: 60%;">Name</th><th scope="col">Time</th><th scope="col" class="text-right">Size</th></tr></thead><tbody>`;
            if (data.prev) {
                html += `<tr><td><a href="${data.prev}">Previous...</a></td><td></td><td></td></tr>`;
            } else if (p_12 !== '/') {
                html += `<tr><td><a href="../">..</a></td><td></td><td></td></tr>`;
            }
            data.list.forEach(e => {
                if (e.type === 1 || e.type === 3) {//文件夹 
                    html += `<tr><td><a href="${p_h012}${urlSpCharEncode(e.name)}/">${e.name}/</a></td><td>${e.time}</td><td class="text-right">${formatSize(e.size)}</td></tr>`;
                } else if (e.type === 0) {//文件
                    if (e.name === 'README.md') { readmeFlag = true };
                    html += `<tr><td><a href="${p_h012}${urlSpCharEncode(e.name)}?preview">${e.name}</a></td><td>${e.time}</td><td class="text-right">${formatSize(e.size)}</td></tr>`;
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
    html += `<div class="card mt-3"><div class="card-header">README.md</div><div class="card-body markdown-body" id="readMe">${G_CONFIG.site_readme}</div></div>`;

    //footer
    html += `<div class="text-right"><span class="text-muted">Powered by <a href="https://github.com/ukuq/onepoint">OnePoint</a></span><span class="text-muted ml-2">Processing time: <a href="javascript:void">${new Date() - event.start_time}ms</a></span></div>`;
    html += `</div><script src="https://cdn.bootcss.com/marked/0.7.0/marked.js"></script>${G_CONFIG.site_script}`;
    if (readmeFlag) html += `<script src="https://cdn.bootcss.com/axios/0.19.0/axios.min.js"></script><script>axios.get('./README.md').then(data => document.getElementById('readMe').innerHTML =marked(data)).catch(err => document.getElementById('readMe').innerHTML="Oh, error:" + err);</script>`;
    else html+=`<script>document.getElementById('readMe').innerHTML =marked(document.getElementById('readMe').textContent)</script>`
    html += `</body></html>`;
    return html;
}