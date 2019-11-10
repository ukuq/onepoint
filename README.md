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

目前仅开发了onedrive, 

google drive 的调用函数。

和一个 scf 服务器 文件列出函数。

如果想要使用其他网盘，参考 [这里]( https://www.onesrc.cn/p/onepoint-api-documentation.html)。

## 更新日志

- 191110: 新增onedrive graph api 和 图床功能, 新增 Msg_html 功能
- 191105: 新增密码功能, 调整了配置文件
- 191031: 修复了文件名含有空格的无法访问的 bug。增加了 linux_scf 和 google drive 两个模块。
- 191029: 调整架构, 分离数据和界面, 支持多种 api
- ...
- 191005: 首次发布, 支持文件列表, 直链下载


## Demo

主账户

https://service-8pduizwk-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onePoint

挂载点1：

https://service-8pduizwk-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onePoint/mmx

## 使用方法

修改 config.json 文件里面的 DRIVE_MAP 即可。

[onedrive 之 graph 版本配置]() 暂无,可参考内置demo示例

[onedrive 之 sharepoint 版本配置](https://www.onesrc.cn/p/onepoint-configuration-process.html)

[google drive 之  goindex 版本配置](https://www.onesrc.cn/p/google-drive-for-one-point-configuration.html)

## Thanks

[oneindex](https://github.com/donwa/oneindex)
[oneindex_scf](https://github.com/qkqpttgf/OneDrive_SCF)

## License

MIT