import { AppInterface } from '@utils/WebView/AndroidInterface';

export {};

declare global {
	interface Window {
		appInterface: AppInterface;
		keepinApp: any;
	}
}
