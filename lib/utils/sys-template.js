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
