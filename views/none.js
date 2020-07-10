exports.render = (responseMsg, event, G_CONFIG) => {
    let splitPath = event.splitPath;
    let p_h0 = splitPath.ph + splitPath.p0;
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><link rel="shortcut icon" href="${G_CONFIG.site_icon}"><title>${G_CONFIG.site_title}</title></head><body>请访问<a href="${p_h0}/admin/">admin目录</a>获取数据</body></html>`;
};