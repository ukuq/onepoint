# onepoint 适配器模块开发指南

适配器模块 (adapter) 是 onepoint 项目中负责与具体平台交互的部分，所有与平台有关的部分都需要在此处解决。

适配器模块有两个核心任务：

- 负责产生 event，并该 event 将交付于核心模块处理。
- 负责处理来自核心模块的响应信息 responseMsg，将它们交付给用户。

## event 格式(adapter)

数据流向：适配器模块`-->` 核心模块

为了方便处理，核心模块提供了事件生成函数 genEvent。该函数中 query 参数之前的为必须项。如未提供query 及之后参数，genEvent 将会根据已有信息自动生成这些缺失的参数。

~~~javascript
function genEvent(method, url, headers, body, adapter, sourceIp = '0.0.0.0', p0 = '', query, cookie)
~~~

method：http 相关，统一使用大写字母表示，如 GET。

url：http 相关，统一使用原始 url，不对%xx进行反转义。

headers：http 相关，头部属性统一使用小写字符加连字符的形式，如：accept-language。

body：http相关信息，原始 body 字符串，或者是根据 **content-type** 属性转化成的对象，两种形式都可以。

adapter：适配器名称，字符串类型。

sourceIp：访问源 IP，字符串类型，如 111.222.111.222。@info ipv6类型待定。

p0：路径处理中的 p0，与系统无关的路径前缀。如 `http://example.com/mydrive/<云盘路径>` 中 p0 为 /mydrive。把它当成 baseurl 可能会更好理解。

query：http 相关，如未提供，则从 url 中解析。对象类型。

cookie：http 相关，如未提供，则从 headers 中解析。对象类型。

最终，核心模块接收的 event 结构如下。

~~~javascript
let event = {
    method, url, headers, body, adapter, sourceIp, query, cookie,
    splitPath: {
        ph, p0, p_12
    }
}
~~~

## responseMsg 格式

数据流向：适配器 `<--` 核心模块

responseMsg 是核心模块处理完毕后返回的内容，其格式比较简单。

~~~javascript
{statusCode, headers, body}
~~~

statusCode, headers, body 为 http 相关信息。

## 配置的读取与保存

为了提高平台无关性，配置的读取与保存独立了出来，并由适配器模块负责处理。由两个函数完成读取和存储。

### readConfig

读取配置字符串，并解析成对象返回。（支持Promise）

### writeConfig（可选）

入参为一个配置对象，返回保存结果。成功返回 true，失败为 false。（支持Promise）

## x-type 处理（可选）

为了增强文件的下载功能，特利用 `responseMsg.headers['x-type']` 提供了 `stream` 类型的数据，如果 x-type 为字符串 stream，则说明 `responseMsg.body` 不是字符串，而是一个 stream 对象。

该参数项主要用于本机文件下载或者通过本机代理下载的功能。

## 调用步骤

### 初始化

~~~javascript
const { op } = require('./main');
op.initialize({ readConfig, writeConfig });
~~~

readConfig 为必须项，writeConfig 可选，如果未提供，则不具有保存功能。

### 事件处理

可以使用一次调用完成。

~~~javascript
let responseMsg = await op.handleRaw(req.method, req.url, req.headers, body, "node", req.connection.remoteAddress);
~~~

也可以先生成 event，然后对某些部分纠正后调用。

~~~javascript
let _event = op.genEvent(event['httpMethod'], url, event.headers, event.body, "scf", event['requestContext']['sourceIp'], '', event['queryString']);
_event.splitPath['p0'] = '';
let responseMsg =  await op.handleEvent(_event);
~~~

## 补充说明

暂无



