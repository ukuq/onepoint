const { Msg } = require('../utils/msgutils');
const { cookie } = require('../utils/nodeutils');
let G_CONFIG, DRIVE_MAP, DRIVE_MAP_KEY,oneCache;

exports.func = async (spConfig, cache, event) => {
    let { p0, p1, p2, ph } = event.splitPath;
    G_CONFIG = spConfig['G_CONFIG'];
    DRIVE_MAP = spConfig['DRIVE_MAP'];
    oneCache = spConfig['oneCache'];
    DRIVE_MAP_KEY = Object.keys(DRIVE_MAP).sort((e1, e2) => { return e1 - e2 });
    let res_headers = { 'Content-Type': 'text/html' };
    let isadmin = event['cookie']['ADMINTOKEN'] === G_CONFIG.admin_password_date_hash;
    if (event['method'] === 'POST') {//管理员登录 ,只允许密码
        console.log("admin password:" + event['body']['password']);
        if (event['body']['password'] !== G_CONFIG.admin_password) return Msg.info(401, '管理员密码错误');
        res_headers['set-cookie'] = cookie.serialize('ADMINTOKEN', G_CONFIG.admin_password_date_hash, { path: p0 + '/', maxAge: 3600 });
    } else if (!isadmin) {
        return Msg.info(401, '请输入管理员密码');
    }
    if (p2 === '/cache') {
        return Msg.html(200, JSON.stringify(oneCache), {'Content-Type':'application/json'});
    } else if (p2 === '/event') {
        return Msg.html(200, `<head><script src="https://cdn.bootcss.com/highlight.js/9.15.10/highlight.min.js"></script>
            <link href="//cdn.bootcss.com/highlight.js/9.10.0/styles/xcode.min.css" rel="stylesheet"></head>
            <body style="font-size: 15px;"><pre><code>${JSON.stringify(event, null, 2)}</code></pre><script>hljs.highlightBlock(document.body);</script></body>`, res_headers);
    }else if(p2==='/file'){
        return Msg.html(200, '', res_headers);
    }
    return Msg.html(200, r200_admin(ph + p0), res_headers);
}

function r200_admin(p_h0) {
    let html = `<html><head><meta charset="utf-8"><meta name="viewport"content="width=device-width, initial-scale=1.0,maximum-scale=1.0, user-scalable=no"><title>onePoint系统管理</title>`;
    html += `<link href="https://cdn.bootcss.com/mdui/0.4.3/css/mdui.min.css" rel="stylesheet"><script src="https://cdn.bootcss.com/mdui/0.4.3/js/mdui.min.js"></script></head><body class="mdui-drawer-body-left mdui-appbar-with-toolbar mdui-theme-primary-indigo mdui-theme-accent-blue mdui-loaded"><header class="mdui-appbar mdui-appbar-fixed"><div class="mdui-toolbar mdui-color-theme"><span class="mdui-btn mdui-btn-icon mdui-ripple mdui-ripple-white"mdui-drawer="{target: '#main-drawer', swipe: true}"><i class="mdui-icon material-icons">menu</i></span>`;
    html += `<a href="${p_h0}"target="_blank"class="mdui-typo-headline mdui-hidden-xs">onePoint</a><div class="mdui-toolbar-spacer"></div></div></header><div class="mdui-drawer"id="main-drawer"><div class="mdui-list"><br><br><a href="#g_config"class="mdui-list-item"><i class="mdui-list-item-icon mdui-icon material-icons">settings</i><div class="mdui-list-item-content">基本设置</div></a><a href="#drive_info"class="mdui-list-item"><i class="mdui-list-item-icon mdui-icon material-icons">cloud</i><div class="mdui-list-item-content">网盘信息</div></a><a href="https://console.cloud.tencent.com/scf/index/1"class="mdui-list-item"><i class="mdui-list-item-icon mdui-icon material-icons">computer</i><div class="mdui-list-item-content">SCF</div></a><a href="https://github.com/ukuq/onepoint"class="mdui-list-item"><i class="mdui-list-item-icon mdui-icon material-icons">code</i><div class="mdui-list-item-content">Github</div></a><a href="https://www.onesrc.cn/p/onepoint-api-documentation.html"class="mdui-list-item"><i class="mdui-list-item-icon mdui-icon material-icons">archive</i><div class="mdui-list-item-content">参考文档</div></a><a href="#feed_back"class="mdui-list-item"><i class="mdui-list-item-icon mdui-icon material-icons">feedback</i><div class="mdui-list-item-content">建议反馈</div></a></div></div>`;
    html += `<div class="mdui-container"><div class="mdui-container-fluid"><form action=""method="post"><div id="g_config"><br><br></div><div class="mdui-typo"><h1>基本设置</h1></div><div class="mdui-textfield"><h4>网站名称</h4><input class="mdui-textfield-input"type="text"placeholder="title"name="site_title"value="${G_CONFIG.site_title}"></div><div class="mdui-textfield"><h4>网站关键字</h4><input class="mdui-textfield-input"type="text"placeholder="keywords"name="site_keywords"value="${G_CONFIG.site_keywords}"></div><div class="mdui-textfield"><h4>网站描述</h4><textarea class="mdui-textfield-input"placeholder="Description"name="site_description"value="${G_CONFIG.site_description}"></textarea></div><div class="mdui-textfield"><h4>网站图标</h4><input class="mdui-textfield-input"type="text"placeholder="https://"name="site_icon"value="${G_CONFIG.site_icon}"></div><div class="mdui-textfield"><h4>网站脚本</h4><textarea class="mdui-textfield-input"placeholder="&lt;script&gt;&lt;/script&gt;"name="site_script"value="${G_CONFIG.site_script}"></textarea></div>`;
    html += `<div class=""><h4>网站主题</h4><select name="style"class="mdui-select"mdui-select><option value="render">JUST</option><option value="render">ONLY</option><option value="render"selected="">ONE</option></select></div><div class=""><h4>开启预览</h4><label class="mdui-switch"><input type="checkbox"name="enablePreview"value="${G_CONFIG.enablePreview}"><i class="mdui-switch-icon"></i></label></div><div class="mdui-divider"></div>`;
    html += `<div id="drive_info"><br><br></div><div class="mdui-typo"><h1>网盘信息</h1></div><table class="mdui-table mdui-table-hoverable"><thead><tr><th>路径</th><th>类型</th><th>密码</th><th>hash码</th></tr></thead><tbody>`;
    for (let i = DRIVE_MAP_KEY.length - 1; i >= 0; i--) {
        let key = DRIVE_MAP_KEY[i];
        html += `<tr><td>${key}</td><td>${DRIVE_MAP[key].funcName}</td><td>${DRIVE_MAP[key].password}</td><td><div mdui-tooltip="{content: '点击分享链接, 今天 23:59 失效'}"><a href="${p_h0}${key}?password=${DRIVE_MAP[key].password_date_hash}">${DRIVE_MAP[key].password_date_hash}</a></div></td></tr>`;
    }
    html += `</tbody></table><div id="feed_back"><br><br></div><div class="mdui-typo"><h1>建议反馈</h1></div><div class="mdui-textfield"><a href="https://github.com/ukuq/onepoint/issues"><h3>issues</h3></a></div><div class="mdui-textfield"><a href="mailto:ukuq@qq.com"><h3>email</h3></a></div><div id="nothing"><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br></div></form></div></div></body></html>`;
    return html;
}