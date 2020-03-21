# 更新说明

支持前后端分离

# OnePoint

一个轻量级的、适应多种平台的、适应多种网盘的在线文件目录及文件管理工具。

项目地址: https://github.com/ukuq/onepoint

## 项目特点
  
- 模块分离，适应性强
- 可部署于多种平台
- 支持于多种网盘
- 支持多个同类型网盘挂载
- 支持文件目录
- 部分支持文件管理
- 支持前后端分离
- 内存缓存、惰性加载
- 内置代理下载功能
- 支持视频、音频、文本等多种格式预览
- 支持 readme 和全局公告

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

## 开放文档

建设中...

## Thanks

[oneindex](https://github.com/donwa/oneindex)
[oneindex_scf](https://github.com/qkqpttgf/OneDrive_SCF)

## License

MIT
