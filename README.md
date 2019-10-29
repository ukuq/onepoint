# OnePoint

一个基于 SCF 和自定义API 的映射网盘

## 特色功能

占用资源少：不占用服务器资源，请求完全由 SCF 处理

成本极低：SCF 免费额度完全够用

打开速度快：数据缓存，打开速度快。

强调通用性：只要遵循规定的接口，几乎适用于一切网盘

界面独特：可自定义前端，自己写界面

多账户映射：可通过路径映射支持多个网盘

## 目前实现

目前仅开发了onedrive 的调用函数。

和一个 scf 服务器 文件列出函数。

如果想要使用其他网盘，参考文档：

 https://www.onesrc.cn/p/onepoint-api-documentation.html

## Demo

主账户

https://service-8pduizwk-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onePoint

挂载点1：

https://service-8pduizwk-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onePoint/mmx

## 使用方法

修改 config.js 文件里面的 DRIVE_MAP 即可。

部署参考: [OnePoint 的配置](https://www.onesrc.cn/p/onepoint-configuration-process.html)

## Thanks

[oneindex](https://github.com/donwa/oneindex)
[oneindex_scf](https://github.com/qkqpttgf/OneDrive_SCF)

## License

MIT