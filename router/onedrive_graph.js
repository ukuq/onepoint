'use strict';
const { Msg } = require('../utils/msgutils');
const { OneDrive } = require('../lib/onedriveAPI');

let onedrive;
let _cache;
let mconfig;

exports.ls = ls;
async function ls(path, skiptoken) {
	try {
		if (!path.endsWith('/')) {//处理文件情况
			let data = await onedrive.msGetItemInfo(path);
			return Msg.file({
				type: 0,
				name: data['name'],
				size: data['size'],
				mime: data['file']['mimeType'],//@info 暂时不处理目录不规范的情况,直接throw
				time: data['lastModifiedDateTime']
			}, data['@microsoft.graph.downloadUrl']);
		}
		if (path !== '/') path = path.slice(0, -1);
		let params = {
			//$top: 50
		};
		if (skiptoken && /\w*/.exec(skiptoken)) params.$skiptoken = skiptoken;
		let data = await onedrive.msGetDriveItems(path, params);
		let content = [];
		data.value.forEach(e => {
			content.push({
				type: e['file'] ? 0 : 1,
				name: e['name'],
				size: e['size'],
				mime: e['file'] ? e['file']['mimeType'] : 'folder/onedrive',
				time: e['lastModifiedDateTime']
			});
		});
		let msg = Msg.list(content);
		if (data['@odata.nextLink']) msg.data.nextHrefToken = /skiptoken=(\w*)/.exec(data['@odata.nextLink'])[1];
		return msg;
	} catch (error) {
		if (error.response && error.response.status === 404) return Msg.info(404);
		else throw error;
	}
}


exports.find = find;
async function find(text) {
	let data = await onedrive.msSearch(text);
	if (data.value.length === 0) return Msg.list([]);
	let reg = new RegExp('.+/Documents' + (mconfig.root || '') + '/(.+)');
	let content = [];
	data.value.forEach((e) => {
		let ma = reg.exec(e.webUrl);
		if (!ma || !ma[1]) return;
		content.push({
			type: e['file'] ? 0 : 1,
			name: ma[1],
			size: e['size'],
			mime: e['file'] ? e['file']['mimeType'] : 'folder/onedrive',
			time: e['lastModifiedDateTime']
		});
	});
	return Msg.list(content);
}


exports.mkdir = mkdir;
async function mkdir(path, name) {
	await onedrive.msMkdir(path, name);
	return Msg.info(201);
}

exports.mv = mv;
async function mv(srcPath, desPath) {
	await onedrive.msMove(srcPath, desPath);
	return Msg.info(200);
}

exports.cp = cp;
async function cp(srcPath, desPath) {
	await onedrive.msCopy(srcPath, desPath);
	return Msg.info(200);
}

exports.rm = rm;
async function rm(path) {
	await onedrive.msDelete(path);
	return Msg.info(204);
}

exports.ren = ren;
async function ren(path, name) {
	await onedrive.msRename(path, name);
	return Msg.info(200);
}

exports.touch = touch;
async function touch(path, filename, content) {
	await onedrive.msUpload(path, filename, content);
	return Msg.info(201);
}

exports.upload = upload;
async function upload(filePath, fileSystemInfo) {
	let k = filePath + JSON.stringify(fileSystemInfo);
	if (_cache[k] && new Date(_cache[k].expirationDateTime) > new Date()) return Msg.info(200, JSON.stringify(_cache[k]));
	let res = await onedrive.msUploadSession(filePath, fileSystemInfo);
	_cache[k] = res;
	return Msg.json(200, res);
}

exports.func = async (spConfig, cache, event) => {
	_cache = cache;
	mconfig = spConfig;
	onedrive = new OneDrive(spConfig['refresh_token'], spConfig['oauth']);
	await onedrive.init();
	let root = spConfig.root || '';
	let p2 = root + event.p2;
	let cmdData = event.cmdData;
	switch (event.cmd) {
		case 'ls':
			return await ls(p2, event.spPage);
		case 'mkdir':
			return await mkdir(p2, cmdData.name);
		case 'mv':
			return await mv(p2, root + event.p2_des);
		case 'cp':
			return await cp(p2, root + event.p2_des);
		case 'rm':
			return await rm(p2);
		case 'ren':
			return await ren(p2, cmdData.name);
		case 'touch':
			return await touch(p2, cmdData.name, cmdData.content);
		case 'upload':
			return await upload(p2, cmdData.fileSystemInfo);
		case 'find':
			return await find(cmdData.text);
		default:
			return Msg.info(400, "No such cmd");
	}
}