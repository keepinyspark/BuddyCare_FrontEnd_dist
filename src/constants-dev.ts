import { KEY_LIST } from './constants-keys';

export const APP_ENV_TYPE = {
	DEV: 'development',
	PROD: 'production',
};

// const AppConfig = {
// 	ENV: APP_ENV_TYPE.DEV,
// 	API_URL: 'https://api.buddycare.co.kr',
// 	CHAT_URL: 'https://chat.buddycare.co.kr',
// 	FRONT_HOST: 'http://localhost:4000/#/',
// 	FILE_SERVER: 'https://cdn.buddycare.co.kr/',
// 	KEY_LIST,
// };

const AppConfig = {
	ENV: APP_ENV_TYPE.DEV,
	API_URL: 'https://43.203.209.85',
	CHAT_URL: 'https://43.203.209.85',
	FRONT_HOST: 'http://localhost:4000/#/',
	FILE_SERVER: 'https://43.203.209.85/',
	KEY_LIST,
};

export default AppConfig;
