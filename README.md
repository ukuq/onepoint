# OnePoint

一个轻量级、多平台、多网盘的文件目录索引(和管理)工具。

项目地址：https://github.com/ukuq/onepoint

## 项目特点

轻量级、多平台、多网盘

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

- alidrive

  官网：https://www.aliyundrive.com/drive/

  通过refresh_token访问

## 快速部署

### github 测试版(2.0.0)

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

## 更新说明

### 210425

新增阿里云盘，支持翻页、id

优化了 onedrive 模块，删除了 code 功能，只保留 refresh_token和share_url

优化了 googledrive 模块，删除了 code 功能，只保留 refresh_token,支持自定义 client api

删除了 art-template，改用 art 编译后的 js 文件生成 html

删除了系统分页，只保留云盘模块自身的分页功能

修复了因缓存而引起的文件下载链接过期的 bug

优化了 w.w 主题，看起来更和谐了，感谢 naicfeng 提供的demo

### 210413

增加了乐观锁，修改配置时有效，防止多次修改

重写管理页面前端代码，支持了多图片、多音频预览功能, 非常建议更新~

## Thanks

[oneindex](https://github.com/donwa/oneindex)
[OneManager](https://github.com/qkqpttgf/OneManager-php)

## License

MIT
