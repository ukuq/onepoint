const fs = require("fs");
const { Msg_file, Msg_info, Msg_list, formatSize, formatDate, getExtByName, urlSpCharEncode } = require('../bin/util').tool_funcs;

exports.func = async (spConfig, cache, event) => {
    let p2 = event.splitPath.p2;
    return new Promise((resolve) => {
        fs.stat(p2, (err, stats) => {
            if (err) {
                resolve(Msg_info(403, "403"));
                return;
            }
            let p2_encode = urlSpCharEncode(p2);
            //console.log(stats);
            if (stats.isDirectory()) {
                console.log("查看" + p2 + "目录");
                fs.readdir(p2, (err, files) => {
                    if (err) {
                        resolve(Msg_info(500, "something wrong"));
                        return;
                    }
                    if (!p2.endsWith('/')) {
                        p2 += '/';
                        p2_encode += '/';
                    }
                    //files.length @暂不支持下一页
                    let len = files.length;
                    if (len === 0) resolve(Msg_list([]))
                    let counter = 0;
                    let content = [];
                    files.forEach((file) => {
                        fs.stat(p2 + file, (err, st) => {
                            if (err) resolve(Msg_info(500, "500 something wrong"));
                            let nodeData = {
                                nodeType: 0,//type: 0_file 
                                name: file,//文件名
                                fileType: getExtByName(file),//文件类型，不带点
                                url_p2: p2_encode + file,//以p2为基准的根目录
                                size: formatSize(st.size),//文件大小xx.xx MB, 保留两位小数，中间空格不可少
                                modified: formatDate(st.ctime),//最近修改日期，固定格式
                                otherInfo: {}//此项不用，留给开发者存放其他信息 可为 undefined
                            };
                            if (st.isDirectory()) {
                                nodeData.nodeType = 1;
                                nodeData.url_p2 += '/';
                            }
                            content.push(nodeData);
                            counter++;
                            if (counter === len) resolve(Msg_list(content));
                        });
                    });
                });
            } else if (stats.isFile()) {
                let tname = p2.slice(p2.lastIndexOf('/') + 1);
                let fileInfo = {
                    downloadUrl: "//none",
                    nodeType: 0,//type: 0_file 
                    name: tname,//文件名
                    fileType: getExtByName(tname),//文件类型，不带点
                    url_p2: p2_encode,//以p2为基准的根目录
                    size: formatSize(stats.size),//文件大小xx.xx MB, 保留两位小数，中间空格不可少
                    modified: formatDate(stats.ctime),//最近修改日期，固定格式
                    otherInfo: {}//此项不用，留给开发者存放其他信息 可为 undefined
                };
                resolve(Msg_file(fileInfo));
            } else {
                resolve(Msg_info(403, "403 设备文件"));
            }
        });
    });
}
//exports.func({},{},'/');

