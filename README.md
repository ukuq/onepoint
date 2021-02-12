# OnePoint

一个轻量级、多平台、多网盘的文件目录索引(和管理)工具。

# 测试版,功能不稳定!

ac cc pc 未测试

文件管理未重新测试

一些细节还需要再梳理梳理

## 项目地址

https://github.com/ukuq/onepoint

## 项目特点
  
- 模块分离
- 平台无关
- 网盘无关
- 文件列表
- 文件管理
- 前后端分离
- 音视频预览

## 支持云盘

- onedrive
- googledrive
- coding
- teambition
- node_fs

## 快速部署

### github 测试版(1.9.9)

~~~
git clone https://github.com/ukuq/onepoint.git
cd onepoint && npm install

npm start
# pm2 lib/starters/node-http.js
~~~

## cloudflare 部署

复制 worker/script.js 代码, 创建名为 OPCONFIG 的kv.

## Demo

https://onepoint.onesrc.workers.dev/

https://op-test.onesrc.workers.dev/

## Thanks

[oneindex](https://github.com/donwa/oneindex)
[OneManager](https://github.com/qkqpttgf/OneManager-php)

## License

MIT
