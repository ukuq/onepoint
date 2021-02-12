module.exports = {
    params: [], // paramsTemplate array
    format: async (config) => {}, // 配置格式化,启动时调用此项格式化配置文件
    commands: ['ls'], // 允许调用的命令
    async init(config, data, cache, ctx) {
        // 预处理函数,每次请求调用
        const c = ctx.$node.$cache;
        if (c.one && c.etime < Date.now()) {
            return;
        }
        c.one = await this.doSomething();
        c.etime = Date.now() + 1000 * 60 * 60;
    },
    // ls命令 即使请求不规范，例如/a/b/c 是一个目录 或者 /a/c/ 是一个文件，都应该正确返回结果，不能被末尾的/影响
    // 但，如果在知道请求类型的情况下，还是应该以末尾的/判断类型，如果错误再进一步处理
    async ls(config, { path, page }, cache, ctx) {},
    async mkdir(config, { path, name }, cache, ctx) {},
    async mv(config, { path, path2 }, cache, ctx) {},
    async cp(config, { path, path2 }, cache, ctx) {},
    async rm(config, { path }, cache, ctx) {},
    async ren(config, { path, name }, cache, ctx) {},
    async touch(config, { path, name, content, mime }, cache, ctx) {},
    async upload(config, { path, name, fileInfo }, cache, ctx) {},
    error: async (err, ctx) => {
        throw err;
    }, // 错误处理函数
    doSomething() {}, // 其他自定义函数
};
