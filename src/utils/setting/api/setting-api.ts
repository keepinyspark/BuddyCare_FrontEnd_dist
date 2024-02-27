import { AxiosInstance } from 'axios';

interface ResponseNotice {
	data: any[];
}

export const getHeartNotice = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseNotice> | ResponseNotice) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/notice/getNoticeHeartRateInfo', params)
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

export const getTempNotice = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseNotice> | ResponseNotice) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/notice/getNoticeTempInfo', params)
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

export const getBloodNotice = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseNotice> | ResponseNotice) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/notice/getNoticeBloodInfo', params)
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

export const getSleepNotice = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseNotice> | ResponseNotice) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/notice/getNoticeSleepInfo', params)
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

export const getOxyNotice = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseNotice> | ResponseNotice) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/notice/getNoticeOxygenInfo', params)
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

export const getStressNotice = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseNotice> | ResponseNotice) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/notice/getNoticeStressInfo', params)
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

export const insertHeartNotice = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseNotice> | ResponseNotice) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/notice/insertNoticeHeartRateInfo', params)
			.then(res => {
				if (res.data.resultCode !== 0) {
					console.error(res);
					fnReject('msg.' + res.data.resultMsg);
				} else {
					window.appInterface.setHeartRateSetting({
						startRemindHour: 0,
						startRemindMinute: 0,
						endRemindHour: 23,
						endRemindMinute: 59,
						maxHeartRate: params.maxHeartRate,
						minHeartRate: 0,
						interval: 10,
						isEnableAutoTest: true,
					});
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

export const insertTemperatureNotice = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseNotice> | ResponseNotice) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/notice/insertNoticeTempInfo', params)
			.then(res => {
				if (res.data.resultCode !== 0) {
					console.error(res);
					fnReject('msg.' + res.data.resultMsg);
				} else {
					window.appInterface.setTemperatureSetting({
						endRemindHour: 23,
						endRemindMinute: 59,
						interval: 10,
						isEnableAutoTest: true,
						isEnableTimePeriod: false,
						isEnableWarningTemperature: params.stateReg === 'Y',
						startRemindHour: 0,
						startRemindMinute: 0,
						warningTemperature: params.maxWaringTemp,
						warningLowTemperature: params.minWaringTemp,
					});
				}
			})
			.catch(err => {
				console.error(err);
				fnReject('msg.RESULT_FAILED');
			});
	};

	return new Promise(promiseFn);
};

export const insertBloodNotice = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseNotice> | ResponseNotice) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/notice/insertNoticeBloodInfo', params)
			.then(res => {
				if (res.data.resultCode === 0) {
					if (res.data.resultCode !== 0) {
						console.error(res);
						fnReject('msg.' + res.data.resultMsg);
					} else {
						window.appInterface.setBloodPreasureSetting({
							isEnableAutoTest: true,
							isEnableTimePeriod: false,
							isEnableWarningBloodpressure: params.stateReg === 'Y',
							endRemindHour: 23,
							endRemindMinute: 59,
							interval: 10,
							startRemindHour: 0,
							startRemindMinute: 0,
							minBloodPressure: params.minBloodPressure,
							maxBloodPressure: params.maxBloodPressure,
						});
					}
				}
			})
			.catch(err => {
				console.error(err);
				fnReject('msg.RESULT_FAILED');
			});
	};

	return new Promise(promiseFn);
};

export const insertSleepNotice = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseNotice> | ResponseNotice) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/notice/insertNoticeSleepInfo', params)
			.then(res => {
				if (res.data.resultCode !== 0) {
					console.error(res);
					fnReject('msg.' + res.data.resultMsg);
				} else {
					const SleepQuality = {
						PERFECT: 'PERFECT',
						GOOD: 'GOOD',
						OK: 'OK',
						BAD: 'BAD',
					};

					let quality = SleepQuality.PERFECT;
					if (Number(params.sleepQuality) / 60 < 6) {
						quality = SleepQuality.GOOD;
					} else if (Number(params.sleepQuality) / 60 < 5) {
						quality = SleepQuality.OK;
					} else if (Number(params.sleepQuality) / 60 < 4) {
						quality = SleepQuality.BAD;
					}
					window.appInterface.setSleepQualitySetting({
						qualityScore: quality,
					});
				}
			})
			.catch(err => {
				console.error(err);
				fnReject('msg.RESULT_FAILED');
			});
	};

	return new Promise(promiseFn);
};

export const insertOxygenNotice = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseNotice> | ResponseNotice) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/notice/insertNoticeOxygenInfo', params)
			.then(res => {
				if (res.data.resultCode !== 0) {
					console.error(res);
					fnReject('msg.' + res.data.resultMsg);
				} else {
					window.appInterface.setBloodOxygenSetting({
						isEnableAutoTest: true,
						isEnableTimePeriod: false,
						isEnableWarningOxygen: params.stateReg === 'Y',
						startRemindHour: 0,
						startRemindMinute: 0,
						endRemindHour: 23,
						endRemindMinute: 59,
						interval: 10,
						minOxygen: params.minOxy,
						maxOxygen: 100,
					});
				}
			})
			.catch(err => {
				console.error(err);
				fnReject('msg.RESULT_FAILED');
			});
	};

	return new Promise(promiseFn);
};

export const insertStressNotice = (client: AxiosInstance, params: any) => {
	const promiseFn = (fnResolve: (value: PromiseLike<ResponseNotice> | ResponseNotice) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/notice/insertNoticeStressInfo', params)
			.then(res => {
				if (res.data.resultCode !== 0) {
					console.error(res);
					fnReject('msg.' + res.data.resultMsg);
				} else {
					window.appInterface.setStressSetting({
						startRemindHour: 0,
						startRemindMinute: 0,
						endRemindHour: 23,
						endRemindMinute: 59,
						interval: 10,
						minStress: params.mixStress,
						maxStress: params.maxStress,
					});
				}
			})
			.catch(err => {
				console.error(err);
				fnReject('msg.RESULT_FAILED');
			});
	};

	return new Promise(promiseFn);
};
