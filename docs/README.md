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

## Demo

以下链接由 github action 自动部署

https://service-0nvsu1bi-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onepoint

https://onepoint.ukuq.now.sh

## 配置与安装

个人建议，先使用默认的配置安装一遍，如果没有问题，修改 config.json 后再次安装。

### 配置

配置工具：https://ukuq.github.io/onepoint/config.html

参考手册：https://www.onesrc.cn/p/details-of-onepoint-configjson-configuration.html

### 安装

[利用 linux 机器部署](https://www.onesrc.cn/p/how-to-deploy-onepoint-on-linux.html)

[利用 now.sh 部署云函数 OnePoint](https://www.onesrc.cn/p/deploy-cloud-function-onepoint-with-nowsh-serverless.html)

[利用腾讯云函数部署](https://www.onesrc.cn/p/onepoint-configuration-process.html)


### 更新

暂时没有统一的方法，下载最新安装包按上面的流程重新配置安装即可。


## 问题反馈

> 进行任何操作前请先阅读 [《提问的智慧》](https://github.com/ruby-china/How-To-Ask-Questions-The-Smart-Way/blob/master/README-zh_CN.md)

当前获取帮助有三种方式：

1. 通过 [GitHub issue](https://github.com/ukuq/onepoint/issues) 提交问题（仅限问题反馈）
2. 通过 [个人博客](https://www.onesrc.cn) 评论留言

无论采用哪种方式，请务必注意自己的言行举止，尊重他人，遵守最基本的社区行为规范。 在求(伸)助(手)前请仔细阅读文档，一般文档里面都有答案。

提交问题时请确保提供完整的日志信息，否则不予跟进。

## 其他

本软件仅供日常学习使用，不得用于任何商业用途；学习使用请遵守您所在国家的法律，任何非法行为由使用者本身承担。

如使用本应用，请保留底部版权，并分享给更多人，谢谢。

## Thanks

[oneindex](https://github.com/donwa/oneindex)
[oneindex_scf](https://github.com/qkqpttgf/OneDrive_SCF)

## License

MIT
