# 更新说明

此次改动较大，所以先放到 dev-vue 分支了。

此版本的主要调整包括:

管理员部分使用了vue、dplayer、aplayer（参考了zfile的处理方式，这里向他致谢），浏览起来更加丝滑。但像文件管理、文件上传部分基本的 copy 的原来代码，以后还会修改，进一步优化。

管理员部分还添加了管理员账户，需要同时输入账户密码才能登录。

新增了几个简单的主题，主题在/views下，可以自行尝试。个人精力有限以后只维护 w.w 。基本上主题部分的接口已经固定，可以参考这些例子编写自己的主题，当然，能够开源就更好了。

新增了世纪互联的配置选项（配置时oauth为1），在此处 https://point.onesrc.cn/oauth2/ 可以获取 token。这里使用的是试用版api，如果有大佬有多余的账号，欢迎送我一个>_<。

新增了文件保存的功能，scf 使用的是 cos，linux使用的是文件系统，now 不支持

此外，还简化了list部分的api，以后大概是不会变了。

现在整个 onepoint 还属于搭建框架的状态，api部分将在框架搭建的差不多时再开放吧。

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
