# onepoint 云盘模块开发指南

云盘模块 (drive) 是 onepoint 项目中和具体的云盘交互的部分，该模块负责利用提供的配置信息，获取文件、文件列表或者执行其他操作，并将结果按照统一的格式返回。

## 函数入参

云盘模块处理的入参为

~~~javascript
async (spConfig, cache, event)
~~~

spConfig：由该模块的开发者定义，不同模块一般不同，此配置中主要包括访问认证所需的信息，如access_token。

cache：缓存对象。该对象是由核心模块提供的一个用于缓存的对象，该对象可以用于保存缓存信息。由于一个模块可能被多个不同的路径多次使用，所以分别为它们提供一个 cache，以免相互之间产生干扰。

event：事件对象

## event 格式 (drive)

和适配器 event(adapter) 相比，多了下面的属性。

~~~javascript
{..., start_time, p2, p2_des, sp_page, cmd, cmdData, set_cookie}
~~~

start_time：为事件触发的开始时间，Date 类型。

p2：路径处理中的 p2，云盘模块需要处理的路径。

p2_des：路径处理中的 目标路径 p2。该项只在 cp，mv 之类的需要双路径时才出现，表示为目标路径。

sp_page：分页属性，只在需要分页时有效，默认为 数字0。但有时也可能为字符串，该字符串由开发者提供。

cmd：命令类型，包括 ls, mkdir, mv 等。

cmdData：命令数据，该项为 cmd 提供所需要的数据，如新建文件夹的名称。

set_cookie：Set-Cookie 数组，最后统一使用 `cookie.serialize` 序列化。该项用于向浏览器传递 cookie 数据，一般用不到。

此外还有一些其他属性。

如 isadmin，noRender 和 isNormal。这些属性仅供核心模块使用，且以后有可能会有所变更。不建议使用。

## msg 格式

msg 是调用云盘模块完成后返回的结果。

返回数据有四种，type0，type1，type2，type3

type0 为最普通的单文件信息返回。

type1 为普通的文件列表返回。

type2 为通知类信息返回。

type3 为自定义类型返回，此种类型在任何情况下直接返回。

上面的各种格式统一由 `utils\msgutils.js` 工具生成。

`msgutils` 中涉及的主要参数如下：

~~~javascript
file: {//0_file
    type: 0,//固定值
    name: "xx.txt",//文件名
    size: 63,//文件大小
    mime: "text/plain",//mime
    time: "2019-01-02 15:02:44",//最近修改日期
}
list: [//1_dir
{
    type: 0, //type: 0_file 1_dir 3_drive, drive 类型由系统自动生成。
    name: "xx.txt",//文件名或文件夹名或云盘名
    size: 63,
    mime: "text/plain",//mime
    time: "2019-01-02 15:02:44",//最近修改日期，文件夹或云盘可为空
}]
url:""//均为url类型，
nextToken:""//200+文件时使用的分页token，该参数与 sp_page 对应
~~~

工具中提供了 json（type2）和 html_json（type3）两种 json 数据返回，二者的区别是 json 可以被 api 模式拦截，且后者永远都不需要经历渲染模块。

以`{a:1}`为例，普通情况下 type2 返回 渲染模块处理的结果，api 模式下，返回字符串`{type: 2,statusCode:200,headers: {},data: {info: 'json msg'},json: {a:1}}`。而 type3 返回的永远都是 `{a:1}`。

## 基础命令

目前支持的命令有

| 命令及参数              | 功能                   | 返回类型（2xx）  | cmdData           |
| ----------------------- | ---------------------- | ---------------- | ----------------- |
| `ls p2`                 | 获取文件列表或下载文件 | type0，type1     | path              |
| `mkdir p2 name`         | 新建文件夹             | 201: type2       | path, name        |
| `mv p2 p2_des`          | 移动文件（夹）         | 200: type2       | srcPath, desPath  |
| `cp p2 p2_des`          | 复制文件（夹）         | 200: type2       | srcPath, desPath  |
| `rm p2`                 | 删除文件（夹）         | 204: type2       | path              |
| `ren p2 name`           | 重命名文件（夹）       | 200: type2       | path name         |
| `touch p2 name content` | 新建文件               | 201: type2       | path name content |
| `upload p2`             | 上传大文件             | 201: type3(待定) | x                 |
| `find xx`               | 查找文件（夹）         | （待定）@flag    | x                 |

ls 为最基础的命令，该项必须要实现。

mkdir，mv，cp，rm，ren 可选。这些命令中可能有比较耗时的操作，目前的逻辑是异步处理，模块直接返回成功信息。

touch 为简单文件上传，数据量不宜过大，且目前仅支持文本。对于 img 等类型，使用 base64 转码，可通过`cmdData.isBase64`判断。

upload 为大文件上传，find 为文件查找，这两项由于不同模块差异可能会很大，所以先搁置这两个命令。@flag

错误信息处理有两种方式

- 以 404 为例，可以选择在程序中捕获错误，返回`Msg.info(404)`。
- 统一使用 axios 库，不要求对 http 产生的 4xx, 5xx 捕获。核心模块会统一捕获并处理这些错误。

## 自定义命令

在云盘模块的调用过程中，需要明确的是 p1 仅用来决定使用哪一个配置数据和调用哪一个云盘模块，p2 是传入该云盘的路径。核心模块只是去调用该云盘模块，但不会去干涉模块内部的实现，这也是我们可以使用自定义命令的基础。

自定义命令时，需要自定义 cmd 类型，并将需要传递的信息放到 cmdData 中。建议自定义命令格式以`x-`为前缀，例如 `x-mycmd`。

## 补充说明

### 关于下载链接

通常情况下，该部分为网盘的直链。

如果下载链接中包含了重要的认证信息，可以使用`?download` 中转处理，可参考未完全实现的 webdav 模块。这一点待定，以后还会有修改。@flag。

### 关于分页

首先建议每次最多返回 200 文件。如果文件数在 200 以内，则由核心模块完成分页，且每页 50 个文件，分页参数为 page。如果文件数超过 200，则核心模块不再处理分页，分页由云盘模块决定，分页参数为 sp_page, 每页 200项。

### 关于 sp_page

该项主要用于单个文件夹内文件数量过多的情况。如 onedrive 一次最多返回 200 文件，200+ 的文件需要使用 skiptoken 参数，这种情况下 sp_page 提供该参数。可参考 onedrive_graph 模块。注意对 sp_page 进行正则匹配，以免恶意注入。

### 关于缓存

核心模块会自动缓存 ls 返回的 type0 和 type1 类型，故云盘模块本身无需缓存这些内容。默认情况下 type0 缓存 5 分钟，type1 缓存一天。
