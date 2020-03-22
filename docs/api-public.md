# 开放接口

开放接口是公开的，可用于前后端分离的接口。

## 文件列表

`GET ${baseurl}${path}?json`

`GET ${baseurl}${path}${next|prev}&json`

| 参数    | 描述                                             | 必须 | 参考值               |
| ------- | ------------------------------------------------ | ---- | -------------------- |
| baseurl | 基础路径，包含路径系统中的ph、p0                 | 是   | `http://127.0.0.1`   |
| path    | 文件夹路径，必须以`/`开头和结尾                  | 是   | `/a/b/`              |
| next    | 分页系统，url 中的 search 参数，由 onepoint 提供 | 否   | `?sp_page=xxxxxxxxx` |
| prev    | 分页系统，url 中的 search 参数，由 onepoint 提供 | 否   | `?page=1`            |

请求示例

`http://127.0.0.1/?json`

响应示例：200

~~~javascript
{
  "list": [
    {
      "type": 3,
      "name": "demo_goindex",
      "size": null,
      "mime": "",
      "time": "2020-03-20T08:31:13.072Z"
    },
    {
      "type": 3,
      "name": "demo_linux",
      "size": null,
      "mime": "",
      "time": "2020-03-20T08:31:13.072Z"
    }
  ],
  "next":"?sp_page=UGFnZWQ9VFJVRSZwX1NvcnRCZWhhdmlvc"
}
~~~

## 文件信息

`GET ${baseurl}${path}?json`

请求示例

`http://127.0.0.1/demo_phony/favicon.png?json`

响应示例：200

~~~javascript
{
  "file": {
    "type": 0,
    "name": "favicon.png",
    "size": 1,
    "mime": "image/png",
    "time": "2020-03-20T09:34:47.137Z"
  },
  "url": "https://ukuq.github.io/onepoint/favicon.png"
}
~~~

url：下载直链。

## 失败响应

失败响应可通过其响应码判断，包括 4xx 和 5xx 两种。

响应示例：400

~~~javascript
{"info":"提示信息"}
~~~

## 401 响应

401代表需要认证，即需要输入密码，主要用于云盘密码和目录密码的访问。

例如某次响应为

~~~javascript
{"info":"drivepass:请输入云盘密码"}
~~~

则需要浏览器发起 post 请求，提交`drivepass`认证数据。（`application/x-www-form-urlencoded 和 application/json`均可）

请求示例

~~~javascript
POST http://127.0.0.1/demo_password_123/
Content-Type: application/json

{"drivepass":"123"}
~~~

认证失败则再次返回401，成功则正常返回消息，并为浏览器设置 cookie。

响应示例：200

~~~javascript
Set-Cookie: DRIVETOKEN=ea281b47cb711da418c35b07b9f06cd5; Max-Age=3600; Path=/demo_password_123

{"list":[{"type":1,"name":"alltype","size":839658,"mime":"","time":"2020-02-11T06:45:00.000Z"}]}
~~~