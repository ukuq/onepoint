# OnePoint

一个基于 SCF 和 SharePoint 的映射网盘 (onedrive)

## 特色功能

资源少：不占用服务器资源，请求完全由 SCF 处理

速度快：数据缓存，打开速度快。

通用性：几乎适用于一切 onedrive

界面清：可自定义前端

多账户：可通过路径映射支持多个账户

## Demo

主账户

https://service-8pduizwk-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onePoint

挂载点1：

https://service-8pduizwk-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onePoint/mmx

## 使用方法

[OnePoint 的配置](https://www.onesrc.cn/p/onepoint-configuration-process.html)

## 基本原理

SharePoint分享获得链接，利用该链接获取临时cookie，此cookie在有效期内可访问SharePoint的API 获取文件列表信息，再用html修饰整理后返回给用户。

## 有待实现

前端排序

FastClick

instantclick

## Thanks

[ UI 参考 : oneindex ](https://github.com/donwa/oneindex)

## License

LGPLv3.0