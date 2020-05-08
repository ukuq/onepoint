const { Msg } = require('../utils/msgutils');
const { ls } = require('./system_fs');

exports.func = async (spConfig, cache, event) => {
    let root = spConfig.root || '';
    let p2 = root + event.p2;
    switch (event.cmd) {
        case 'ls':
            return await ls(p2, event);
        default:
            return Msg.info(400, Msg.constants.No_such_command);
    }
}