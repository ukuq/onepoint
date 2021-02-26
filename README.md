# OnePoint

一个轻量级、多平台、多网盘的文件目录索引(和管理)工具。

项目地址：https://github.com/ukuq/onepoint

## 项目特点
  
- 轻量级，运行于nodejs，内存占用极小
- 多平台，分离式架构，支持部署在传统linux服务器、cloudflare workers、云函数等平台
- 多网盘，统一式接口，支持本地存储(node-fs)、onedrive网盘、GoogleDrive网盘、coding.net项目云盘文件、teambition项目云盘文件等平台
- 文件列表，可将文件夹下的文件以列表的形式展示，便于用户浏览
- 文件管理，留有简单的文件管理接口，支持对文件的移动、复制、新建、删除（具体实现多少，由模块负责）
- 前后端分离，支持完全的前后端分离，便于用户扩展使用
- 音视频预览，支持自定义主题，可由前端实现音视频预览
- 任意路径挂载，可以分享云盘的某个文件夹，也可以将该分享挂载到任意路径（例如在/a/b/c/下挂载）
- 路径寻址，以路径定位文件，根据路径确定访问的文件

## 支持云盘

- onedrive
  
  官网：https://office.com/
  
  类型比较多，为了统一全部放置到了本模块里面，包括国际版、世纪互联版、分享链接三大类，可按照配置时的提示完成填写
  
- googledrive

  官网：http://drive.google.com/

  受限于api，所有的下载都将会由本机中转完成
  
- coding

  官网：https://coding.net/

  公开api功能太少，所有的功能都是根据cookie完成
  
- teambition

  官网：https://teambition.com/

  无公开api，所有功能通过cookie实现，cookie并不一定稳定，这一部分未实现文件管理功能
  
- node_fs

  官网：http://nodejs.org/

  基于nodejs自身fs api完成，仅用于挂载本机文件

## 快速部署

### github 测试版(1.9.9)

~~~
git clone https://github.com/ukuq/onepoint.git
cd onepoint && npm install

npm start
# pm2 lib/starters/node-http.js
~~~

## cloudflare 部署

参考：worker/README.md

## Demo

https://onepoint.onesrc.workers.dev/

https://op-test.onesrc.workers.dev/

## Thanks

[oneindex](https://github.com/donwa/oneindex)
[OneManager](https://github.com/qkqpttgf/OneManager-php)

## License

MIT
