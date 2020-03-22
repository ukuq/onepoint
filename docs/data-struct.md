# 数据结构

## file

文件或者文件夹的基本信息

| 属性名 | 类型   | 描述                                                         |
| ------ | ------ | ------------------------------------------------------------ |
| type   | Number | 0代表文件，1代表文件夹，3代表云盘                            |
| name   | String | 文件名/文件夹名/云盘名                                       |
| size   | Number | 文件大小，大小未知时可使用 `null`表示。                      |
| mime   | String | mime，类型未知时使用 `application/vnd.onepoint.unknown`, 文件夹或云盘时为`""` |
| time   | String | 最后修改时间，格式固定如 `2020-03-20T08:31:13.072Z`          |

示例

~~~javascript
{
  "type": 0,
  "name": "favicon.png",
  "size": 1,
  "mime": "image/png",
  "time": "2020-03-20T09:34:47.137Z"
}
{
  "type": 1,
  "name": "PerfLogs",
  "size": 0,
  "mime": "",
  "time": "2019-03-19T04:52:43.971Z"
}
{
  "type": 3,
  "name": "demo_goindex",
  "size": null,
  "mime": "",
  "time": "2020-03-20T08:31:13.072Z"
}
~~~

