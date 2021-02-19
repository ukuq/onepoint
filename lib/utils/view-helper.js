const op = require('../core/op');

class V {
    constructor(ctx) {
        this.ctx = ctx;
        this.request = ctx.request;
        this.response = ctx.response;
        this.site = op.config.site;
    }

    get navs() {
        let path = this.request.baseURL + '/';
        const arr = [{href: path, name: 'root'}];
        this.request.path
            .split('/')
            .filter((e) => e)
            .forEach((e) => {
                path += encodeURI(e) + '/';
                arr.push({href: path, name: e});
            });
        if (this.response.isFile) {
            arr[arr.length - 1].href = arr[arr.length - 1].href.slice(0, -1);
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
        return '?page=' + this.response.data.prevToken;
    }

    get hasParent() {
        return this.request.path !== '/';
    }

    get hasNext() {
        return this.response.data.nextToken;
    }

    get nextHref() {
        return '?page=' + this.response.data.nextToken;
    }

    get isEmpty() {
        return this.response.data.list.length === 0;
    }

    previewHref(e) {
        if (e.type === 0) {
            return `${e.name}?preview${e.id ? '&id=' + encodeURIComponent(e.id) : ''}`;
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
        if (m.endsWith('.pdf')) {
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

    encodeURIComponent(u) {
        return encodeURIComponent(u);
    }
}

module.exports = V;
