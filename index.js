const process = require('process');
const { main_handler: main_scf } = require('./bin/index_scf');

module.exports = require('./bin/main');
module.exports.main_handler = async (event, context, callback) => {
    if (process.env['USER'] === 'qcloud') return await main_scf(event, context, callback);
    else throw "unknown env";
}