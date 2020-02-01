const process = require('process');
const { main_handler: main_scf } = require('./bin/index_scf');
const azure = require('./bin/index_azure');

exports.main_handler = async (event, context, callback) => {
    if (process.env['USER'] === 'qcloud') return await main_scf(event, context, callback);
    else throw "unknown env";
}
if (process.env['AzureWebJobsStorage']) {
    module.exports = azure;
}else if (process.env['USER'] !== 'qcloud') require('./bin/index_node')();
