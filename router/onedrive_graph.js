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
		//console.log(error);
		if (error.response && error.response.status === 404) return Msg.info(404);
		else return Msg.info(500, "onedrive:ls");
	}
}

exports.func = async (spConfig, cache, event) => {
	onedrive = new OneDrive(spConfig['refresh_token'], spConfig['oauth']);
	try {
		await onedrive.init();
	} catch (error) {
		return Msg.info(500, "onedrive init failed");
	}
	let p2 = (spConfig.root || '') + event.splitPath.p2;
	if (event.cmd === 'ls') return await ls(p2);
	return Msg.info(500, "No such cmd");
}