const logger = require('../utils/logger');
const op = require('../core/op');
const { PAGE_SIGN_LEN, PAGE_SIZE } = require('../conf/sys-config');

function signPage(p2, page) {
    return page + op.sign(p2 + page, Math.floor(Math.random() * 78840) + 8760, PAGE_SIGN_LEN);
}

function verifyPage(p2, page, ctx) {
    const oPage = page.slice(0, page.length - PAGE_SIGN_LEN);
    if (oPage && op.verify(p2 + oPage, page.slice(page.length - PAGE_SIGN_LEN), PAGE_SIGN_LEN)) {
        ctx.$data.page = oPage;
    } else {
        ctx.throw(403, 'InvalidPage', { page });
    }
}

/**
 * @errors [InvalidPage]
 */
module.exports = async (ctx, next) => {
    const page = ctx.request.query.page;
    let i_page;
    if (ctx.state.p2.endsWith('/') && page) {
        if (Number(page)) {
            i_page = Number(page);
            logger.log('page:' + i_page);
        } else {
            // verify page
            verifyPage(ctx.state.p2, page, ctx);
        }
    }
    await next();
    if (ctx.response.isList) {
        const data = ctx.response.data;
        // page
        if (ctx.state.useCache && !ctx.$data.page && !data.nextToken && data.list.length > PAGE_SIZE) {
            const len = data.list.length;
            const page = i_page || 1;
            data.list = data.list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
            if (page > 1) {
                data.prevToken = page - 1;
            }
            if (len > page * PAGE_SIZE) {
                data.nextToken = page + 1;
            }
        } else if (data.nextToken) {
            data.nextToken = signPage(ctx.state.p2, data.nextToken);
        }
    }
};
