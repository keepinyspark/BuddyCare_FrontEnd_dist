import { KEY_LIST } from './constants-keys';

export const APP_ENV_TYPE = {
	DEV: 'development',
	PROD: 'production',
};

const AppConfig = {
	ENV: APP_ENV_TYPE.PROD,
	API_URL: 'https://api.buddycare.co.kr',
	CHAT_URL: 'https://chat.buddycare.co.kr',
	FRONT_HOST: 'https://www.buddycare.co.kr',
	FILE_SERVER: 'https://cdn.buddycare.co.kr/',
	KEY_LIST,
};
export default AppConfig;
