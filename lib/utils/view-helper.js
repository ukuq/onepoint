const op = require('../core/op');

class V {
    constructor(ctx) {
        this.ctx = ctx;
        this.request = ctx.request;
        this.response = ctx.response;
        this.site = op.config.site;
    }

    get navs() {
        const path = this.request.path;
        const q = this.request.query;
        const arr = [{name: 'root'}];
        path.split('/')
            .filter((e) => e)
            .forEach((e) => {
                arr.push({name: e});
            });
        if (path.endsWith('/')) {
            let p = './';
            for (let i = arr.length - 1; i >= 0; i--) {
                arr[i].href = p;
                p += '../';
            }
            if (q.id) {
                arr[arr.length - 1].href += '?id=' + encodeURIComponent(q.id);
            }
        } else {
            arr[arr.length - 1].href = (q.preview !== undefined ? '?preview' : '?') + this.appendReqQueryID;
            let p = './';
            for (let i = arr.length - 2; i >= 0; i--) {
                arr[i].href = p;
                p += '../';
            }
        }
        return arr;
    }

    get list() {
        return this.response.data.list;
    }

    get hasPrev() {
        return this.response.data.prevToken;
    }

    get prevHref() {
        return '?page=' + encodeURIComponent(this.response.data.prevToken) + this.appendReqQueryID;
    }

    get hasParent() {
        return this.request.path !== '/';
    }

    get hasNext() {
        return this.response.data.nextToken;
    }

    get nextHref() {
        return '?page=' + encodeURIComponent(this.response.data.nextToken) + this.appendReqQueryID;
    }

    get appendReqQueryID() {
        const id = this.request.query.id;
        return id ? '&id=' + encodeURIComponent(id) : '';
    }

    get isEmpty() {
        return this.response.data.list.length === 0;
    }

    previewHref(e, p = true) {
        if (e.type === 0) {
            return `${e.name}${e.id ? '?id=' + encodeURIComponent(e.id) : ''}${p ? (e.id ? '&preview' : '?preview') : ''}`;
        } else {
            return `${e.name}/${e.id ? '?id=' + encodeURIComponent(e.id) : ''}`;
        }
    }

    get file() {
        return this.response.data.file;
    }

    get previewType() {
        const f = this.file;
        const m = f.mime;
        if (m.startsWith('image/')) {
            return 'image';
        }
        if (m.startsWith('video/')) {
            return 'video';
        }
        if (m.startsWith('audio/')) {
            return 'audio';
        }
        if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'mpp', 'rtf', 'vsd', 'vsdx'].includes(f.name.slice(f.name.lastIndexOf('.') + 1))) {
            return 'office';
        }
        if (m.endsWith('pdf')) {
            return 'pdf';
        }
        if (f.size < 16 * 1024) {
            return 'text';
        }
        if (m.startsWith('text')) {
            return 'bigText';
        }
        return '';
    }

    // @warning 考虑放弃proxy功能
    get downloadUrl() {
        return (this.request.cookies.PROXY_DOWN || '') + this.response.data.file.url;
    }

    get hasPassword() {
        return this.response.data.error === 'Unauthorized';
    }

    get passwordHint() {
        const {type, field} = this.response.data.data;
        return field + ' ' + type;
    }

    get jsonData() {
        return JSON.stringify(this.response.data, null, 2);
    }

    get readme() {
        return ((this.ctx.$node || {}).$config || {}).readme || op.config.site.readme;
    }

    get readmeUrl() {
        return this.response.isList && this.response.data.list.find((e) => e.name === 'README.md') ? 'README.md' : '';
    }

    get cacheTime() {
        return this.response.data.cached;
    }

    get refreshHref() {
        const q = this.request.query;
        return '?refresh' + (q.preview === undefined ? '' : '&preview') + this.appendReqQueryID + (q.page ? ('&page=' + q.page) : '');
    }

    encodeURIComponent(u) {
        return encodeURIComponent(u);
    }
}

module.exports = V;
