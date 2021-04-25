## Cloudflare Workers 部署

### 新建 Worker
![image.png](https://i.loli.net/2021/02/19/5tsTuklZUDWSIix.png)

### 粘贴代码

https://github.com/ukuq/onepoint/blob/master/worker/script.js

或者 https://raw.githubusercontent.com/ukuq/onepoint/master/worker/script.js

代码较多，保存可能要费点时间，不要心急！

![image.png](https://i.loli.net/2021/02/19/92xyFLK5dOrWk4s.png)

### 返回上一级，新建KV桶，名字随意

![image.png](https://i.loli.net/2021/02/19/Ep2rmbQN9y1TFDI.png)
![image.png](https://i.loli.net/2021/02/19/WfnypotgmCHuPqh.png)

### 绑定KV桶，变量名设置为OPCONFIG

![image.png](https://i.loli.net/2021/02/19/W6MOmlRYTi53oQZ.png)

### DEMO

https://onepoint.onesrc.workers.dev/

### DEV

如需修改代码，可以 git clone，修改前后使用 wrangler build 打包

