const { axios } = require('../utils/nodeutils');
axios.defaults.proxy = {
    host: '127.0.0.1',
    port: 8899
}