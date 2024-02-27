import lzString from 'lz-string';
import { KEY_LIST } from '../constants-keys';
import { Store, useStore } from 'vuex';
import { getGroupManager } from '@utils/group/group-instance';
import AppConfig from '@src/constants';
import { removeCookie } from 'typescript-cookie';
import { getApiClient } from '@utils/api-client';
import { StoreState } from '@src/store/types';

export function getUuid(): string {
	let dt = new Date().getTime();
	const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (dt + Math.random() * 16) % 16 | 0;
		dt = Math.floor(dt / 16);
		return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
	});
	return uuid.replace(/-/gi, '').toLowerCase();
}

export function saveLocalData(key: string, val: string): void {
	const storage = window.localStorage;
	if (storage) {
		try {
			storage.setItem(key, lzString.compressToUTF16(val));
		} catch (e) {
			console.error('Storage Full ... clean old data...');
			for (const k in storage) {
				if (k.indexOf('DATA_MESSAGE_DETAIL_') > -1) {
					storage.removeItem(k);
				}
			}
			storage.setItem(key, lzString.compressToUTF16(val));
		}
	}
}

export function loadLocalData(key: string): string | null {
	const storage = window.localStorage;
	if (storage) {
		const keyValue = storage.getItem(key);
		if (keyValue) return lzString.decompressFromUTF16(keyValue);
	}
	return null;
}

export function removeLocalData(key: string): void {
	const storage = window.localStorage;
	if (storage) {
		storage.removeItem(key);
	}
}

export const dataURLtoBlob = function (dataURI: string) {
	let byteString;
	if (dataURI.split(',')[0].indexOf('base64') >= 0) byteString = atob(dataURI.split(',')[1]);
	else byteString = decodeURI(dataURI.split(',')[1]);
	const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
	const ia = new Uint8Array(byteString.length);
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	return new Blob([ia], { type: mimeString });
};

export function isUrl(url: string) {
	const pattern = new RegExp(
		'^((ft|htt)ps?:\\/\\/)?' + // protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
			'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
			'(\\:\\d+)?' + // port
			'(\\/[-a-z\\d%@_.~+&:]*)*' + // path
			'(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
			'(\\#[-a-z\\d_]*)?$',
		'i',
	); // fragment locator

	return pattern.test(url);
}

export const getUserData = () => {
	const data = loadLocalData('LUT');
	if (!data) return;
	return JSON.parse(data);
};

export const setUserData = (data: object) => {
	saveLocalData(KEY_LIST.CONST.LOGIN_USER, JSON.stringify(data));
};

export const parsedImgSrc = (profileInfo?: string): string | undefined => {
	try {
		if (profileInfo) {
			const parsed = JSON.parse(profileInfo);
			if (parsed) {
				return AppConfig.FILE_SERVER + parsed[0].savedName;
			}
		}
	} catch (e) {
		return undefined;
	}
};

export const doLogout = (store: Store<StoreState>) => {
	removeLocalData(KEY_LIST.CONST.LOGIN_USER);
	removeLocalData(KEY_LIST.CONST.LOGIN_KEEP);
	removeLocalData(KEY_LIST.CONST.LOGIN_TOKEN);
	removeCookie(KEY_LIST.CONST.LOGIN_TOKEN);
	getApiClient(AppConfig.API_URL, store).post('api/1/users/logout');
	window.appInterface.setUserName('');
};

export const getImgUrl = (v: any): string | null => {
	if (v) {
		try {
			const vo = JSON.parse(v);
			return AppConfig.FILE_SERVER + vo[0].savedName;
		} catch (e) {
			console.error(e);
		}
	}
	return null;
};

export const toNumber = (v: string | number) => {
	const num = Number(v);
	if (isNaN(num)) {
		return 0;
	}
	return num;
};

export const getNumberFormat = (v: string | number) => {
	const num = Number(v);
	if (isNaN(num)) {
		return '0';
	}
	const numStr = num.toFixed(1);
	return numStr
		.toString()
		.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
		.replace(/\.?0+$/, '');
};
