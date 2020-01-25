'use strict';
const { Msg, formatDate } = require('../utils/msgutils');
const { OneDrive } = require('../lib/onedriveAPI');

let onedrive;

exports.ls = ls;
async function ls(path) {
	try {
		let data = await onedrive.msGetDriveItems(path);
		if (data.children !== undefined) {//文件夹
			let content = [];
			data.children.forEach(e => {
				content.push({
					type: e['file'] ? 0 : 1,
					name: e['name'],
					size: Number(e['size']),
					mime: e['file'] ? e['file']['mimeType'] : 'folder/onedrive',
					time: formatDate(e['lastModifiedDateTime'])
				});
			});
			return Msg.list(content);
		} else {//文件
			return Msg.file({
				type: 0,
				name: data['name'],
				size: Number(data['size']),
				mime: data['file']['mimeType'],
				time: formatDate(data['lastModifiedDateTime'])
			}, data['@microsoft.graph.downloadUrl']);
		}
	} catch (error) {
		if (error.response && error.response.status === 404) return Msg.info(404);
		else throw error;
	}
}


// exports.find = find;
// async function find(text) {
// 	await onedrive.msSearch(text);
//
// }


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
	return Msg.info(202);
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
	let res = await onedrive.msUploadSession(filePath, fileSystemInfo);
	return Msg.info(200, JSON.stringify(res));
}

exports.func = async (spConfig, cache, event) => {
	onedrive = new OneDrive(spConfig['refresh_token'], spConfig['oauth']);
	await onedrive.init();
	let root = spConfig.root || '';
	let p2 = root + event.splitPath.p2;
	switch (event.cmd) {
		case 'ls':
			return await ls(p2);
		case 'mkdir':
			return await mkdir(root + event.body.path, event.body.name);
		case 'mv':
			return await mv(root + event.body.srcPath, root + event.body.desPath);
		case 'cp':
			return await cp(root + event.body.srcPath, root + event.body.desPath);
		case 'rm':
			return await rm(root + event.body.path);
		case 'ren':
			return await ren(root + event.body.path, event.body.name);
		case 'touch':
			return await touch(root + event.body.path, event.body.name, event.body.content);
		case 'upload':
			return await upload(root + event.body.path, event.body.cmdData.fileSystemInfo);
		default:
			return Msg.info(400, "No such cmd");
	}
}