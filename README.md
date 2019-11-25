# OnePoint

一个基于 SCF 和自定义API 的映射网盘

项目地址: https://github.com/ukuq/onepoint

## 特色功能

函数计算：不占用服务器资源，请求完全由 SCF 处理

免费部署：SCF 免费额度完全够用

页面秒开：数据缓存，打开速度快。

多账户映射：可通过路径映射支持多个网盘

惰性加载: 访问时请求

## 目前实现

- onedrive 教育版/企业版/个人版
- onedrive 无全局管理员版
- onedrive google drive

## 更新日志

https://github.com/ukuq/onepoint/tree/master/docs/log.md

## Demo

主账户

https://service-8pduizwk-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onePoint

挂载点1：

https://service-8pduizwk-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onePoint/mmx

## 使用方法

修改 config.json 文件里面的 DRIVE_MAP 即可。

## 反馈交流

- [Github](https://github.com/ukuq/onepoint/issues)
- [腾讯吐个槽](https://support.qq.com/products/102471)

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