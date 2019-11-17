# OnePoint

一个基于 SCF 和自定义API 的映射网盘

## 特色功能

占用资源少：不占用服务器资源，请求完全由 SCF 处理

成本极低：SCF 免费额度完全够用

打开速度快：数据缓存，打开速度快。

多账户映射：可通过路径映射支持多个网盘

惰性加载: 访问时请求

## 目前实现

目前仅开发了onedrive, 

google drive 的调用函数。

和一个 scf 服务器 文件列出函数。

如果想要使用其他网盘，参考 [这里]( https://www.onesrc.cn/p/onepoint-api-documentation.html)。

## 更新日志

- 191117: 增加文件夹密码功能
- 191113: 修复缓存被清空问题, 修改render, 为多主题做准备
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

[全局配置](https://www.onesrc.cn/p/onepoint-configuration-process.html)

[onedrive](https://www.onesrc.cn/p/onedrive-for-onepoint-configuration.html)

[google drive](https://www.onesrc.cn/p/google-drive-for-onepoint-configuration.html)

## 密码功能

密码分为全局管理员密码, 云盘密码, 目录密码 三种

- 全局管理员密码控制整个系统, 在 config.json/G_CONFIG.admin_password 中设置
- 云盘密码控制单个云盘的访问权限, 在 config.json/DRIVE_MAP.'/*/'.password 中设置
- 目录密码控制当前目录的访问权限, 但是不能阻止该目录下的文件被访问. 在文件夹中添加名称为 .password=123 的文件即可设置.

## Thanks

[oneindex](https://github.com/donwa/oneindex)
[oneindex_scf](https://github.com/qkqpttgf/OneDrive_SCF)

## License

MIT