const $imports = require('../art-runtime');module.exports={name:"simple.art"};module.exports.render=function($data){
'use strict'
$data=$data||{}
var $$out='',$escape=$imports.$escape,$V=$data.$V,navs=$data.navs,$each=$imports.$each,$value=$data.$value,$index=$data.$index,response=$data.response
$$out+="<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><link rel=\"shortcut icon\" href=\""
$$out+=$escape($V.site.logo)
$$out+="\"><title>"
$$out+=$escape($V.site.name)
$$out+="</title></head><body><div class=\"content\"><div> "
var navs=$V.navs
$$out+=" "
$each(navs,function($value,$index){
$$out+=" "
if($index===0){
$$out+=" <span><a href=\""
$$out+=$value.href
$$out+="\">Home</a></span> "
}else{
$$out+=" <span>/</span> <span><a href=\""
$$out+=$value.href
$$out+="\">"
$$out+=$escape($value.name)
$$out+="</a></span> "
}
$$out+=" "
})
$$out+=" </div> "
if(response.isList){
$$out+=" "
$each($V.list,function($value,$index){
$$out+=" <div><a href=\""
$$out+=$V.previewHref($value,false)
$$out+="\">"
$$out+=$escape($value.name)
$$out+="</a></div> "
})
$$out+=" "
if($V.hasNext){
$$out+=" <div><a href=\""
$$out+=$V.nextHref
$$out+="\">Next...</a></div> "
}
$$out+=" "
}else{
$$out+=" <div><pre><code>"
$$out+=$escape($V.jsonData)
$$out+="</code></pre></div> "
}
$$out+=" </div></body></html>"
return $$out
}