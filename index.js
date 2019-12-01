const process = require('process');
const { main_handler: main_scf } = require('./index_scf');

if (process.env['USER'] !== 'qcloud') require('./index_node');
exports.main_handler = async (event, context, callback) => {
    if (process.env['USER'] === 'qcloud') return main_scf(event, context, callback);
    else throw "unknown env";
}
