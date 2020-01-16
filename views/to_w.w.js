const { formatSize, urlSpCharEncode } = require('../utils/msgutils');
const { mime } = require('../utils/nodeutils');
exports.render = render;

//暂时不处理特殊字符
function render(responseMsg, event, G_CONFIG) {
    let splitPath = event.splitPath;
    let p_h0 = splitPath.p_h0;
    let p_12 = splitPath.p_12;
    let data = responseMsg.data;
    let readmeFlag = false;
    let html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.4.1/dist/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
<link rel="shortcut icon" href="https://ukuq.github.io/onepoint/favicon.png"><title>${G_CONFIG.site_title}</title></head><body style="background-color: #f7f7f7"><div class="container"><h1 class="text-center pt-3">${G_CONFIG.site_name}</h1>`;

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

    //代理
    html += `<div class="input-group"><select class="custom-select" id="proxy-opt" aria-label="Example select with button addon"><option value="">No Proxy (default)</option>`;
    G_CONFIG.proxy.forEach((e) => {
        html += `<option value="${e}">${e}</option>`;
    });
    html += `</select><div class="input-group-append"><button class="btn btn-outline-secondary" id="proxy-submit" type="button">Start Proxy</button></div></div>`;

    switch (responseMsg.type) {
        case 0://file
            let fileInfo = data.fileInfo;
            let downloadUrl = data.downloadUrl;
            if (event.cookie.proxy) downloadUrl = event.cookie.proxy + '?url=' + encodeURIComponent(downloadUrl);
            let type = fileInfo['mime'].slice(0, fileInfo['mime'].indexOf('/'));
            //html += `<div><a href="${downloadUrl}" id="download-btn"  style="margin: 5px;">下载</a><a href="javascript:void" id="share-btn" style="margin: 5px;">分享</a><a href="javascript:void" id="quote-btn" style="margin: 5px;">md引用</a></div><hr style="width: 500; margin-left: 0;">`;
            html += `<div class="border rounded my-3 p-3">`;
            if (type === 'image') {
                html += `<img src="${downloadUrl}" class="rounded mx-auto d-block">`;
            } else if (type === 'video') {
                html += `<link class="dplayer-css" rel="stylesheet" href="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.css">
                <script src="//cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.js"></script>
                <div class="border rounded" id="dplayer"></div>
                <script>const dp = new DPlayer({container: document.getElementById('dplayer'),lang:'zh-cn',video: {url: '${downloadUrl}',pic: '',type: 'auto'}});</script>`;
            } else if (type === 'audio') {
                html += `<audio src="${downloadUrl}" controls autoplay style="width: 75%;" class="rounded mx-auto d-block"></audio>`;
            } else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'mpp', 'rtf', 'vsd', 'vsdx'].includes(mime.getExtension(fileInfo['mime']))) {
                html += `<iframe src="https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(downloadUrl)}" class="border rounded" style="height: 1700px;width: 100%;">This browser does not support iframe</iframe>`;
            } else if (fileInfo['mime'].endsWith('pdf')) {
                html += `<div id="pdf-preview"></div><script src="https://cdn.bootcss.com/pdfobject/2.1.1/pdfobject.min.js"></script><script>PDFObject.embed("${downloadUrl}", "#pdf-preview");</script><style>.pdfobject{height:1600px!important;}</style>`;
            } else if (type === 'text' || (fileInfo['size'] < 1024)) {
                html += `<div id="code-preview">loading...</div>`;
                html += `<script src="https://cdn.bootcss.com/highlight.js/9.15.10/highlight.min.js"></script><script>fetch('${downloadUrl}').then(response => response.text()).then(data => {document.getElementById('code-preview').innerHTML ='<pre><code>'+marked(data)+'</code></pre>';hljs.highlightBlock(document.getElementById('code-preview'));}).catch(err => document.getElementById('code-preview').innerHTML="Oh, error:" + err);</script>`;
            } else {
                html += `<div>此格式不支持预览 :-(</div>`;
            }
            html += `</div>`//<script>document.querySelector('#share-btn').addEventListener('click',(event)=>{copyTextContent(null,window.location.href.slice(0,window.location.href.indexOf('?')));let target=event.target;let tt=target.textContent;target.innerHTML='已复制';setTimeout(()=>target.innerHTML=tt,250)});document.querySelector('#quote-btn').addEventListener('click',(event)=>{copyTextContent(null,'![]('+window.location.href.slice(0,window.location.href.indexOf('?'))+')');let target=event.target;let tt=target.textContent;target.innerHTML='已复制';setTimeout(()=>target.innerHTML=tt,250)});function copyTextContent(source,text){let result=false;let target=document.createElement('pre');target.style.opacity='0';target.textContent=text||source.textContent;document.body.appendChild(target);try{let range=document.createRange();range.selectNode(target);window.getSelection().removeAllRanges();window.getSelection().addRange(range);document.execCommand('copy');window.getSelection().removeAllRanges();result=true}catch(e){}document.body.removeChild(target);return result}</script>`;
            break;
        case 1://list
            html += `<div class="border rounded my-3 table-responsive"><table class="table table-hover mb-0"><thead><tr><th scope="col">Name</th><th scope="col">Time</th><th scope="col">Size</th><th scope="col">Option</th></tr></thead><tbody>`;
            if (data.prevHref) {
                html += `<tr><td><a href="${data.prevHref}">Previous...</a></td><td></td><td></td><td>-</td></tr>`;
            } else if (splitPath.p_12 !== '/') {
                html += `<tr><td><a href="../">..</a></td><td></td><td></td><td>-</td></tr>`;
            }
            data.content.forEach(e => {
                if (e.type === 1 || e.type === 3) {//文件夹 
                    html += `<tr><td><a href="${splitPath.p_h012}${e.name}/">${e.name}/</a></td><td>${e.time}</td><td>${formatSize(e.size)}</td><td>-</td></tr>`;
                } else if (e.type === 0) {//文件
                    if (e.name === 'README.md') { readmeFlag = true };
                    html += `<tr><td><a href="${splitPath.p_h012}${e.name}?preview">${e.name}</a></td><td>${e.time}</td><td>${formatSize(e.size)}</td><td><a href="${splitPath.p_h012}${e.name}">下载</a></td></tr>`;
                }
            });
            if (data.nextHref) html += `<tr><td><a href="${data.nextHref}">Next...</a></td><td></td><td></td><td>-</td></tr>`;
            html += `</tbody></table></div>`;
            break;
        case 2://info
            if (responseMsg.statusCode === 401) {
                html += `<div class="border rounded my-3 pt-3"><form method="post" class="form-inline"><div class="form-group mx-sm-3 mb-2"><input type="password" name="password" class="form-control" placeholder="${data.info}"></div><button type="submit" class="btn btn-primary mb-2">Submit</button></form></div>`
            } else {
                html += `<div class="border rounded my-3 p-3"><span>${data.info}</span></div>`
            }
            break;
        default:
            throw new Error("no such response type");
    }
    //readme
    html += `<div class="card"><div class="card-header">README.md</div><div class="card-body markdown-body" id="readMe">Nothing here!</div></div>`;

    //footer
    html += `<div class="text-right"><p class="text-muted mb-0">Powered by <a href="https://github.com/ukuq/onepoint">OnePoint</a></p><p class="text-muted mb-0">Processing time: <a href="javascript:void">${new Date() - event.start_time}ms</a></p></div>`;

    html += `</div><script src="https://cdn.jsdelivr.net/npm/js-cookie@beta/dist/js.cookie.min.js"></script><script src="https://cdn.bootcss.com/marked/0.7.0/marked.js"></script>
    ${G_CONFIG.site_script}${event.script}<script>if(Cookies.get('proxy')){let s = document.getElementById('proxy-opt').options;let c = Cookies.get('proxy');for(let i=0;i< s.length;i++){if(s[i].value===c)s[i].selected = "selected";}};document.getElementById('proxy-submit').onclick = function(){Cookies.set('proxy',document.getElementById('proxy-opt').value,{ expires: 7 });window.location.reload();};`
    if (readmeFlag) html += `fetch('./README.md').then(response => response.text()).then(data => document.getElementById('readMe').innerHTML =marked(data)).catch(err => document.getElementById('readMe').innerHTML="Oh, error:" + err)`;
    html += `</script></body></html>`;
    return html;
}