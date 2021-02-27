const e = {
    ItemNotExist({ path }) {
        return `文件(夹)${path || '?'}不存在`;
    },
    Unauthorized({ field, type }) {
        let s = '';
        if (type === 'empty') {
            s = '为空,请输入后重试';
        } else if (type === 'invalid') {
            s = '已过期或不合法,请重新认证';
        } else if (type === 'wrong') {
            s = '有误,请重新输入';
        }
        return `字段${field}${s}`;
    },
    CommandNotAllowed({ command }) {
        return `暂不支持${command}命令`;
    },
    DriveNotExist({ path }) {
        return `路径${path}下未配置云盘`;
    },
    ModuleNotExist({ module }) {
        return `模块${module}不存在`;
    },
    InvalidPage({ page }) {
        return `分页参数${page}不合法`;
    },
    ItemIsFile({ path }) {
        return `路径${path || '?'}对应一个文件,请注意path格式`;
    },
    ConfigError({ fields }) {
        return `参数配置有误,请注意一下这些参数[${fields.toString()}]`;
    },
    ModuleError({ msg }) {
        return `模块内部发生了错误,${msg || '?'}`;
    },
    default(type) {
        return `发生错误${type || '?'}`;
    },
};

module.exports.parseErrorMsg = function (type, data) {
    return e[type] ? e[type](data) : e.default(type);
};
