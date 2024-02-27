import { KEY_LIST } from './constants-keys';

export const APP_ENV_TYPE = {
	DEV: 'development',
	PROD: 'production',
};

const AppConfig = {
	ENV: APP_ENV_TYPE.DEV,
	API_URL: 'https://api.buddycare.co.kr',
	CHAT_URL: 'https://chat.buddycare.co.kr',
	FRONT_HOST: 'http://localhost:4000/#/',
	FILE_SERVER: 'https://cdn.buddycare.co.kr/',
	KEY_LIST,
};
export default AppConfig;
