'use strict';
const { Msg_file, Msg_info, Msg_list, Msg_301, Msg_html, formatSize, formatDate, getExtByName, urlSpCharEncode, getmd5 } = require('../bin/util').tool_funcs;
const https = require("https");
const querystring = require("querystring");
const url = require('url');

/**
 * onepoint ukuq
 * time:191120
 * sp:图床功能
 * 优化缓存机制,预缓存,打开速度更快
 */
const spConfig_example = {
	refresh_token: "OAQABAAAAAACQN9QBRU3jT6bcBQLZNUj7qYv3YSeiMsEu9BaICGzevCs5Fh8UDBFaDp0DdAA_vse2HYPIjcTS27BJb_Vh_FBj6gXv7Xf37SpLyiw6I8GMofyMUM7PpjbJdIuaA7QRunZKijQxEGSDnLPj-GoVrlnMlsyxRgYptnNuciTxRLiwzO67B-_TxAdU5RTyhLSVhSOORYmTDfrZolR5KtIVvqMztUAs1-kMUZAXOEiqBBHO_arzD3Z35yAocoXsiBi1-NdNGz9agVYLzOhnV3xzwIp_3FLkQbXom4tJpLQCtsR-g_1izairu2JALzYq0rDDhL1w225YJi0yS93Fq96tfwJDtgshe8et0q9YMIRxwaW5eK1mDJBQkmJGgm39AGjRmNW2SNiZPdgqIapi6cJzVqnB-a-ctp6mW4p4o_p8kgMhFJGSdAOR_RT6J0zsBt1dbVyvO_xaeh0jkPi6v0N_Frku3uYWPvpSEjQ3e-F8GWmN3Wr9QGNHLwAVVNRL3urvLKXmRZ-yVZfE1xlqys4loqBrg50kcUOWeWhG-60PaO1hTQgxL28mnNc02QZHGBP3Y_72HsTJZWRneVFh-L6N7kwaktoIV6yxC7ocnW6rHpWPW5efujc9U-ZYaTwUaevYC7SOVdA-LnnTw-ydGtNLghM5jTaQR8k6-mgo0v7gi32yzoNDHhFQeKJptBlyb9vdzviFfJMtkZj3-uQy1kHtDAs6cfwOPUlENnRhIpWvxqFxYfkBKvhtWBOm4C_MJdDuHc9SojLkOByI5lwrFU7FAmI-IAA",
	oauth: 0,//当前支持0
	img_path: '/images/',
	base_path: ''
}

let refresh_token, oauth, img_path, base_path;

let access_token;

const oauths = [// 0 默认（支持商业版与个人版）
	{
		client_id: '72f58ae2-35b3-49a0-bfdf-93c293711a3f',
		client_secret: 'QxTp=iw[=zHA[F0ZT97M1I.JUXD2RWhq',
		oauth_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/',
		api_url: 'https://graph.microsoft.com/v1.0/me/drive/root',
		scope: 'https://graph.microsoft.com/Files.ReadWrite.All offline_access'
	}
];



function get_children_by_path(p2) {
	let turl = url.parse(oauth['api_url'] + ':' + ((base_path + p2 === '/') ? '' : base_path + p2) + '?expand=children(select=name,size,file,folder,lastModifiedDateTime,@microsoft.graph.downloadUrl)');
	return new Promise((resolve) => {
		const req = https.request({ method: "get", hostname: turl.hostname, path: turl.path, headers: { 'Authorization': 'Bearer ' + access_token } },
			(res) => {
				console.log(`get data from graph: ${res.statusCode}`);//默认utf8
				if (res.statusCode === 200) {
					let data = "";
					res.on('data', (chunk) => {
						data += chunk;
					});
					res.on('end', () => {
						let data_json = JSON.parse(data);
						if (data_json.children !== undefined) {//文件夹
							let content = [];
							if (!p2.endsWith('/')) p2 += '/';
							let p2_encode = urlSpCharEncode(p2);
							data_json.children.forEach(e => {
								let nodeData = {
									downloadUrl: e['@microsoft.graph.downloadUrl'],
									nodeType: 0,
									name: e['name'],//文件名
									fileType: getExtByName(e['name']),//文件类型，不带点
									url_p2: p2_encode + urlSpCharEncode(e['name']),//以p2为基准的根目录
									size: formatSize(e['size']) || 'x items',//文件大小xx.xx MB, 保留两位小数，中间空格不可少
									modified: formatDate(e['lastModifiedDateTime']),//最近修改日期，固定格式
								};
								if (e['file'] === undefined) {//文件夹
									nodeData.nodeType = 1;
									nodeData.url_p2 += '/';
								}
								content.push(nodeData);
							});
							resolve(Msg_list(content));
						} else {//文件
							resolve(Msg_file({
								downloadUrl: data_json['@microsoft.graph.downloadUrl'],
								nodeType: 0,//type: 0_file 
								name: data_json['name'],//文件名
								fileType: getExtByName(data_json['name']),//文件类型，不带点
								url_p2: urlSpCharEncode(p2),//以p2为基准的根目录
								size: formatSize(data_json['size']),//文件大小xx.xx MB, 保留两位小数，中间空格不可少
								modified: formatDate(data_json['fileSystemInfo']['lastModifiedDateTime']),//最近修改日期，固定格式
							}));
						}

					});
				} else if (res.statusCode === 404) {
					resolve(Msg_info(404, 'nothing found'));
				} else if (res.statusCode === 401) {// 这里返回403
					resolve(Msg_info(403, 'refresh_token is invalid'));
				} else throw "wrong at get_children_by_path:" + res.statusCode;
			});
		req.end();
	});
}

//传参较多,避免闭包对数据的影响
function get_children_by_path_async(p2, listCache, access_token, base_path, oauth) {
	let turl = url.parse(oauth['api_url'] + ':' + ((base_path + p2 === '/') ? '' : base_path + p2) + '?expand=children(select=name,size,file,folder,lastModifiedDateTime,@microsoft.graph.downloadUrl)');
	const req = https.request({ method: "get", hostname: turl.hostname, path: turl.path, headers: { 'Authorization': 'Bearer ' + access_token } },
		(res) => {
			console.log(`async response ${p2}: ${res.statusCode}`);//默认utf8
			if (res.statusCode === 200) {
				let data = "";
				res.on('data', (chunk) => {
					data += chunk;
				});
				res.on('end', () => {
					let data_json = JSON.parse(data);
					if (data_json.children !== undefined) {//文件夹
						let content = [];
						if (!p2.endsWith('/')) p2 += '/';
						let p2_encode = urlSpCharEncode(p2);
						data_json.children.forEach(e => {
							let nodeData = {
								downloadUrl: e['@microsoft.graph.downloadUrl'],
								nodeType: 0,
								name: e['name'],//文件名
								fileType: getExtByName(e['name']),//文件类型，不带点
								url_p2: p2_encode + urlSpCharEncode(e['name']),//以p2为基准的根目录
								size: formatSize(e['size']) || 'x items',//文件大小xx.xx MB, 保留两位小数，中间空格不可少
								modified: formatDate(e['lastModifiedDateTime']),//最近修改日期，固定格式
							};
							if (e['file'] === undefined) {//文件夹
								nodeData.nodeType = 1;
								nodeData.url_p2 += '/';
								if (!listCache[nodeData.url_p2]) {
									get_children_by_path_async(nodeData.url_p2, listCache, access_token, base_path, oauth);
								}
							}
							content.push(nodeData);
						});
						listCache[p2] = Msg_list(content).data;
					}
				});
			}
		});
	req.end();
}


/**
 * 
 * @param {*} guest_upload_filebuffer Buffer < 2M 
 * @param {*} guest_upload_filename 
 */
function put_content_img(guest_upload_filebuffer, guest_upload_filename) {
	if (guest_upload_filebuffer.length > 2097152) {//1024*1024*2 2M
		console.log('too big');
		return;
	}
	let upload_filename = getmd5(guest_upload_filename) + new Date().getMilliseconds() + '.' + getExtByName(guest_upload_filename);
	let turl = url.parse(oauth['api_url'] + ':' + img_path + upload_filename + ':/content');
	return new Promise((resolve) => {
		const req = https.request({ method: "PUT", hostname: turl.hostname, path: turl.path, headers: { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'text/plain' } },
			(res) => {
				console.log(`Got response: ${res.statusCode}`);//默认utf8
				let data = "";
				res.on('data', (chunk) => {
					data += chunk;
				});
				res.on('end', () => {
					console.log(JSON.parse(data));
					resolve({ statusCode: res.statusCode, upload_filename });
				});
			});
		req.write(guest_upload_filebuffer);
		req.end();
	});
}


function getAccesstoken() {
	let post_data = querystring.stringify({
		client_id: oauth['client_id'],
		client_secret: oauth['client_secret'],
		grant_type: 'refresh_token',
		requested_token_use: 'on_behalf_of',
		refresh_token: refresh_token
	});
	let turl = url.parse(oauth['oauth_url'] + 'token');
	return new Promise((resolve) => {
		const req = https.request({ method: "post", hostname: turl.hostname, path: turl.path, headers: { 'Content-length': post_data.length, 'Content-Type': 'application/x-www-form-urlencoded' } },
			(res) => {
				console.log(`getAccesstoken response: ${res.statusCode}`);//默认utf8
				let res_data = "";
				res.on('data', (chunk) => {
					res_data += chunk;
				});
				res.on('end', () => {
					console.log(JSON.parse(res_data)['access_token']);
					resolve(JSON.parse(res_data)['access_token']);
				});
			});
		req.write(post_data);
		req.end();
	});
}

exports.func = async (spConfig, cache, event) => {
	//'OAQABAAAAAACQN9QBRU3jT6bcBQLZNUj79oJI_wwdFixgvUHs1-SBzILatY03n_t2SWtbLp_JTVmiqPD5PYIfiIcQF4CwnG8sVgefZAMaRJuscXM80bGkhKEMND_GRzQqRXl7AxQMifcGNpJAlIBsh6GsMxXa90C9X_aTfmS2Lf8mFdXBRqnVO6xThcqivqlGflMPxO0zRe0gP1pjR55lcO5nFUc_IlOdfbJvyg0MRjoXNyqjOxiM1oQ9gzQC9bOoGtwZoPuVxtNpPI6_HbxffftO6rQL7RekyLylwz1neZXUTKsj76QiS-k0TQu_52FSNoVRAmlA3U7Py-6MENdFAfvfKXp9UmrTQiZvEH210qFGEx0NO_bdo_Du7mC8JWWxkCcRj5NpOgC0Q-n8cy3xMRcUIBMCtQbHrhKCXJa0t9UuhT1_J_Uctd3kL0akfNGsEA-L_POs18DraIEeEpncFEwEsMqQ3lliyJ2DWq3_LiFjAImUdsE6hv-3rOk0fGLCzx-2vyNYt6RIP-_4kOt3T1DR3MFL1vwe_FkwGMnWQLRiwP4M6ad5Eiuss97EaB-GKhQWu88TOq5cKoGWd-pFRMM2ZCzaiRNrr5cqXhkTls3nnSibSMKizgyDEZigakvmPwqTO51TGl-hk-Khj6JVOyX6Fd2LjFyYLbyl_RWqJWML_AW9ALfgN5qgGfiVNOuJuFllH_LdkbNsrk69UW6suE0xYREY2yue1-lyZQ_9CBBVBEjOtfhpZaSXfypIGD6Xoyojx9Rr2K6u35RULT1ghHRYoVNh4-caIAA';
	refresh_token = spConfig['refresh_token'];
	oauth = oauths[spConfig['oauth']];
	img_path = spConfig['img_path'];
	base_path = spConfig['base_path'] || '';

	let p2 = event.splitPath.p2;
	let req_body_json = event.body;
	let do_async = false;
	if (!cache['access_token'] || cache['expired_time'] < new Date().valueOf()) {//保证 token 有效
		console.log('access_token is expired, try to get a new one');
		cache['expired_time'] = new Date().valueOf() + 3600000// 3600 * 1000
		cache['access_token'] = await getAccesstoken();
		cache['listCache'] = {};
		do_async = true;
	}
	access_token = cache['access_token'];

	if (img_path && p2.startsWith(img_path)) {
		if (p2 === img_path) {//图床上传
			if (event.method === 'POST' && req_body_json['guest_upload_filebase64']) {
				let upload_match = req_body_json['guest_upload_filebase64'].match(/^data:image\/(\w+);base64,(.+)$/);
				let { statusCode, upload_filename } = await put_content_img(Buffer.from(upload_match[2], 'base64'), new Date().toISOString() + '.' + upload_match[1]);
				if (statusCode !== 201) return Msg_info(403, '未知原因,上传失败');
				return Msg_301(event.splitPath.p_h01 + img_path + upload_filename + '?preview&refresh');
			} else {
				return Msg_html(200, img_html);
			}
		} else if (p2.indexOf('/', img_path.length) !== -1) {//包含路径
			return Msg_301(event.splitPath.p_h01 + img_path);
		}
	}

	if (!event.query['refresh']) {
		if (cache['listCache'][p2]) {//有缓存
			if (cache['listCache'][p2].content !== undefined) {//文件
				return Msg_list(cache['listCache'][p2].content);
			} else return Msg_file(cache['listCache'][p2].fileInfo);
		}
		let parent = p2.slice(0, p2.lastIndexOf('/') + 1);
		if (cache['listCache'][parent]) {//父目录已缓存
			let parent_content = cache['listCache'][parent].content;
			let len = parent_content.length;
			let child_name = p2.slice(p2.lastIndexOf('/') + 1);
			let i;
			for (i = 0; i < len; i++) {
				if (parent_content[i].name === child_name) {
					if (parent_content[i].nodeType !== 0) break;
					else return Msg_file(parent_content[i]);
				}
			}
			if (i === len) return Msg_info(404, "Not Found");
		}
	}

	let res = await get_children_by_path(p2);
	if (res.statusCode === 200) cache['listCache'][p2] = res.data;
	else if (res.statusCode === 403) cache['access_token'] = undefined;
	if (do_async) get_children_by_path_async('/', cache['listCache'], access_token, base_path, oauth);
	return res;
}

const img_html = `<html>

<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0,maximum-scale=1.0, user-scalable=no">
	<title>OnePoint for image</title>
	<link rel="stylesheet" href="https://cdn.bootcss.com/mdui/0.4.3/css/mdui.min.css">
	<style>
		body {
			background-color: #f2f5fa;
			padding-bottom: 60px;
			background-position: center bottom;
			background-repeat: no-repeat;
			background-attachment: fixed
		}

		.nexmoe-item {
			margin: 20px -8px 0 !important;
			padding: 15px !important;
			border-radius: 5px;
			background-color: #fff;
			-webkit-box-shadow: 0 .5em 3em rgba(161, 177, 204, .4);
			box-shadow: 0 .5em 3em rgba(161, 177, 204, .4);
			background-color: #fff
		}

		.mdui-img-fluid,
		.mdui-video-fluid {
			border-radius: 5px;
			border: 1px solid #eee
		}

		.mdui-list {
			padding: 0
		}

		.mdui-list-item {
			margin: 0 !important;
			border-radius: 5px;
			padding: 0 10px 0 5px !important;
			border: 1px solid #eee;
			margin-bottom: 10px !important
		}

		.mdui-list-item:last-child {
			margin-bottom: 0 !important
		}

		.mdui-list-item:first-child {
			border: none
		}

		.mdui-toolbar {
			width: auto;
			margin-top: 60px !important
		}

		.mdui-appbar .mdui-toolbar {
			height: 56px;
			font-size: 16px
		}

		.mdui-toolbar>* {
			padding: 0 6px;
			margin: 0 2px;
			opacity: .5
		}

		.mdui-toolbar>.mdui-typo-headline {
			padding: 0 16px 0 0
		}

		.mdui-toolbar>i {
			padding: 0
		}

		.mdui-toolbar>a:hover,
		a.mdui-typo-headline,
		a.active {
			opacity: 1
		}

		.mdui-container {
			max-width: 980px
		}

		.mdui-list>.th {
			background-color: initial
		}

		.mdui-list-item>a {
			width: 100%;
			line-height: 48px
		}

		.mdui-toolbar>a {
			padding: 0 16px;
			line-height: 30px;
			border-radius: 30px;
			border: 1px solid #eee
		}

		.mdui-toolbar>a:last-child {
			opacity: 1;
			background-color: #1e89f2;
			color: #ffff
		}

		@media screen and (max-width:980px) {
			.mdui-list-item .mdui-text-right {
				display: none
			}

			.mdui-container {
				width: 100% !important;
				margin: 0
			}

			.mdui-toolbar>* {
				display: none
			}

			.mdui-toolbar>a:last-child,
			.mdui-toolbar>.mdui-typo-headline,
			.mdui-toolbar>i:first-child {
				display: block
			}
		}
	</style>
</head>

<body class="mdui-theme-primary-blue-grey mdui-theme-accent-blue mdui-loaded">

	<div class="mdui-container">
		<div class="mdui-container-fluid">
			<div class="mdui-toolbar nexmoe-item">
				<a href="https://github.com/ukuq/onepoint">OnePoint</a>
			</div>
		</div>
		<div class="mdui-container-fluid">

			<div class="nexmoe-item">

				<form method="post" action="">
					<p>图片预览：</p>
					<p></p>
					<div id="image-preview"
						style="border: 1px solid rgb(204, 204, 204); width: 100%; height: 200px; background-size: contain; background-repeat: no-repeat; background-position: center center;">
					</div>
					<p></p>
					<p>
						<input type="hidden" id="file64" name="guest_upload_filebase64">
						<input type="file" id="image-file" name="guest_upload_filename">
						<input type="submit" class="mdui-btn mdui-btn-block mdui-color-theme-accent mdui-ripple"
							value="上传">
					</p>
					<p id="file-info">没有选择文件</p>
				</form>
				<script>
					let
						fileInput = document.getElementById('image-file'),
						info = document.getElementById('file-info'),
						preview = document.getElementById('image-preview');
					// 监听change事件:
					fileInput.addEventListener('change', function () {
						// 清除背景图片:
						preview.style.backgroundImage = '';
						// 检查文件是否选择:
						if (!fileInput.value) {
							info.innerHTML = '没有选择文件';
							return;
						}
						// 获取File引用:
						let file = fileInput.files[0];
						// 获取File信息:
						info.innerHTML = 'name: ' + file.name + '<br>size: ' + file.size + '<br>date: ' + file
							.lastModifiedDate;
						if (!file.type || !file.type.startsWith('image/')) {
							alert(file.type + ':不是有效的图片文件!');
							return;
						}
						// 读取文件:
						let reader = new FileReader();
						reader.onloadend = function (e) {
							let data = reader.result;
							preview.style.backgroundImage = 'url(' + data + ')';
							document.getElementById('file64').value = data;
						}
						reader.readAsDataURL(file);
					});
				</script>

			</div>

		</div>

	</div>


</body>

</html>`;