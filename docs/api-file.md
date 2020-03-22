# 文件管理接口

文件管理接口是为文件的所有者提供的一种文件管理功能。

统一调用格式

~~~javascript
POST ${baseurl}/api/cmd

{"cmdType":"ls","cmdData":{"path":"/"}}
~~~

返回类型可参考 `模块开发/云盘模块/基础命令` 部分。