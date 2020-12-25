const path = require('path');
module.exports = {
    target: 'webworker',
    entry: './lib/starters/cf-worker.js',
    mode: 'production',
    node: {
        fs: 'empty',
    },
    module: {
        rules: [
            {
                test: /\.art$/,
                loader: 'art-template-loader',
                options: {
                    htmlResourceRoot: __dirname,
                    root: path.resolve(__dirname),
                },
            },
        ],
    },
};
