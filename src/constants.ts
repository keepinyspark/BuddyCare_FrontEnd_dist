import { KEY_LIST } from './constants-keys';

export const APP_ENV_TYPE = {
	LOCAL: 'local',
	DEV: 'development',
	PROD: 'production',
};

// const AppConfig = {
// 	ENV: APP_ENV_TYPE.LOCAL,
// 	API_URL: 'https://api.buddycare.co.kr',
// 	// API_URL: 'http://172.30.1.7:3300/',
// 	CHAT_URL: 'https://chat.buddycare.co.kr',
// 	FRONT_HOST: 'http://localhost:4000/#/',
// 	FILE_SERVER: 'https://cdn.buddycare.co.kr/',
// 	KEY_LIST,
// };

const AppConfig = {
	ENV: APP_ENV_TYPE.LOCAL,
	API_URL: 'https://43.203.209.85',
	// API_URL: 'http://172.30.1.7:3300/',
	CHAT_URL: 'https://43.203.209.85',
	FRONT_HOST: 'http://localhost:4000/#/',
	FILE_SERVER: 'https://43.203.209.85/',
	KEY_LIST,
};
export default AppConfig;
