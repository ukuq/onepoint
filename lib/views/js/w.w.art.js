const $imports = require('../art-runtime');module.exports={name:"w.w.art"};module.exports.render=function($data){
'use strict'
$data=$data||{}
var $$out='',$escape=$imports.$escape,$V=$data.$V,navs=$data.navs,$each=$imports.$each,$value=$data.$value,$index=$data.$index,response=$data.response,type=$data.type,url=$data.url,oUrl=$data.oUrl
$$out+="<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><meta name=\"github\" content=\"https://github.com/ukuq/onepoint\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,shrink-to-fit=no\"><link rel=\"shortcut icon\" href=\""
$$out+=$escape($V.site.logo)
$$out+="\"><meta name=\"referrer\" content=\"same-origin\"><link href=\"//cdn.staticfile.org/twitter-bootstrap/4.6.0/css/bootstrap.min.css\" rel=\"stylesheet\"><link href=\"//cdn.staticfile.org/github-markdown-css/4.0.0/github-markdown.min.css\" rel=\"stylesheet\"><title>"
$$out+=$escape($V.site.name)
$$out+="</title><style>a:hover{color:red;text-decoration:none}@media (max-width:768px){#op-list tr>td:nth-child(3),#op-list tr>th:nth-child(3){display:none}}@media (max-width:992px){#op-list tr>td:nth-child(2),#op-list tr>th:nth-child(2){display:none}}</style></head><body><nav class=\"navbar sticky-top navbar-dark bg-dark navbar-expand-lg\"><div class=\"container\"><a href=\"#\" class=\"navbar-brand\"><img src=\""
$$out+=$escape($V.site.logo)
$$out+="\" alt=\"logo\" class=\"d-inline-block align-top\" style=\"width:32px\"> "
$$out+=$escape($V.site.name)
$$out+=" </a></div></nav><div class=\"container mt-3\"><nav id=\"navbar-href\" aria-label=\"breadcrumb\"> "
var navs=$V.navs
$$out+=" <ol class=\"breadcrumb\"> "
$each(navs,function($value,$index){
$$out+=" <li class=\"breadcrumb-item\"><a href=\""
$$out+=$escape($value.href)
$$out+="\">"
$$out+=$escape($index===0?'Home':$value.name)
$$out+="</a></li> "
})
$$out+=" </ol></nav> "
if(response.isList){
$$out+=" <div class=\"border rounded mt-3 table-responsive\"><table class=\"table table-hover mb-0\" id=\"op-list\"><thead class=\"thead-light\"><tr><th>Name</th><th style=\"min-width:220px;width:220px\">Time</th><th class=\"text-right\" style=\"min-width:120px;width:120px\">Size</th></tr></thead><tbody> "
if($V.hasPrev){
$$out+=" <tr><td><a href=\""
$$out+=$escape($V.prevHref)
$$out+="\">👆Previous...</a></td><td></td><td></td></tr> "
}else if($V.hasParent){
$$out+=" <tr><td><a href=\"../\">👈..</a></td><td></td><td></td></tr> "
}
$$out+=" "
$each($V.list,function($value,$index){
$$out+=" <tr><td><a href=\""
$$out+=$escape($V.previewHref($value))
$$out+="\" class=\""
$$out+=$escape($value.type===0?'file':'folder')
$$out+="\">"
$$out+=$escape(($value.type===0?'':'📁') + $value.name)
$$out+="</a></td><td>"
$$out+=$escape($value.time)
$$out+="</td><td class=\"text-right\">"
$$out+=$escape($value.size)
$$out+="</td></tr> "
})
$$out+=" "
if($V.hasNext){
$$out+=" <tr><td><a href=\""
$$out+=$escape($V.nextHref)
$$out+="\">👇Next...</a></td><td></td><td></td></tr> "
}
$$out+=" </tbody></table><script>function formatSize(t){if(\"\"===t||\"NaN\"===t)return\"\";t=Number(t);let e=0;for(;t>=1024;)t/=1024,e++;return t.toFixed(2)+[\" B\",\" KB\",\" MB\",\" GB\",\" TB\"][e]}function formatDate(t){let e=new Date(t);return\"Invalid Date\"===e.toString()?\"\":e.getFullYear()+\"-\"+(e.getMonth()<9?\"0\"+(e.getMonth()+1):e.getMonth()+1)+\"-\"+(e.getDate()<10?\"0\"+e.getDate():e.getDate())+\" \"+(e.getHours()<10?\"0\"+e.getHours():e.getHours())+\":\"+(e.getMinutes()<10?\"0\"+e.getMinutes():e.getMinutes())+\":\"+(e.getSeconds()<10?\"0\"+e.getSeconds():e.getSeconds())}document.querySelectorAll(\"#op-list\").forEach(t=>{t.querySelectorAll(\"tr>td:nth-child(2)\").forEach(t=>t.textContent=formatDate(t.textContent)),t.querySelectorAll(\"tr>td:nth-child(3)\").forEach(t=>t.textContent=formatSize(t.textContent))})</script> "
if($V.isEmpty){
$$out+=" <p style=\"text-align:center\" class=\"mt-2\">Empty Folder!</p> "
}
$$out+=" </div> "
}else if(response.isFile){
$$out+=" "
var type=$V.previewType
$$out+=" "
var url=$V.downloadUrl
$$out+=" "
var oUrl=$V.previewHref($V.file,false)
$$out+=" <div class=\"input-group\"><input type=\"url\" class=\"form-control\" id=\"op-share-url\"><div class=\"input-group-append\"><button type=\"button\" class=\"btn btn-outline-secondary\" id=\"op-share-btn\" data-clipboard-target=\"#op-share-url\" data-clipboard-action=\"cut\">复 制</button> <a type=\"button\" class=\"btn btn-outline-secondary\" href=\""
$$out+=$escape(oUrl)
$$out+="\" target=\"_blank\">下 载</a></div></div><div class=\"border rounded my-3 p-3\" id=\"op-file\"> "
if(type === 'image'){
$$out+=" <img src=\""
$$out+=$escape(url)
$$out+="\" class=\"rounded mx-auto d-block img-fluid\" max-width=\"100%\" alt=\"图片加载失败\"> "
}else if(type === 'video'){
$$out+=" <div id=\"op-preview-video\" data-url=\""
$$out+=$escape(url)
$$out+="\"></div><script src=\"//cdn.staticfile.org/dplayer/1.26.0/DPlayer.min.js\"></script><script>dpElement=document.getElementById(\"op-preview-video\"),window.dp=new DPlayer({element:dpElement,video:{url:dpElement.getAttribute(\"data-url\"),pic:\"\",type:\"auto\"}})</script> "
}else if(type === 'audio'){
$$out+=" <audio src=\""
$$out+=$escape(url)
$$out+="\" controls autoplay style=\"width:75%\" class=\"rounded mx-auto d-block\"></audio> "
}else if(type === 'office'){
$$out+=" <ul style=\"margin:0\"><li><a target=\"_blank\" href=\"https://view.officeapps.live.com/op/view.aspx?src="
$$out+=$escape($V.encodeURIComponent(url))
$$out+="\">使用 office apps 预览</a></li><li><a target=\"_blank\" href=\"http://api.idocv.com/view/url?url="
$$out+=$escape($V.encodeURIComponent(url))
$$out+="\">使用 I Doc View 预览</a></li></ul> "
}else if(type==='pdf'){
$$out+=" <div id=\"op-preview-pdf\" data-url=\""
$$out+=$escape(url)
$$out+="\"></div><script src=\"//cdn.staticfile.org/pdfobject/2.2.4/pdfobject.min.js\"></script><script>PDFObject.embed(document.querySelector(\"#op-preview-pdf\").getAttribute(\"data-url\"),\"#op-preview-pdf\")</script> "
}else if(type==='text'){
$$out+=" <pre><code id=\"op-preview-text\" data-url=\""
$$out+=$escape(url)
$$out+="\">loading...</code></pre><link href=\"//cdn.staticfile.org/highlight.js/10.4.1/styles/xcode.min.css\" rel=\"stylesheet\"><script src=\"//cdn.staticfile.org/highlight.js/10.4.1/highlight.min.js\"></script><script>document.querySelectorAll(\"#op-preview-text\").forEach(t=>{fetch(t.getAttribute(\"data-url\")).then(t=>t.ok?t.text():Promise.reject(new Error(\"response error\"))).then(e=>{t.textContent=e,hljs.highlightBlock(t)}).catch(e=>t.textContent=\"Oh, \"+e)})</script> "
}else if(type==='bigText'){
$$out+=" <p style=\"text-align:center\" class=\"mb-0\">该文本文件太大, 不支持预览 :-(</p> "
}else{
$$out+=" <p style=\"text-align:center\" class=\"mb-0\">此格式("
$$out+=$escape($V.file.mime)
$$out+=")不支持预览 :-(</p> "
}
$$out+=" </div><script src=\"https://cdn.staticfile.org/clipboard.js/2.0.8/clipboard.min.js\"></script><script>document.querySelectorAll(\"#op-share-url\").forEach(e=>{e.value=new URL(\"?\",window.location).href.slice(0,-1),new ClipboardJS(\"#op-share-btn\")})</script> "
}else{
$$out+=" "
if($V.hasPassword){
$$out+=" <div class=\"border rounded my-3 pt-3\"><form method=\"post\" class=\"form-inline\"><div class=\"form-group mx-sm-3 mb-2\"><label><input type=\"password\" name=\"password\" class=\"form-control\" placeholder=\""
$$out+=$escape($V.passwordHint)
$$out+="\"></label></div><button type=\"submit\" class=\"btn btn-primary mb-2\">Submit</button></form></div> "
}
$$out+=" <div class=\"border rounded my-3 p-3\"><div>"
$$out+=$escape(response.message)
$$out+="</div><pre><code>"
$$out+=$escape($V.jsonData)
$$out+="</code></pre></div> "
}
$$out+=" <div class=\"card mt-3\"><div class=\"card-header\">README</div><div class=\"card-body markdown-body\" id=\"op-readme\" data-url=\""
$$out+=$escape($V.readmeUrl)
$$out+="\">"
$$out+=$escape($V.readme)
$$out+="</div><script src=\"https://cdn.staticfile.org/marked/2.0.3/marked.min.js\"></script><script>document.getElementById(\"op-readme\").innerHTML=marked(document.getElementById(\"op-readme\").textContent)</script> "
if($V.readmeUrl){
$$out+=" <script>document.querySelectorAll(\"#op-readme\").forEach(e=>fetch(e.getAttribute(\"data-url\")).then(e=>e.ok?e.text():Promise.reject(new Error(\"response error\"))).then(r=>e.innerHTML=marked(r)).catch(r=>e.innerHTML=\"Oh, \"+r))</script> "
}
$$out+=" </div><div class=\"text-right py-3 pl-3\"><a class=\"text-muted\" target=\"_blank\" href=\"https://github.com/ukuq/onepoint\">Just One Point.</a> <a class=\"text-muted ml-2\" href=\""
$$out+=$escape($V.refreshHref)
$$out+="\">Cache "
$$out+=$escape($V.cacheTime?'Hit':'Miss')
$$out+=".</a></div> "
$$out+=$V.site.html
$$out+=" </div></body></html>"
return $$out
}