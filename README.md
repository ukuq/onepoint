# OnePoint

一个基于 onedrive google-drive and liunx-vfs 的映射网盘

项目地址: https://github.com/ukuq/onepoint

## 项目特点

轻量: serverless nosql

免费：支持 scf、nowsh 部署

极速：统一的树形缓存管理

多类型：可通过路径映射支持多个网盘

## 目前支持

- onedrive 教育版/企业版/个人版
- onedrive 无全局管理员版
- onedrive google drive

## 部署方式

- scf 腾讯云无服务器云函数
- now.sh now 托管平台
- linux 服务器部署

## 更新日志

https://github.com/ukuq/onepoint/tree/master/docs/log.md

## Demo

github action 自动部署

https://service-0nvsu1bi-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onepoint

https://onepoint.ukuq.now.sh

注: 仅 onedrive_graph 模块支持文件管理!

## 使用方法

修改 config.json 文件里面的 DRIVE_MAP 即可。

小工具: https://ukuq.github.io/onepoint/config.html

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
