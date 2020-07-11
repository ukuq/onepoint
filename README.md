# OnePoint

一个轻量级、多平台、多种网盘的文件目录索引和管理工具。


## 最近更新

### 200701

新增 context模块调用参数, 提供了保存配置的api
新增 onedrive_graph 每隔 30 天自动更新一次 refresh token

优化 缓存结构
优化 w.w主题, 数据格式化放到前端由js实现

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

- onedrive 国际版/世纪互联版/无全局管理员版
- google drive v3API/goindex兼容接口
- coding 团队网盘
- 本机文件系统
- webdav(dev)
- 自定义链接

## 快速部署

### github 测试版

~~~
git clone https://github.com/ukuq/onepoint.git
cd onepoint && npm install

npm start
# pm2 bin/index_node.js
~~~

### npm 稳定版

~~~
npm install onepoint

node node_modules/onepoint/bin/index_node.js
# pm2 start node_modules/onepoint/bin/index_node.js
~~~

PS: 建议使用 pm2 作为守护进程

### 其他方式

- [now.sh](./test/nowsh/README.md)
- [scf]()

## Demo

以下链接由 github action 自动部署

https://service-0nvsu1bi-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onepoint

https://onepoint.ukuq.now.sh

## 配置与安装

### 核心配置项说明:

~~~
"/demo_linux/": {
    "funcName": "system_fs",    //模块名(必填)
    "spConfig": {               //模块相关配置(必填)
        "root": ""
    },
    "password": "123",          //访问该云盘所需要的密码
    "desc":"read me!"           //云盘 readme
    "hidden": [                 //该云盘下需要隐藏的文件或文件夹, 格式为 /xx/xx/xx
        "/Intel","/eve/bs"
    ]
}
~~~

### 密码功能

两级密码, 云盘密码 和 目录密码. 

云盘密码负责该云盘的访问权, 未通过校验拒绝所有请求。该项通过 password 字段实现。

目录密码负责特定文件夹, 未通过校验则拒绝显示子文件。该项通过添加 .password=123456 文件实现。

### 隐藏文件

拒绝访问指定路径前缀的文件(404), 隐藏指定路径的文件。

该项通过 hidden 字段实现。

### readme

文件列表中 README.md 文件 > 云盘 desc 字段 > 全局 site_readme 字段

按照上述优先级显示 readme。

### 下载代理

通过指定网站代理下载, 请求格式为 http://example.com/url=<编码后的下载直链>

该项在全局 proxy 字段设置, 字段格式为 http://example.com/

### 跨域设置

可用于前后端分离部署，以及自定义使用 api

该项在全局 access_origins 字段设置, 字段格式为 http://example.com

### 前后端分离

#### 自定义前端部署:

将 docs/front-end/index.html 放置前端,按提示修改 window.p_h0 变量

#### 前后端分离示例

https://ukuq.github.io/onepoint/front-end?<后端域名路径>

例如:

https://onesrc.cn/static/onepoint?https://service-0nvsu1bi-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onepoint

https://ukuq.github.io/onepoint/front-end?https://service-0nvsu1bi-1255607810.ap-hongkong.apigateway.myqcloud.com/release/onepoint

### 反向代理

~~~
"DOMAIN_MAP": {
    "::ffff:127.0.0.1": {       //根据ip修改ph和p0
        "ph": "",
        "p0": ""
    }
}
~~~

### 扩展项x

#### scf 保存功能

依赖腾讯云对象存储 cos 实现保存配置, 在 G_CONFIG 下配置, 涉及参数 secretId, secretKey, bucket, region

仅 scf 平台有效, 格式为x-scf-cos-xxxx

#### 评论功能

开源项目 valine 实现评论功能, 涉及参数 appId, appKey

仅 w.w 主题有效, 格式为 x-valine-xxxx

### 文件管理

地址: http://example.com/admin/

首页页面卡负责文件预览, 默认使用系统缓存. 若检测到管理员 cookie, 则自动停用云盘密码, 目录密码, 目录强制分页, 目录文件隐藏功能.

管理页面卡负责文件的管理, 部分模块可能不支持文件管理. 该页面发出的所有请求都不会使用使用系统缓存, 且系统会根据部分文件操作处理更新缓存. 

默认清空下, 下载链接缓存 5min, 文件列表缓存 1day, 如果需要刷新,可通过管理页面卡完成.

### 相关文档

文档地址：https://ukuq.github.io/onepoint/

配置工具: https://ukuq.github.io/onepoint/config.html

参考手册：https://www.onesrc.cn/p/details-of-onepoint-configjson-configuration.html

## Thanks

[oneindex](https://github.com/donwa/oneindex)
[OneManager](https://github.com/qkqpttgf/OneManager-php)

## License

MIT
