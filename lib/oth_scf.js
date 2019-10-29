const fs = require("fs");
const { Msg_file, Msg_info, Msg_list, formatSize, formatDate, getExtByName, urlSpCharEncode } = require('../function').funcs;


exports.OTH_SCF = async (spConfig, cache, p2, query, body) => {
    let rpath = p2;
    let content = [];
    return new Promise((resolve,reject) => {
        fs.stat(rpath, (err, stats) => {
            if (err) resolve(Msg_info(404, "Not Found"));
            console.log(stats.isFile());
            console.log(stats.isDirectory());
            console.log(stats.isBlockDevice());
            console.log(stats.isCharacterDevice());
            console.log(stats);
            if (stats.isDirectory()) {
                console.log("查看" + rpath + "目录");
                fs.readdir(rpath,  (err, files)=> {
                    if (err) Msg_info(500, "something wrong");
                    if (!rpath.endsWith('/')) rpath += '/';
                    //files.length @暂不支持下一页
                    let len = files.length;
                    let counter = 0;
                    files.forEach( (file)=> {
                        console.log(rpath + file);
                        fs.stat(rpath + file, (err, st) => {
                            if (err) resolve(Msg_info(404, "Not Found"));
                            let nodeData = {
                                nodeType: 0,//type: 0_file 
                                name: file,//文件名
                                fileType: getExtByName(file),//文件类型，不带点
                                url_p2: rpath + file,//以p2为基准的根目录
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
                            if(counter===len)resolve(Msg_list(content));
                        });
                    });
                });
            } else if (stats.isFile()) {
                let tname = rpath.slice(rpath.lastIndexOf('/') + 1);
                let fileInfo = {
                    downloadUrl: "rpath?download&",
                    nodeType: 0,//type: 0_file 
                    name: tname,//文件名
                    fileType: getExtByName(tname),//文件类型，不带点
                    url_p2: rpath,//以p2为基准的根目录
                    size: formatSize(stats.size),//文件大小xx.xx MB, 保留两位小数，中间空格不可少
                    modified: formatDate(stats.ctime),//最近修改日期，固定格式
                    otherInfo: {}//此项不用，留给开发者存放其他信息 可为 undefined
                };
                resolve(Msg_file(fileInfo));
            } else {
                resolve(Msg_info(403, "403"));
            }
        });
    });
}


