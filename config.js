let { MS_OD } = require("./lib/ms_od");
let render = require("./views/render").render;
exports.RENDER = render;
exports.G_CONFIG = {
    enablePreview: true,
    site_title: "onePoint Demo",
    site_icon: "",
    site_keywords: "onePoint",
    site_description: "onePoint description",
    site_script: ""//统计代码之类的可以放这里
};
exports.DRIVE_MAP = {

    "/mmx/": {
        func: MS_OD,//将会调用的函数
        spConfig: {
            shareUrl: 'https://lovelearn-my.sharepoint.com/:f:/g/personal/admin_share_onesrc_cc/Es6CMetI4fJCr4GqWZ3uvA0BEnzJxxb4CU-iQr04VYomLQ?e=C9K35U',
            postRawDir: '/image'//自定义分享文件夹,分享的文件夹名称为 /image
        },//每个函数需要的专用配置文件
    },
    '/': {
        func: MS_OD,//将会调用的函数
        spConfig: {
            shareUrl: 'https://lovelearn-my.sharepoint.com/:f:/g/personal/admin_share_onesrc_cc/EkEBAXfrK01JiBdQUQKm7O0BlHt50NS45RP9WKSCvEY9Sg?e=bkFrDs'
        }
    }
};
exports.DOMAIN_MAP={};