# OnePoint

一个轻量级、适应多种平台、适应多种网盘的在线文件目录及文件管理工具。

## 项目地址

https://github.com/ukuq/onepoint

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

## 支持云盘

- onedrive 教育版/企业版/个人版
- onedrive 无全局管理员版
- onedrive google drive

## 部署方式

- scf 腾讯云云函数
- now.sh now 托管平台
- linux 服务器部署

## 快速部署

`npm install -g onepoint`

`onepoint`

## Demo

以下链接由 github action 自动部署

https://service-0nvsu1bi-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onepoint

https://onepoint.ukuq.now.sh

## 配置与安装

个人建议，先使用默认的配置安装一遍，如果没有问题，修改 config.json 后再次安装。

### 相关文档

文档地址：https://ukuq.github.io/onepoint/

配置工具: https://ukuq.github.io/onepoint/config.html

参考手册：https://www.onesrc.cn/p/details-of-onepoint-configjson-configuration.html

## Thanks

[oneindex](https://github.com/donwa/oneindex)
[oneindex_scf](https://github.com/qkqpttgf/OneDrive_SCF)

## License

MIT
