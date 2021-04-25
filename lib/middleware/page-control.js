const logger = require('../utils/logger');
const op = require('../core/op');
const { PAGE_SIGN_LEN } = require('../conf/sys-config');

function signPage(p2, page) {
    return page + op.sign(p2 + page, Math.floor(Math.random() * 78840) + 8760, PAGE_SIGN_LEN);
}

function verifyPage(p2, page, ctx) {
    const oPage = page.slice(0, page.length - PAGE_SIGN_LEN);
    if (oPage && op.verify(p2 + oPage, page.slice(page.length - PAGE_SIGN_LEN), PAGE_SIGN_LEN)) {
        ctx.$data.page = oPage;
        logger.log('page: ' + oPage);
    } else {
        ctx.throw(403, 'InvalidPage', { page });
    }
}

/**
 * @errors [InvalidPage]
 */
module.exports = async (ctx, next) => {
    const page = ctx.request.query.page;
    if (ctx.state.p2.endsWith('/') && page) {
        // verify page
        verifyPage(ctx.state.p2, page, ctx);
    }
    await next();
    if (ctx.response.isList) {
        const data = ctx.response.data;
        if (data.nextToken) {
            data.nextToken = signPage(ctx.state.p2, data.nextToken);
        }
    }
};
