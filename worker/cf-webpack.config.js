module.exports = {
    target: 'webworker',
    entry: './lib/starters/cf-worker.js',
    mode: 'production',
    node: {
        fs: 'empty',
    }
};
