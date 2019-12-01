const { Msg_info, Msg_list } = require('../bin/util').tool_funcs;
const fs = require('fs');
const path = require('path');
exports.func = async (spConfig, cache, event) => {
    if (event.splitPath.p2 === '/') return Msg_list([], undefined, undefined, 2, fs.readFileSync(path.resolve(__dirname, '../README.md')));
    return Msg_info(404, 'Nothing:Just For Mount |-_-');
}