import { KEY_LIST } from './constants-keys';

export const APP_ENV_TYPE = {
	DEV: 'development',
	PROD: 'production',
};

// const AppConfig = {
// 	ENV: APP_ENV_TYPE.PROD,
// 	API_URL: 'https://api.buddycare.co.kr',
// 	CHAT_URL: 'https://chat.buddycare.co.kr',
// 	FRONT_HOST: 'https://www.buddycare.co.kr',
// 	FILE_SERVER: 'https://cdn.buddycare.co.kr/',
// 	KEY_LIST,
// };
const AppConfig = {
	ENV: APP_ENV_TYPE.PROD,
	API_URL: 'https://43.203.209.85',
	CHAT_URL: 'https://43.203.209.85',
	FRONT_HOST: 'https://43.203.209.85',
	FILE_SERVER: 'https://43.203.209.85/',
	KEY_LIST,
};
export default AppConfig;
