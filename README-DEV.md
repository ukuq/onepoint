doc v2.0.10112

## what

OnePoint项目取名于OneDrive和SharePoint，其最初目的是对无管理员的OneDrive教育类账户实现目录索引的功能以补充oneindex的不足之处。但后来被onemanager项目开发者逸笙先生“带偏”，开始尝试支持多种云盘、文件管理功能。但不同云盘之间，api各有特色，统一确实不易。onepoint项目力争统一各个api之间的差异，尽可能地提供出统一的接口。

**目录索引是其主要功能，文件管理是其尽可能要实现的功能。**


## path or id? 

最初开发OneDrive部分，path是一个很方便的定位方法，也很直观。但像GoogleDrive以及最近的AliDrive都没有提供path定位文件的api，其只支持id定位文件。path or id，这是一个问题。

onepoint允许用户只挂载某个文件夹下的文件，而隐藏掉其他文件，而这一功能是需要用path才能提供的。倘若直接提供id，该部分的访问控制功能就会丢失，那些隐藏掉的文件就有可能会被访问到。例如GoogleDrive，其根目录id固定为root，倘若用户挂载的是某个子目录，且提供了id定位的功能。那么就有可能注入id为root的请求，从而访问到隐藏文件。

按照一般的思路来说，文件的id应该是随机的，不应该有规律可寻。如果提供了id定位，攻击者仍可能根据id规律，猜测出有效id，进而通过注入伪id访问到隐私文件。例如coding.net，其id生成规则是连续的，知道一个id，很容易猜测出其他文件的id。

考虑到上面的情况，onepoint决定采用path为主，id为辅的定位方式。

path为主，单用path，一定可以定位到文件，但在云盘模块内部可能会发起多次请求才能拿到数据。

id为辅，单独的id无法定位任何文件，必须要提供path，根据path定位到是哪一个云盘，云盘再通过id定位文件。

为了防止id注入，onepoint将会对所有的id进行签名，原id和签名共同组成新id。访问文件时，可以同时提供path和id，onepoint将根据id签名验证id的有效性，进而决定要不要使用id。

例如: http://example.com/gd/images/dog.png?id=123.123

onepoint将会验证id-123.123的合法性，如果id-123.123合法，onepoint将path和去除签名的id-123一并传递给云盘模块；如果不合法，则仅将path传递给云盘模块。

在为id签名时，onepoint将会加上过期时间、path、全局salt一并计算出签名值，以防止第三方伪造id。


## 特殊字符

有一些字符，不建议使用。适配这些字符意义不大，且有时还会有歧义。

这些字符主要包括转义字符、编码字符、不可打印字符。

~~~sh
\/:*?"<>|
?&=%#+
,;$@
~~~


## 名词解释

op 游客

## 访问控制-ac

访问控制(access control, 以下简称 ac )是 op 提供的一种通过检测文件路径从而限制游客访问文件(夹)的一种工具。

控制内容和云盘配置项中的 hidden、password 以及文件列表里面的文件名有关

ac 具体分为三个部分，云盘访问控制，列表访问控制，云盘文件隐藏

云盘访问控制，即云盘密码。这一项将会在云盘模块调用前检测，直接决定了能否调用云盘模块，属于绝对控制型，由 password 字段实现。

列表访问控制，即列表密码。考虑到各个云盘模块之间的差异性，列表访问控制只在当前返回的数据是列表，且列表中包含了 .password=\<pass> 文件（夹）时有效。仅能隐藏当前的目录，对子目录以及目录下的文件没有限制，如果出现分页且分页列表中也不包含该类文件时也无效，故属于相对密码。当有多个 .password=\<pass> 文件（夹）时，密码匹配上任意一个即可

云盘文件隐藏，即文件隐藏。根据相对于云盘模块的路径（p2）隐藏文件。包括直接访问时的 404 以及从 list 里面剔除隐藏项。如果涉及了云盘分页，剔除隐藏项后的 list 中数量可能不一致。由 hidden 字段实现

如果未通过 ac，则会抛出 Error\_Unauthorized，如果未通过 hidden 字段则抛出 Error\_ItemNotExist

## 缓存控制-cc

缓存控制(cache-control, 以下简称cc)用于控制缓存。其仅用于加速游客 ls 命令的访问！如需刷新缓存，请在请求参数里面增加 query.refresh。

例如：http://example.com/image.png?refresh

## 分页控制-page

分页系统分为两个部分，系统分页和云盘分页。

云盘分页是云盘模块自己实现的分页，通常来说只有在文件夹中文件数量特别多时有效。云盘无法一次从服务器端拿取所有数据，只得分页，分页参数由云盘模块提供。

如果云盘一次可以拿下所有数据（比如200个），但数据量略显大，此时系统分页生效。将进一步分页，将200个分为4个50页。需要注意的是，如果指定了query.refresh，系统分页同样会失效。

## 访问网页

为了方便说明，不妨假设我们的baseURL是 http://example.com，当然实际使用中，它也有可能是 http://example.com/share，这也是可行的。
不妨假设我们在/OneDrive/目录下挂在了一个OneDrive云盘(当然,也可以挂载在/目录)

如果想要获取某个item，访问时请保证访问path不以'/'结尾，如果想要获取列表，访问时请保证末尾是'/'

### 获取item

如果item是file，则会下载该文件，如果是folder，则会显示其属性。

如果想要预览文件，请在query参数里面添加preview属性

### 获取list

如果是一个文件夹，则显示文件夹中的子元素

如果是一个文件，将会报错 Error_ItemIsFile

### 前后端分离

增加query.json参数即可

例如：http://example/OneDrive/image,png?json

## 数据类型(仅供参考)

### ConfigParam

| Property    | Type                    | Description                                                 |
| :---------- | ----------------------- | ----------------------------------------------------------- |
| name        | string                  | 属性名                                                      |
| value       | string\|Array.\<string> | 默认值或当前值                                              |
| star        | boolean                 | 可选。是否建议填写                                          |
| level       | number                  | 可选。优先级0-9，越大越靠前,偶数为系统项,扩展项建议选择奇数 |
| desc        | string                  | 可选。属性描述，支持html标签                                |
| placeholder | string                  | 可选。input或textarea有效                                   |
| hidden      | boolean                 | 可选。是否隐藏此配置项                                      |
| textarea    | boolean                 | 可选。是否为textarea，默认为input                           |
| select      | Array.\<string>         | 可选。是否为select类型                                      |
|             |                         |                                                             |

value可以为string或Array.\<string>

value == string 时默认使用input组件，代表短字符串；如果启用 textarea 参数，则使用textarea组件，代表长字符串；如果启用 select 参数，则使用 select 组件，代表枚举类型。

value == Array.\<string> 代表字符串数组

## FileItem

| Property | Type | Description |
| -------- | ---- | ------------------- |
| type     | number | 类型，0 文件, 1 文件夹, 3 云盘 |
| name     | string | 文件（夹）名 |
| size     | number | 文件（夹）大小 |
| mime     | string | mime 类型，非文件时为空字符串 |
| time     | ISOString | 上次修改时间 |
| url      | string | 可选。下载链接 |
| thumb | string | 可选。预览图链接 |
| desc     | string | 可选。简单的描述信息 |
| key | string | 可选。内部URI，用于云盘内定位文件 |

## Error

| Property                      | Attributes                                           |
| ----------------------------- | ---------------------------------------------------- |
|                               | path: string                                         |
| *ItemNotExist                 | path: string                                         |
| InvalidRequestPath            | path: string, format: string                         |
| InvalidRequestParam           | expect: Array                                        |
| *Unauthorized                 | field: string, type: string（empty，invalid，wrong） |
| UnauthorizedToken             | token: string                                        |
| UnsupportedAPI                | path: string                                         |
| *CommandNotAllowed            | command: string                                      |
| InvalidUserAuth               | username: string                                     |
| *DriveNotExist ModuleNotExist | path: string module: string                          |
| InvalidModule                 | module: string                                       |
| NotDownloadable               | name: string                                         |
| InvalidRange                  | range: string, size: number                          |
| *InvalidPage                  | page: string                                         |
| ItemIsFile                    | path: string                                         |
| *AccessDenied                 | 非法操作，拒绝访问                                   |
| ModuleError                   | msg: string                                          |
| ConfigError                   | fields: Array.\<string>                              |
| NoConfiguration                 |                                                      |





