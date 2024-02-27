import { AndroidEventType } from '@src/types/types';
import { Store } from 'vuex';
import { SET_LOADING } from '@src/store/actions';
import { insertSDKLog } from '@utils/sdk-log/api/sdk-log-api';
import { getApiClient } from '@utils/api-client';

export class AppInterface extends EventTarget {
	private store: Store<any> | undefined;
	private _userName: string;

	constructor(store: Store<any>) {
		super();
		this.store = store;
		this._userName = '';
	}
	connectedDevice = '';
	/**
	 * 기기 검색 요청
	 */
	doScanDevice() {
		// // vCleanMsgBox();
		// vCreateList();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.scanDevices();
		} else if ((window as any).webkit && (window as any).webkit.messageHandlers.keepinApp) {
			(window as any).webkit.messageHandlers.keepinApp.postMessage({ action: 'doScanDevice' });
		}
	}

	/**
	 * 기기 종료 요청
	 */
	doScanStop() {
		if (window.keepinApp) {
			window.keepinApp.stopScan();
		}
	}

	/**
	 * 기기 검색 결과
	 * deviceId||deviceName
	 */
	doScanDeviceCallback(str: any) {
		// vCreateScanDeviceList(str);
		// this.store?.commit(SET_LOADING, false);
		this.dispatchEvent(new CustomEvent(AndroidEventType.GET_DEVICE_LIST, { detail: str }));
	}

	/**
	 * 기기 연결 시도
	 */
	doConnectDevice(str: any) {
		// // vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.connectDevice(str);
		} else if ((window as any).webkit && (window as any).webkit.messageHandlers.keepinApp) {
			(window as any).webkit.messageHandlers.keepinApp.postMessage({ action: 'connectDevice', device: str });
		}
	}

	/**
	 * 기기 연결 결과
	 * start_connect, connecting, success_connect, failed_connect||에러코드, disconnected
	 */
	doConnectDeviceCallback(str: any) {
		// this.store?.commit(SET_LOADING, false);
		console.log(`doConnectDeviceCallback ${str}`);
		this.dispatchEvent(new CustomEvent(AndroidEventType.GET_DEVICE_CONNECT_STATE, { detail: str }));
	}

	/**
	 * 연결된 기기 정보 조회
	 */
	getDeviceInfo() {
		// // vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.getDeviceInfo();
		}
	}

	/**
	 * 연결된 기기 정보 결과
	 * failed, JSON객체
	 */
	getDeviceInfoCallback(str: any) {
		// this.store?.commit(SET_LOADING, false);
		try {
			if (str !== 'failed') {
				console.log(`getDeviceInfoCallback ${str}`);
				this.dispatchEvent(new CustomEvent(AndroidEventType.GET_DEVICE_INFO, { detail: str }));
			}
			// vCreateText(str);
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * 연결된 기기 정보 해제
	 */
	disconnectDevice() {
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.disconnectDevice();
		}
	}
	/**
	 * 연결된 기기 정보 해제 결과
	 * disconnected, failed_connect||${errorCode}
	 */
	disconnectDeviceCallback(str: any) {
		// vCreateText(str);
		// this.store?.commit(SET_LOADING, false);
		console.log('💀::: File: AndroidInterface.ts:118, Function: disconnectDeviceCallback');
		this.dispatchEvent(new CustomEvent(AndroidEventType.DISCONNECT_DEVICE, { detail: str }));
	}

	/**
	 * 연결 기기와 페어링
	 */
	bindDevice() {
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.bindDevice();
		}
	}

	/**
	 * 페어링 결과
	 * success_bind, failed_bind
	 */
	bindDeviceCallback(str: any) {
		// this.store?.commit(SET_LOADING, false);
		console.log(`bindDeviceCallback ${str}`);
		this.dispatchEvent(new CustomEvent(AndroidEventType.GET_DEVICE_BIND_STATE, { detail: str }));
		// vCreateText(str);
	}

	/**
	 * 기기 기능 조회
	 */
	getDeviceFeatureInfo() {
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.getDeviceFeatureInfo();
		}
	}

	/**
	 * 기기 기능 조회 결과
	 * failed: JSON객체
	 *
	 * JSON Sample:
	 * {"LTE":false,"NFC":false,"NOISE":false,"BLOOD_PRESSURE":true,"HEART_RATE":true,"OXYGEN":true,"STRESS":false,"TEMPERATURE":true,"ECG":true,"FALL_DETECTION":false,"GPS":false,"ACTIVITY":true}
	 */
	getDeviceFeatureInfoCallback(str: any) {
		// this.store?.commit(SET_LOADING, false);
		// vCreateText(str);
	}

	/**
	 * 심박 체크 설정
	 * Sample
	 * {startRemindHour=0, startRemindMinute=0, endRemindHour=23, endRemindMinute=59, maxHeartRate=0, minHeartRate=0, interval=10, isEnableAutoTest=true}
	 */
	setHeartRateSetting(setting: any) {
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.setHeartRateSetting(setting ? JSON.stringify(setting) : '');
		}
	}

	/**
	 * 심박 체크 설정 결과
	 */
	setHeartRateSettingCallback(str: any) {
		// this.store?.commit(SET_LOADING, false);
		// vCreateText(str);
		this.dispatchEvent(new CustomEvent(AndroidEventType.HEART_SETTING_CALLBACK));
	}

	/**
	 * 심박 설정 정보 조회
	 */
	getHeartRateSetting() {
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.getHeartRateSetting();
		}
	}

	/**
	 * 심박 설정 정보 조회 결과
	 * json객체
	 *
	 * JSON Sample:
	 * {"endRemindHour":23,"endRemindMinute":59,"interval":10,"isEnableAutoTest":true,"maxHeartRate":0,"minHeartRate":0,"startRemindHour":0,"startRemindMinute":0}
	 */
	getHeartRateSettingCallback(str: any) {
		// this.store?.commit(SET_LOADING, false);
		// vCreateText(str);
	}

	/**
	 * 체온 설정
	 * {"endRemindHour":23,"endRemindMinute":59,"interval":10,"isEnableAutoTest":true,"isEnableTimePeriod":false,"isEnableWarningTemperature":false,"startRemindHour":0,"startRemindMinute":0,"warningTemperature":0.0}
	 */
	setTemperatureSetting(settings: any) {
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.setTemperatureSetting(settings ? JSON.stringify(settings) : '');
		}
	}

	/**
	 * 체온 설정 결과
	 */
	setTemperatureSettingCallback(str: any) {
		// this.store?.commit(SET_LOADING, false);
		// vCreateText(str);
		this.dispatchEvent(new CustomEvent(AndroidEventType.TEMP_SETTING_CALLBACK));
	}

	/**
	 * 체온 설정 조회
	 */
	getTemperatureSetting() {
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.getTemperatureSetting();
		}
	}

	/**
	 * 체온 설정 조회 결과
	 * json객체
	 *
	 * JSON Sample
	 * {"endRemindHour":23,"endRemindMinute":59,"interval":10,"isEnableAutoTest":true,"isEnableTimePeriod":false,"isEnableWarningTemperature":false,"startRemindHour":0,"startRemindMinute":0,"warningTemperature":0.0}
	 */
	getTemperatureSettingCallback(str: any) {
		// this.store?.commit(SET_LOADING, false);
		// vCreateText(str);
	}

	/**
	 * 스트레스 설정
	 */
	setStressSetting(settings: any) {
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.setStressSetting(settings ? JSON.stringify(settings) : '');
		}
	}

	/**
	 * 스트레스 설정 결과
	 * success_stress, failed_stress
	 */
	setStressSettingCallback(str: any) {
		// TODO: 동작 안함, SDK 수정 필요
		// this.store?.commit(SET_LOADING, false);
		// vCreateText(str);
		this.dispatchEvent(new CustomEvent(AndroidEventType.STRESS_SETTING_CALLBACK));
	}

	/**
	 * 혈압 설정
	 */
	setBloodPreasureSetting(settings: any) {
		// TODO: 동작 안함, SDK 수정 필요
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.setBloodPreasureSetting(settings ? JSON.stringify(settings) : '');
		}
	}

	/**
	 * 산소포화도 설정
	 */
	setBloodOxygenSetting(settings: any) {
		// TODO: 동작 안함, SDK 수정 필요
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.setBloodOxygenSetting(settings ? JSON.stringify(settings) : '');
		}
	}

	/**
	 * 산소포화도 설정 결과
	 */
	setBloodOxygenSettingCallback(str: any) {
		// TODO: 동작 안함, SDK 수정 필요
		// this.store?.commit(SET_LOADING, false);
		// vCreateText(str);
		this.dispatchEvent(new CustomEvent(AndroidEventType.OXYGEN_SETTING_CALLBACK));
	}

	/**
	 * 산소포화도 설정 조회
	 */
	getBloodOxygenSetting() {
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.getBloodOxygenSetting();
		}
	}
	/**
	 * 산소포화도 설정 조회 결과
	 * Sample
	 * {"endRemindHour":23,"endRemindMinute":59,"interval":60,"isEnableAutoTest":true,"isEnableTimePeriod":false,"isEnableWarningOxygen":false,"maxOxygen":0,"minOxygen":0,"startRemindHour":0,"startRemindMinute":0}
	 */
	getBloodOxygenSettingCallback(str: any) {
		// this.store?.commit(SET_LOADING, false);
		// vCreateText(str);
	}

	/**
	 * 수면 퀄리티 설정
	 */
	setSleepQualitySetting(settings: any) {
		// TODO: 시간값을 안받음
		// vCleanMsgBox();
		if (window.keepinApp && window.keepinApp.setSleepQualitySetting) {
			window.keepinApp.setSleepQualitySetting(settings ? JSON.stringify(settings) : '');
		}
	}

	setSleepQualitySettingCallback(str: any) {
		// this.store?.commit(SET_LOADING, false);
		// vCreateText(str);
		this.dispatchEvent(new CustomEvent(AndroidEventType.SLEEP_SETTING_CALLBACK));
	}

	/**
	 * 데이터 동기화
	 */
	syncAll(dateString: any) {
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			// window.keepinApp.syncAll(dateString ? dateString : '');
			console.log(`syncAll`);
			window.keepinApp.syncAll(dateString);
		} else if ((window as any).webkit && (window as any).webkit.messageHandlers.keepinApp) {
			(window as any).webkit.messageHandlers.keepinApp.postMessage({ action: 'syncAll', date: dateString ? dateString : '' });
		}
	}

	/**
	 * 데이터 동기화 결과
	 * type : sport_activity, sleep, heart_rate, oxygen, stress, bool_pressure, body_temp
	 * 객체 자료는 SDK 문서 확인 필요
	 */
	syncAllCallback(type: any, data: any) {
		// this.store?.commit(SET_LOADING, false);
		// console.info(`type: ${type}: data: ${data}`);
		const syncData = JSON.stringify({ type: type, data: data });
		console.log(`syncAllCallback ${type} :: ${data}`);
		this.dispatchEvent(new CustomEvent(AndroidEventType.SYNC_DATA, { detail: syncData }));
		// insertSDKLog(getApiClient(), { type: type, data: JSON.parse(data) });
	}

	/**
	 * 방해금지 모드 설정
	 */
	setDisturbModeSetting(settings: any) {
		// vCleanMsgBox();
		if (window.keepinApp) {
			window.keepinApp.setDisturbModeSetting(settings ? JSON.stringify(settings) : '');
		}
	}

	/**
	 * 방해금지 모드 설정 조회
	 */
	getDisturbModeSetting() {
		// vCleanMsgBox();
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.getDisturbModeSetting();
		}
	}
	/**
	 * 방해금지 모드 설정 조회 결과
	 */
	getDisturbModeSettingCallback(str: any) {
		// this.store?.commit(SET_LOADING, false);
		this.dispatchEvent(new CustomEvent(AndroidEventType.GET_DISTURB_MODE, { detail: str }));
		// vCreateText(str);
	}

	/**
	 * 폰찾기 모드
	 */
	setFindPhoneState(b: any) {
		// vCleanMsgBox();
		if (window.keepinApp) {
			window.keepinApp.setFindPhoneState(b ? 1 : 0);
		}
	}

	/**
	 * 폰찾기 모드 조회
	 */
	getFindPhoneState() {
		// vCleanMsgBox();
		if (window.keepinApp) {
			window.keepinApp.getFindPhoneState();
		}
	}
	/**
	 * 폰찾기 모드 조회 결과
	 * true, false <-- 문자로 리턴
	 */
	getFindPhoneStateCallback(str: any) {
		// vCreateText(str);
	}

	/**
	 * 손목 위치 설정
	 * 0 : 왼쪽, 1: 오른쪽
	 */
	setHandMode(n: any) {
		// vCleanMsgBox();
		if (window.keepinApp) {
			window.keepinApp.setHandMode(Number(n));
		}
	}

	/**
	 * 손목 위치 조회
	 */
	getHandMode() {
		// vCleanMsgBox();
		if (window.keepinApp) {
			window.keepinApp.getHandMode();
		}
	}

	/**
	 * 손목 위치 조회 결과
	 * left, right
	 */
	getHandModeCallback(str: any) {
		// vCreateText(str);
		this.dispatchEvent(new CustomEvent(AndroidEventType.GET_HAND, { detail: str }));
	}

	/**
	 * 들어 꺠우기 설정
	 * 0 : 설정, 1: 해제
	 */
	setRaiseHandMode(b: any) {
		// vCleanMsgBox();
		if (window.keepinApp) {
			window.keepinApp.setRaiseHandMode(b ? 1 : 0);
		}
	}

	/**
	 * 들어 꺠우기 설정 조회
	 */
	getRaiseHandMode() {
		// vCleanMsgBox();
		if (window.keepinApp) {
			window.keepinApp.getRaiseHandMode();
		}
	}
	/**
	 * 들어 꺠우기 설정 조회 결과
	 * true, false <-- 문자로 리턴
	 */
	getRaiseHandModeCallback(str: any) {
		// vCreateText(str);
		this.dispatchEvent(new CustomEvent(AndroidEventType.GET_SHAKE, { detail: str }));
	}

	/**
	 * 와치 페이스 설정
	 * {title, author, previewPath, url}
	 */
	setWatchFace(face: any) {
		// vCleanMsgBox();
		if (window.keepinApp) {
			window.keepinApp.setWatchFace(JSON.stringify(face));
		}
	}

	/**
	 * 와치 페이스 설정 결과
	 */
	setWatchFaceCallback(p: any) {
		// vCreateText(`${p}%`);
		this.dispatchEvent(new CustomEvent(AndroidEventType.SYNC_WATCH_FACE, { detail: p }));
	}

	/**
	 * 날씨 정보 업데이트
	 *     private WeatherType weatherType;
    private int temperature;
    private int minTemp;
    private int maxTemp;
    private int humidity;
    private int airQuality;
    private int windSpeed;
    private String sunset;
    private String city;
    private String date;

	public enum WeatherType {
SUNNY, CLOUDY, FEW_CLOUDS, PARTLY_CLOUDY, OVERCAST, WINDY, CALM, LIGHT_BREEZE, MODERATE, FRESH_BREEZE, STRONG_BREEZE, HIGH_WIND, GALE, STRONG_GALE, STORM, VIOLENT_STORM, TORNADO,....
}
	 */
	setWeatherInfo(weather1: any, weather2: any, weather3: any, weather4: any, weather5: any) {
		// vCleanMsgBox();
		try {
			if (window.keepinApp) {
				const weatherInfo = {
					weatherType: 'UNKNOWN',
					temperature: 0,
					minTemp: 0,
					maxTemp: 0,
					humidity: 0,
					airQuality: 0,
					windSpeed: 0,
					sunset: '',
					city: '',
					date: '',
				};
				window.keepinApp.setWeatherInfo(
					JSON.stringify(weather1 ?? weatherInfo),
					JSON.stringify(weather2 ?? weatherInfo),
					JSON.stringify(weather3 ?? weatherInfo),
					JSON.stringify(weather4 ?? weatherInfo),
					JSON.stringify(weather5 ?? weatherInfo),
				);
			}
		} catch (e) {
			console.error(e);
		}
	}
	/**
	 * 날씨 정보 업데이트 결과
	 * success_weather, failed_weather
	 */
	setWeatherInfoCallback(str: any) {
		// vCreateText(str);
	}

	/**
	 * 공장 초기화 요청
	 */
	factoryReset() {
		// vCleanMsgBox();
		if (window.keepinApp) {
			window.keepinApp.factoryReset();
		}
	}

	getAppToken() {
		// vCleanMsgBox();
		if (window.keepinApp) {
			window.keepinApp.getAppToken();
		} else if ((window as any).webkit && (window as any).webkit.messageHandlers.keepinApp) {
			(window as any).webkit.messageHandlers.keepinApp.postMessage({ action: 'getAppToken' });
		}
	}

	getAppTokenCallback(str: any) {
		// token = str, 이걸 얻고싶어
		this.dispatchEvent(new CustomEvent(AndroidEventType.GET_TOKEN, { detail: str }));
	}

	rebootDevice() {
		if (window.keepinApp) {
			window.keepinApp.rebootDevice();
		}
	}

	startFirmwareUpgrade(str: any) {
		if (window.keepinApp) {
			window.keepinApp.upgradeFirmware(str);
		}
	}
	upgradeFirmwareCallback(state: string) {
		this.dispatchEvent(new CustomEvent(AndroidEventType.UPGRADE_FIRMWARE_CALLBACK, { detail: state }));
	}

	getGpsInfo() {
		if (window.keepinApp) {
			// this.store?.commit(SET_LOADING, true);
			window.keepinApp.getGpsInfo();
		}
	}

	getGpsInfoCallback(lat: any, lon: any) {
		// this.store?.commit(SET_LOADING, false);
		this.dispatchEvent(new CustomEvent(AndroidEventType.GET_LOCATION, { detail: JSON.stringify({ lat, lon }) }));
	}

	getGpsInsertCallback(lat: any, lon: any) {
		// this.store?.commit(SET_LOADING, false);
		this.dispatchEvent(new CustomEvent(AndroidEventType.INSERT_LOCATION));
	}

	// phoneNumber는 숫자로만 구성해 주세요.
	doCall(phoneNumber: any) {
		if (window.keepinApp) {
			window.keepinApp.doCall(phoneNumber);
		}
	}

	// 와치 알람 리시버
	getAppAlert(alarmType: any) {
		this.dispatchEvent(new CustomEvent(AndroidEventType.GET_ALARM, { detail: alarmType }));
	}

	// 백그라운드 데이터 동기화 주기 설정
	setBackgroundSyncTime(seconds: number) {
		if (window.keepinApp) {
			window.keepinApp.setSyncTime(seconds);
		}
	}

	// 연결 상태값
	getConnectedStatus() {
		if (window.keepinApp) {
			window.keepinApp.getConnectedStatus();
		}
	}

	getConnectedStatusCallback(str: any) {
		this.dispatchEvent(new CustomEvent(AndroidEventType.GET_DEVICE_CONNECTING, { detail: str }));
	}

	openImageToBrowser(url: string) {
		if (window.keepinApp) {
			window.keepinApp.shouldOverrideUrlLoading(url);
		}
	}

	checkBluetooth() {
		if (window.keepinApp) {
			window.keepinApp.checkBluetooth();
		}
	}

	setEmergencyNum(phone: string) {
		if (window.keepinApp) {
			window.keepinApp.setEmergencyNum(phone);
		}
	}

	setUserName(name: string) {
		if (window.keepinApp) {
			if (this._userName !== '') {
				window.keepinApp.setUserName(name);
			}
			this._userName = name;
		}
	}

	getMessageType() {
		if (window.keepinApp) {
			window.keepinApp.getMessageType();
		}
	}

	getMessageTypeCallback(type: string, data: string) {
		this.dispatchEvent(new CustomEvent(AndroidEventType.MESSAGE_TYPE, { detail: { type, data } }));
	}

	openAppNotifications() {
		if (window.keepinApp) {
			window.keepinApp.openAppNotifications();
		}
	}

	openMorningBriefSettings() {
		if (window.keepinApp) {
			window.keepinApp.openMorningBriefSettings();
		}
	}

	openAISettings() {
		if (window.keepinApp) {
			window.keepinApp.openAISettings();
		}
	}

	userPersonalInfo(data: any) {
		if (window.keepinApp) {
			window.keepinApp.userPersonalInfo(data);
		}
	}

	getWeather(lat: any, lon: any) {
		// this.store?.commit(SET_LOADING, false);
		this.dispatchEvent(new CustomEvent(AndroidEventType.GET_WEATHER, { detail: JSON.stringify({ lat, lon }) }));
	}
}
