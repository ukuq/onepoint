const template = {
    // 配置项描述模板
    paramsTemplate: {
        name: String, // 属性名
        desc: String, // 描述,支持html标签
        value: Object, // 默认值或当前值
        star: Boolean, // 是否为必须项
        level: Number, // 优先级,0-9,越大越靠前,偶数为系统项,扩展项建议选择奇数

        // 可选项

        placeholder: String, // input或textarea有效
        select: Array, // 是否为select类型
        textarea: Boolean, // 是否为textarea,默认为input
        array: Boolean, // value 是否为数组,默认为字符串,
        hidden: Boolean, // 是否隐藏此配置项
    },
    moduleTemplate: {
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
    },

    errors: {
        NotFound: {
            path: String,
        },
        ItemNotExist: {
            path: String,
        },
        InvalidRequestPath: {
            path: String,
            format: String,
        },
        InvalidRequestParam: {
            expect: Array,
        },
        Unauthorized: {
            field: String,
            type: String,
        },
        UnauthorizedToken: {
            token: String,
        },
        UnsupportedAPI: {
            path: String,
        },
        CommandNotExist: {
            command: String,
        },
        InvalidUserAuth: {
            user: String,
        },
        InvalidDrivePath: {
            path: String,
        },
        InvalidModule: {
            module: String,
        },
        NotDownloadable: {
            name: String,
        },
        InvalidRange: {
            range: String,
            size: Number,
        },
    },
};

const ctxDemo = {
    $node: {
        $path: String,
        $config:
            Object |
            {
                x_module: String,
                x_desc: String,
                x_hidden: Array,
                x_pass: String,
            },
        $module: Object | undefined,
        $cache: Object,
    },
    $data: {
        command: String,
        page: String | undefined,
        path: String,
        useCache: Boolean,
        name: String | undefined,
        path2: String | undefined,
        content: String | Buffer,
        mime: String | undefined,
        fileInfo: Object | undefined,
    },
    state: {
        cmd: String,
        p1: String,
        p2: String,
    },
};
