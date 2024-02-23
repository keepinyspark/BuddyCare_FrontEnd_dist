import axios, { AxiosInstance } from 'axios';
import { Store } from 'vuex';
import { StoreState } from '@src/store/types';
import AppConfig from '../constants';
import { getUserData } from '@utils/common-utils';
import { SET_LOADING } from '@src/store/actions';

let apiClient: AxiosInstance | undefined;
let apiToken: string | undefined;

export function setApiToken(token: string): void {
	apiToken = token;
	if (apiClient) apiClient.defaults.headers.common['Authorization'] = `KP ` + token;
}

export function getApiToken(): any | undefined {
	if (apiClient) return apiClient.defaults.headers.common['Authorization'];
}

export function setApiBaseUrl(url: string): void {
	if (apiClient) apiClient.defaults.baseURL = url;
}

export const getApiHeader = () => {
	return {
		headers: {
			'Content-type': 'application/json',
		},
		timeout: 30 * 1000,
	};
};

export const getAPiFileHeader = () => {
	return {
		headers: {
			'Content-Type': 'multipart/form-data',
			Authorization: `KP ${apiToken}`,
		},
		timeout: 30 * 1000,
	};
};

export function getApiClient(baseUrl = AppConfig.API_URL, store?: Store<StoreState>): AxiosInstance {
	if (!apiClient) {
		apiClient = axios.create({
			baseURL: '',
			headers: {
				'Content-type': 'application/json',
				// Authorization: `KP ${apiToken}`,
			},
			timeout: 30 * 1000,
		});
		apiClient.interceptors.request.use(
			conf => {
				store?.commit(SET_LOADING, true);
				return conf;
			},
			error => {
				store?.commit(SET_LOADING, false);
				return Promise.reject(error);
			},
		);
		apiClient.interceptors.response.use(
			response => {
				store?.commit(SET_LOADING, false);
				return response;
			},
			error => {
				store?.commit(SET_LOADING, false);
				return Promise.reject(error);
			},
		);
	}

	setApiBaseUrl(baseUrl);
	if (store?.state.authToken) setApiToken(store.state.authToken);
	else if (getUserData() && getUserData().token) {
		setApiToken(getUserData().token);
	}
	return apiClient;
}
