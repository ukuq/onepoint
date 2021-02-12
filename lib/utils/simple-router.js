const SimpleRouter = function () {
    this.routers = {
        GET: {},
        POST: {},
        DELETE: {},
        prefix: [],
        regex: [],
        default: () => {},
    };
};
SimpleRouter.prototype.add = function (m, p, f) {
    if (Array.isArray(m)) {
        m.forEach((e) => {
            this.routers[e][p] = f;
        });
    }
    if (typeof m === 'string') {
        this.routers[m][p] = f;
    }
};

SimpleRouter.prototype.get = function (p, f) {
    this.routers.GET[p] = f;
};
SimpleRouter.prototype.post = function (p, f) {
    this.routers.POST[p] = f;
};
SimpleRouter.prototype.delete = function (p, f) {
    this.routers.DELETE[p] = f;
};
SimpleRouter.prototype.setDefault = function (f) {
    this.routers.default = f;
};
SimpleRouter.prototype.regex = function (p, f) {
    this.routers.regex.push({ p, f });
};
SimpleRouter.prototype.prefix = function (p, f) {
    this.routers.prefix.push({ p, f });
};
SimpleRouter.prototype.handle = async function (ctx, next, path) {
    const m = ctx.request.method;
    if (this.routers[m] && this.routers[m][path]) {
        return this.routers[m][path](ctx);
    }
    const item = this.routers.regex.find(({ p }) => p.test(path));
    if (item) {
        return item.f(ctx, next, path);
    }

    const item1 = this.routers.prefix.find(({ p }) => path.startsWith(p));
    if (item1) {
        return item1.f(ctx, next, path.slice(item1.p.length));
    }
    return this.routers.default(ctx, next, path);
};

module.exports = SimpleRouter;
