## nowsh 部署指南

now.sh 现已更名为 vercel, 以下仍以 now.sh 指代该平台.

now.sh 对 js 的文件数目做出了限制 (免费版不得多于 12 个), 所以部署 nowsh 时, 实际上使用的是 npm 包, 而不是 github 数据. 如果想要部署 github 上的文件, 请自行打包, 以减少文件数.

## 部署命令参考:

~~~shell
cp bin/index_now.js test/nowsh/api/ #为统一管理适配器文件, 要求所有适配器均放到 bin 文件夹
cp config.json test/nowsh/api/ #这里需要存放配置文件
mv test/nowsh test/onepoint #重命名, 文件夹名即为 nowsh 项目名
cd test/onepoint #准备部署

npm i -g vercel #安装cli
vercel --token ${{ token }} --confirm #token 获取 https://vercel.com/account/tokens
~~~

## 文件结构图
~~~shell
.
├── api
│   ├── config.json
│   ├── index_now.js
│   └── package.json
└── vercel.json
~~~
