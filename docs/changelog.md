# 更新日志

## 200710

修复 sharepoint 链接取消后的错误消息提示问题

优化 删除几个不常用且不再维护的主题

结构优化 适配器名称参数移动到初始化阶段传入
结构优化 新增 x-valine-enabled 和 x-scf-cos-enabled 参数,优化控制

## 200701

新增 context模块调用参数, 提供了保存配置的api
新增 onedrive_graph 每隔 30 天自动更新一次 refresh token

优化 缓存结构
优化 w.w主题, 数据格式化放到前端由js实现

## 200617

内部结构优化
配置项优化

完善了scf下的保存功能
完善了w.w主题的评论功能

## 200519

新增隐藏文件功能
优化 w.w 主题
修复 coding 日期显示问题

## 200411

onecache 新增上传删除等文件操作后自动刷新缓存
onecache 优化缓存结构

system_admin 优化管理界面，简化设置

w.w 新增 idoc 预览

## 200327

onedrive_graph 新增无管理员 onedrive 支持
onedrive_graph 新增网站 sharepoint 支持
onedrive_graph 新增支持自定义 secret key
onedrive_graph 优化 api 请求次数

onecache 修复缓存导致的404问题
onecache 优化 list 类型缓存时间判断
onecache 优化 mime 不规范导致的文件类型不能识别的问题

w.w 修复 site_readme 显示问题

## 200322

完善文档，优化 linux 部署部分。

## 200321

event 增加 set_cookie 数组，统一管理 cookie 的设置

其他内部优化

## 200305

增加 ?json直接获取数据

删除 /api/public/ls 接口

支持前后端分离


## 200224

此次改动较大，所以先放到 dev-vue 分支了。

此版本的主要调整包括:

管理员部分使用了vue、dplayer、aplayer（参考了zfile的处理方式，这里向他致谢），浏览起来更加丝滑。但像文件管理、文件上传部分基本的 copy 的原来代码，以后还会修改，进一步优化。

管理员部分还添加了管理员账户，需要同时输入账户密码才能登录。

新增了几个简单的主题，主题在/views下，可以自行尝试。个人精力有限以后只维护 w.w 。基本上主题部分的接口已经固定，可以参考这些例子编写自己的主题，当然，能够开源就更好了。

新增了世纪互联的配置选项（配置时oauth为1），在此处 https://point.onesrc.cn/oauth2/ 可以获取 token。这里使用的是试用版api，如果有大佬有多余的账号，欢迎送我一个>_<。

新增了文件保存的功能，scf 使用的是 cos，linux使用的是文件系统，now 不支持

此外，还简化了list部分的api，以后大概是不会变了。


## 200210

增加访客模式下ls接口，调用格式为 /api/public/ls?path=< path >

增加管理员模式系统数据获取api

完善系统分页功能，200文件以内以50为分页标准，大于200则以200为分页标准


## 200201

增加 onedrive_graph 文件搜索功能

增加简单统计日志

增加管理员下的多个独立页面

优化文件管理界面

## 200125

增加 eventutil，简化适配器模块

增加文件管理功能，目前仅支持 onedrive_graph 模块

优化配置文件初始化过程

## 200106

增加了 w.w 主题

增加分页功能，默认 50/page

## 200105

增加了库文件，分离了出了云盘模块中的调用。（eg：onedriveAPI）

增加了统一的缓存管理，云盘模块不用再关心缓存问题。（eg：cacheutil）

增加了树形缓存管理系统，查找速度更快。（eg：cacheutil）

增加了代理设置，资源访问出现问题时可以尝试代理。（eg：simple）


优化了模块名，更清晰易懂。（eg：onedrive_graph）

优化了渲染模块，系统不再干涉具体实现。（eg：simple）

优化了模块内的全局变量，删除部分变量。（eg：main）

优化 http 请求，采用更加友好的 axios 模块，代码更简洁（eg：axios）

优化最长路径匹配规则。（eg：main）

## ADC 格式

- A: add, 新增
- D: delete, 删除
- C: change, 优化

## 191201

- A:
增加 now.sh 部署支持
增加 linux node 部署支持

## 191125

- A: 
文件列表若有 README.md 且有直链, 前端 xhr 加载, 目前只有 ms_od_graph 模块满足此功能;
新增反代功能, 方便使用自定义域名, 具体配置参考 config.json/DOMAIN_MAP 

- C: 
优化显示效果

## 191122

新增 吐个槽

## 191120

增加pdf office txt 预览, 优化 ms_od_graph 模块

## 191117

增加文件夹密码功能

## 191113

修复缓存被清空问题, 修改render, 为多主题做准备

## 191110

新增onedrive graph api 和 图床功能, 新增 Msg_html 功能

## 191105

新增密码功能, 调整了配置文件

## 191031

修复了文件名含有空格的无法访问的 bug。增加了 linux_scf 和 google drive 两个模块。

## 191029

调整架构, 分离数据和界面, 支持多种 api

## ...

...

## 191005

首次发布, 支持文件列表, 直链下载
