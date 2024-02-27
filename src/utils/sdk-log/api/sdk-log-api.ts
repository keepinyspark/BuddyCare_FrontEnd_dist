import { AxiosInstance } from 'axios';
interface ResponseLog {
	data: any[];
}
export const getSDKLogList = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseLog> | ResponseLog) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/sdk-log/getLogList', params)
			.then(res => {
				if (res.data.resultCode !== 0) {
					console.error(res);
					fnReject('msg.' + res.data.resultMsg);
				} else {
					fnResolve({ data: res.data.data });
				}
			})
			.catch(err => {
				console.error(err);
				fnReject('msg.RESULT_FAILED');
			});
	};

	return new Promise(promiseFn);
};

export const insertSDKLog = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseLog> | ResponseLog) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/sdk-log/insertLog', params)
			.then(res => {
				if (res.data.resultCode !== 0) {
					console.error(res);
					fnReject('msg.' + res.data.resultMsg);
				} else {
					fnResolve({ data: res.data.data });
				}
			})
			.catch(err => {
				console.error(err);
				fnReject('msg.RESULT_FAILED');
			});
	};

	return new Promise(promiseFn);
};
