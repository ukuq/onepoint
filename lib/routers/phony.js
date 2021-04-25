const { _P } = require('../utils/node');
module.exports = {
    get params() {
        return [_P('nothing', '', '文件挂载专用，可用于补充挂载文件，请不要填写此选项', 7, '', false, false)];
    },
    async handle(_, data, cache, ctx) {
        return this[data.command](data, cache, ctx);
    },
    async ls({ path }, _, ctx) {
        ctx.assert(path === '/', 404, 'ItemNotExist');
        ctx.respondList([]);
    },
};
