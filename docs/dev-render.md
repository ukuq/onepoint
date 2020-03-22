# onepoint 渲染模块开发指南

渲染模块是最简单的模块了，它负责渲染 type0，type1，type2 三种 msg 类型的数据。

~~~javascript
function render(msg, event, G_CONFIG)
~~~

## 入参

msg：msg 对象，通常由 msgutil.js 生成。

event：事件信息，通常和云盘event（drive）一致。

G_CONFIG：全局配置，里面包含了网站的一些信息。

## 返回值

G_CONFIG 中包含和网站有关的 site_xx 信息，可以选择使用或者不使用。最后需要返回渲染后的 html 字符串。

## 文件预览

对应于 type0，可以不实现预览。

## 文件列表

文件列表，如果支持预览，链接中需要有 `?preview` 参数。

## 消息通知

展示 200 400 401 404 500等信息。

唯一需要注意的是 401，如 info为 `pass:请输入密码`，则需要渲染一个表单，且表单中有一项名为`passs`。

401 主要用于云盘密码和目录密码的访问。

## 补充说明

### 避免渲染

如果在 url 中包含 ?json 参数，系统会直接返回 json 对象，不再经过渲染模块。

`http://example.com/mydrive/a.txt` 为直接下载文件，不经过渲染模块。

`http://example.com/mydrive/a.txt?json` 为返回 json，同样不经过渲染模块。

`http://example.com/mydrive/a.txt?preview` 为预览，须要经过渲染模块。

### 前后端分离

如果需要使用前后端分离，可以利用`?json`获取数据。可参考 接口部分的文档。

### 特殊字符处理

路径中有一些特殊字符如`%?#`不能直接使用，必须先转义才行。可参考`views/simple.js` 的处理过程（urlSpCharEncode）。

