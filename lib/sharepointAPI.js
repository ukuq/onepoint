'use strict';
const {
    axios
} = require('../utils/nodeutils');

class SharePoint {
    constructor(shareUrl) {
        this._shareUrl = shareUrl;
    }
    async init() {
        let shareUrl = this._shareUrl;
        let cache = SharePoint.ocache.find((e) => {
            return e._shareUrl === shareUrl;
        });
        if (!cache) {
            let shareUrlReg = /https:\/\/([^/]*)\/:f:\/g\/personal\/([^/]*)/.exec(shareUrl);
            if (!shareUrlReg[1] || !shareUrlReg[2]) throw new Error('shareurl is invalid');
            cache = {};
            cache._shareUrl = shareUrl;
            cache.origin = shareUrlReg[1];
            cache.account = shareUrlReg[2];
            cache.cookie = (await this.getCookie(shareUrl))['set-cookie'][0];
            SharePoint.ocache.push(cache);
        }
        this.cookie = cache['cookie'];
        this.origin = cache['origin'];
        this.account = cache['account'];
    }
    async getCookie(shareUrl) {
        let config = {
            maxRedirects: 0,
            validateStatus: function (status) {
                return status >= 200 && status < 400;
            },
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0",
                "Cookie": ""
            }
        };
        let res = (await axios.get(shareUrl, config)).headers;
        console.log('sharepoint cookie:' + res['set-cookie'][0]);
        return res;
    }

    async spListData(path) {
        let url = `https://${this.origin}/personal/${this.account}/_api/web/GetListUsingPath(DecodedUrl=@a1)/RenderListDataAsStream`;
        let config = {
            headers: {
                "accept": "application/json;odata=verbose",
                "accept-encoding": "gzip, deflate, br",//一般都是gzip
                "accept-language": "zh-CN",
                "cache-control": "no-cache",
                "content-type": "application/json;odata=verbose",
                "origin": 'https://' + this.origin,
                "pragma": "no-cache",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-serviceworker-strategy": "CacheFirst",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0",
                "Cookie": this.cookie
            },
            params: {
                '@a1': `'/personal/${this.account}/Documents'`,
                'RootFolder': `/personal/${this.account}/Documents${path}`,
                'TryNewExperienceSingle': 'TRUE'
            }
        };
        let data = {
            parameters: {
                ViewXml: '<View ><Query><OrderBy><FieldRef Name="LinkFilename" Ascending="true"></FieldRef></OrderBy></Query><ViewFields>\
<FieldRef Name="CurrentFolderSpItemUrl"/>\
<FieldRef Name="FileLeafRef"/>\
<FieldRef Name="FSObjType"/>\
<FieldRef Name="SMLastModifiedDate"/>\
<FieldRef Name="SMTotalFileStreamSize"/>\
<FieldRef Name="SMTotalFileCount"/>\
</ViewFields><RowLimit Paged="TRUE">200</RowLimit></View>',
                "__metadata": { "type": "SP.RenderListDataParameters" },
                "RenderOptions": 136967,
                "AllowMultipleValueFilterForTaxonomyFields": true,
                "AddRequiredFields": true
            }
        }
        let res = (await axios.post(url, data, config));
        return res.data;
    }
    async spGetItemInfo(spItemUrl) {
        let config = {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0",
                "Cookie": this.cookie
            }
        };
        let res = await axios.get(spItemUrl, config);
        //console.log(res.data);
        return res.data;
    }
}
SharePoint.ocache = [];

exports.SharePoint = SharePoint;