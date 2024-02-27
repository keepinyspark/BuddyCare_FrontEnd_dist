<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { SET_AUTH_TOKEN, SET_CONNECTED_STATUS, SET_EMERGENCY_PHONE, SET_LOADING, SET_POPUP } from './store/actions';
import { getGroupManager } from '@utils/group/group-instance';
import LayoutFooter from '@components/layout/footer/LayoutFooter.vue';
import { PortalTarget } from 'portal-vue';
import { AndroidEventType, DeviceAlarmType, DeviceConnectStateType, MessageType, PopupType, UserType } from '@src/types/types';
import { getUserData, getUuid, loadLocalData, removeLocalData, saveLocalData } from '@utils/common-utils';
import { getApiClient, setApiToken } from '@utils/api-client';
import router from '@src/router';
import { KEY_LIST } from './constants-keys';
import { removeCookie } from 'typescript-cookie';
import AppConfig from '@src/constants';
import moment from 'moment/moment';
import { useRoute } from 'vue-router';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import { getGroupList } from './utils/group/api/group-api';
import { STATE_REG } from './components/Profile.vue';

enum WeatherType {
	SUNNY = 'SUNNY',
	CLOUDY = 'CLOUDY',
	FEW_CLOUDS = 'FEW_CLOUDS',
	PARTLY_CLOUDY = 'PARTLY_CLOUDY',
	OVERCAST = 'OVERCAST',
	WINDY = 'WINDY',
	CALM = 'CALM',
	LIGHT_BREEZE = 'LIGHT_BREEZE',
	MODERATE = 'MODERATE',
	FRESH_BREEZE = 'FRESH_BREEZE',
	STRONG_BREEZE = 'STRONG_BREEZE',
	HIGH_WIND = 'HIGH_WIND',
	GALE = 'GALE',
	STRONG_GALE = 'STRONG_GALE',
	STORM = 'STORM',
	VIOLENT_STORM = 'VIOLENT_STORM',
	HURRICANE = 'HURRICANE',
	TORNADO = 'TORNADO',
	TROPICAL_STORM = 'TROPICAL_STORM',
	SHOWER_RAIN = 'SHOWER_RAIN',
	HEAVY_SHOWER_RAIN = 'HEAVY_SHOWER_RAIN',
	THUNDER_SHOWER = 'THUNDER_SHOWER',
	HEAVY_THUNDER_STORM = 'HEAVY_THUNDER_STORM',
	LIGHT_RAIN = 'LIGHT_RAIN',
	MODERATE_RAIN = 'MODERATE_RAIN',
	HEAVY_RAIN = 'HEAVY_RAIN',
	EXTRAME_RAIN = 'EXTRAME_RAIN',
	DRIZZLE_RAIN = 'DRIZZLE_RAIN',
	RAIN_STORM = 'RAIN_STORM',
	HEAVY_STORM = 'HEAVY_STORM',
	SEVERE_STORM = 'SEVERE_STORM',
	FREEZING_RAIN = 'FREEZING_RAIN',
	LIGHT_SNOW = 'LIGHT_SNOW',
	MODERATE_SNOW = 'MODERATE_SNOW',
	HEAVY_SNOW = 'HEAVY_SNOW',
	SNOW_STORM = 'SNOW_STORM',
	SLEET = 'SLEET',
	RAIN_AND_SNOW = 'RAIN_AND_SNOW',
	SHOWER_SNOW = 'SHOWER_SNOW',
	SNOW_FLURRY = 'SNOW_FLURRY',
	MIST = 'MIST',
	FOGGY = 'FOGGY',
	HAZE = 'HAZE',
	SAND = 'SAND',
	DUST = 'DUST',
	DUST_STORM = 'DUST_STORM',
	SAND_STORM = 'SAND_STORM',
	HOT = 'HOT',
	COLD = 'COLD',
	UNKNOWN = 'UNKNOWN',
}

export default defineComponent({
	components: { LayoutFooter, PortalTarget },
	setup() {
		const store = useStore();
		const compCount = computed(() => store.state.count);
		const compPopupType = computed(() => store.state.popupType);
		const route = useRoute();
		const apiClient = computed(() => getApiClient(AppConfig.API_URL, store));
		const battery = ref<string>('');
		const isConnectedDevice = ref<boolean>(true);

		const handleClosePopup = () => {
			const needAutoClosePopupList = [PopupType.GROUP_EMERGENCY_CHANGE, PopupType.GROUP_USERS, PopupType.CHAT_USERS];
			if (needAutoClosePopupList.indexOf(compPopupType.value) < 0) return;

			store.dispatch(SET_POPUP, PopupType.NONE);
		};

		const handlePopupClose = (from: PopupType) => {
			// console.log('handlePopupClose from = ', from);
		};

		const handlePopupOpen = (to: PopupType) => {
			// console.log('handlePopuOpen to = ', to);
		};

		const goDashBoard = () => {
			router.replace({ path: `/dashboard` });
		};

		const getUserInfoUpdate = () => {
			apiClient.value.post('/api/1/users/me').then(res => {
				if (res.data.resultCode !== 0) {
					window.alert(res.data.resultMsg);
				} else {
					saveLocalData(KEY_LIST.CONST.LOGIN_USER, JSON.stringify(res.data.data));
				}
			});
		};

		const initApp = async () => {
			// try {
			// 	if (getUserData()) {
			// 		setApiToken(getUserData().token);
			// 		if (getUserData().userType && !getGroupManager().isReady) {
			// 			createGroupManager().launchChat();
			// 		}
			// 	}
			// } catch (e) {
			// 	if (e instanceof NotChatReadyException) {
			// 		createGroupManager().launchChat();
			// 	} else {
			// 		throw e;
			// 	}
			// }
			// getChatUtils().addEventListener(ChatUtilEvent.CONNECT, handleChatConnect);
			const userToken = loadLocalData(KEY_LIST.CONST.LOGIN_TOKEN);
			const loginUser = getUserData();
			if (userToken) store.commit(SET_AUTH_TOKEN, userToken);
			if (loginUser && userToken) {
				const apiClient = getApiClient();
				setApiToken(userToken);
				if (loginUser.userType) {
					getGroupList(apiClient, { stateReg: STATE_REG.RESOLVE })
						.then(async res => {
							const dataList = res.data as any;
							getGroupManager().addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
							await getGroupManager().updateGroupList(dataList);
						})
						.catch(e => {
							throw e;
						});
				}
			}
		};

		watch(compPopupType, (prev, next) => {
			if (prev !== PopupType.NONE && next === PopupType.NONE) handlePopupClose(prev);
			else if (prev === PopupType.NONE && next !== PopupType.NONE) handlePopupOpen(next);
		});

		const setEmergency = () => {
			try {
				if (getGroupManager().getCurrentGroup()?.emergencyTargetUserIdx) {
					if (getGroupManager().getCurrentGroup()?.emergencyTargetUserIdx) {
						apiClient.value
							.post('/api/1/users/getUserInfoByIdx', { userIdx: getGroupManager().getCurrentGroup()?.emergencyTargetUserIdx })
							.then(res => {
								if (res.data.resultCode !== 0) {
								} else {
									if (res.data.data.tel) {
										const phone = (res.data.data.tel as string).replace(/-/g, '');
										if (store.state.emergencyPhone !== phone) {
											store.commit(SET_EMERGENCY_PHONE, phone);
											window.appInterface.setEmergencyNum(phone);
										}
									}
								}
							});
					}
				}
			} catch (e) {}
		};

		const doCallEmergency = () => {
			try {
				if (getGroupManager().getCurrentGroup()?.emergencyTargetUserIdx) {
					if (getGroupManager().getCurrentGroup()?.emergencyTargetUserIdx) {
						apiClient.value
							.post('/api/1/users/getUserInfoByIdx', { userIdx: getGroupManager().getCurrentGroup()?.emergencyTargetUserIdx })
							.then(res => {
								if (res.data.resultCode !== 0) {
								} else {
									if (res.data.data.tel) {
										const phone = (res.data.data.tel as string).replace(/-/g, '');
										if (store.state.emergencyPhone !== phone) {
											store.commit(SET_EMERGENCY_PHONE, phone);
											window.appInterface.setEmergencyNum(phone);
											window.appInterface.doCall(phone);
										}
									}
								}
							});
					}
				}
			} catch (e) {
				window.appInterface.doCall(store.state.emergencyPhone);
			}
		};

		const sendAlarmToChat = (e: Event) => {
			const userData = getUserData();
			if (userData) {
				let alarmType = ((e as CustomEvent).detail as string).split('||');
				let value = alarmType[1] ?? 0;
				switch (alarmType[0]) {
					case DeviceAlarmType.ALERT_HIGH_HEART_RATE:
						doSendMessage(MessageType.EMERGENCY_ALARM, `심박수가 정상 수치를 벗어났습니다. 현재 수치는 ${value}입니다. 확인해주세요.`);
						doCallEmergency();
						break;
					case DeviceAlarmType.ALERT_LOW_HEART_RATE:
						doSendMessage(MessageType.EMERGENCY_ALARM, `심박수가 정상 수치를 벗어났습니다. 현재 수치는 ${value}입니다. 확인해주세요.`);
						doCallEmergency();
						break;
					case DeviceAlarmType.ALERT_HIGH_OXYGEN:
						doSendMessage(MessageType.EMERGENCY_ALARM, `산소포화도가 정상 수치를 벗어났습니다. 현재 수치는 ${value}입니다. 확인해주세요.`);
						doCallEmergency();
						break;
					case DeviceAlarmType.ALERT_LOW_OXYGEN:
						doSendMessage(MessageType.EMERGENCY_ALARM, `산소포화도가 정상 수치를 벗어났습니다. 현재 수치는 ${value}입니다. 확인해주세요.`);
						doCallEmergency();
						break;
					case DeviceAlarmType.ALERT_HIGH_TEMPERATURE:
						doSendMessage(MessageType.EMERGENCY_ALARM, `체온이 정상 수치를 벗어났습니다. 현재 수치는 ${value}입니다. 확인해주세요.`);
						doCallEmergency();
						break;
					case DeviceAlarmType.ALERT_LOW_TEMPERATURE:
						doSendMessage(MessageType.EMERGENCY_ALARM, `체온이 정상 수치를 벗어났습니다. 현재 수치는 ${value}입니다. 확인해주세요.`);
						doCallEmergency();
						break;
					case DeviceAlarmType.ALERT_HIGH_BLOOD_PRESSURE:
						doSendMessage(MessageType.EMERGENCY_ALARM, `혈압이 정상 수치를 벗어났습니다. 현재 수치는 ${value}입니다. 확인해주세요.`);
						doCallEmergency();
						break;
					case DeviceAlarmType.ALERT_LOW_BLOOD_PRESSURE:
						doSendMessage(MessageType.EMERGENCY_ALARM, `혈압이 정상 수치를 벗어났습니다. 현재 수치는 ${value}입니다. 확인해주세요.`);
						doCallEmergency();
						break;
					case DeviceAlarmType.ALERT_FIND_PHONE_EVENT:
						// doSendMessage(MessageType.EMERGENCY_ALARM, '');
						break;
					case DeviceAlarmType.ALERT_BATTERY_EVENT:
						// doSendMessage(MessageType.EMERGENCY_ALARM, '');
						if (battery.value !== alarmType[1]) {
							battery.value = alarmType[1];
							if (getUserData()) {
								let params = {
									deviceIdx: getUserData().deviceIdx,
									batteryLevel: alarmType[1],
									stateConnect: 'Y',
								};
								apiClient.value.post('/api/1/device/updateDeviceInfoForUser', params);
							}
						}
						break;
					case DeviceAlarmType.ALERT_EMERGENCY_CALL:
						// doSendMessage(MessageType.EMERGENCY_ALARM, '');
						break;
				}
			}
		};

		const doSendMessage = (msgType: MessageType, value?: string) => {
			switch (msgType) {
				case MessageType.EMERGENCY_ALARM:
					const textParam = {
						messageBody: value as string,
						messageType: msgType,
						tempUuid: getUuid(),
						senderIdx: getUserData().userIdx,
					};

					getGroupManager().dispatchEvent(new CustomEvent(GroupManagerEvent.SEND_EMERGENCY_ALARM, { detail: textParam }));
					getGroupManager().sendChatMessage(textParam);
					break;
				default:
					break;
			}
		};

		const handleResize = () => {
			const vh = (window.visualViewport?.height || window.innerHeight) * 0.01;
			window.document.documentElement.style.setProperty('--vh', `${vh}px`);
		};

		window.addEventListener('resize', handleResize);

		const authTokenCheck = () => {
			apiClient.value
				.post('/api/1/users/keepToken', {})
				.then(res => {
					store.commit(SET_LOADING, false);
					if (res.data.resultCode !== 0) {
						console.error(res);
						store.commit(SET_AUTH_TOKEN, '');
						removeLocalData(KEY_LIST.CONST.LOGIN_USER);
						removeLocalData(KEY_LIST.CONST.LOGIN_TOKEN);
						removeCookie(KEY_LIST.CONST.LOGIN_TOKEN);
					} else {
						if (res.data.data >= 1) {
							if (!loadLocalData(KEY_LIST.CONST.LOGIN_KEEP)) {
								store.commit(SET_AUTH_TOKEN, '');
								removeLocalData(KEY_LIST.CONST.LOGIN_USER);
								removeLocalData(KEY_LIST.CONST.LOGIN_TOKEN);
								removeCookie(KEY_LIST.CONST.LOGIN_TOKEN);
							}
						}
					}
				})
				.catch(e => {
					// store.commit(SET_AUTH_TOKEN, '');
					// removeLocalData(KEY_LIST.CONST.LOGIN_USER);
					// removeLocalData(KEY_LIST.CONST.LOGIN_TOKEN);
					// removeCookie(KEY_LIST.CONST.LOGIN_TOKEN);
					console.error(e);
				});
		};

		const getConnecting = (e: Event) => {
			let status = (e as CustomEvent).detail;
			if (getUserData() && getUserData().userType === UserType.USER_DEVICE) {
				if (status === DeviceConnectStateType.NOTCONNECTED) {
					if (store.state.isConnected) {
						store.commit(SET_CONNECTED_STATUS, false);
						window.alert('기기 연결에 실패하였습니다.');
						// 	router.replace('/device-connect');
						// } else {
						// 	router.replace('/device-connect');
					}
				} else if ((e as CustomEvent).detail.indexOf(DeviceConnectStateType.DISCONNECTED) > -1) {
					if (store.state.isConnected) {
						store.commit(SET_CONNECTED_STATUS, false);
						// window.alert('기기 연결이 끊어졌습니다.');
						// if (getUserData().deviceIdx) {
						// 	let params = {
						// 		deviceIdx: getUserData().deviceIdx,
						// 		batteryLevel: '',
						// 		stateConnect: 'N',
						// 	};
						// 	getApiClient(AppConfig.API_URL, store)
						// 		.post('/api/1/device/updateDeviceInfoForUser', params)
						// 		.then(res => {
						// 			router.replace('/device-connect');
						// 		});
						// }
						// } else {
						// 	router.replace('/device-connect');
					}
				}
			}
		};

		const getDeviceConnectState = (e: Event) => {
			let status = (e as CustomEvent).detail;
			if (getUserData() && getUserData().userType === UserType.USER_DEVICE) {
				if (status.indexOf(DeviceConnectStateType.FAILED) > -1) {
					if (store.state.isConnected) {
						store.commit(SET_CONNECTED_STATUS, false);
						window.alert('기기 연결에 실패하였습니다.');
						// window.appInterface.disconnectDevice();
						// router.replace('/device-connect');
						// } else {
						// 	router.replace('/device-connect');
					}
				}
				if (status.indexOf(DeviceConnectStateType.DISCONNECTED) > -1) {
					if (store.state.isConnected) {
						store.commit(SET_CONNECTED_STATUS, false);
						// window.alert('기기 연결이 끊어졌습니다.');
						// if (getUserData().deviceIdx) {
						// 	let params = {
						// 		deviceIdx: getUserData().deviceIdx,
						// 		batteryLevel: '',
						// 		stateConnect: 'N',
						// 	};
						// 	getApiClient(AppConfig.API_URL, store)
						// 		.post('/api/1/device/updateDeviceInfoForUser', params)
						// 		.then(() => {
						// 			router.replace('/device-connect');
						// 		});
						// }
						// } else {
						// 	router.replace('/device-connect');
					}
				}
			}
		};

		const getWeatherLatLon = (e: Event) => {
			const coods = JSON.parse((e as CustomEvent).detail as string);
			getWeather(coods);
		};

		const getLocation = (e: Event) => {
			const coods = JSON.parse((e as CustomEvent).detail as string);
			getWeather(coods);

			let params = {
				lat: coods.lat,
				lng: coods.lon,
				userIdx: getUserData().userIdx,
			};
			if (getUserData().userType === UserType.USER) {
				if (!getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx) {
					return;
				}
				params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx;
			} else if (getUserData().userType === UserType.USER_DEVICE) {
				if (params.userIdx !== getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx) {
					params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx;
				}
			}
			if (!!!params.userIdx) {
				return;
			}
			getApiClient(AppConfig.API_URL, store)
				.post('/api/1/location/insertLocation', params)
				.then(res => {});
		};

		const getWeather = (coods: { lat: number | string; lon: number | string }) => {
			const getXMLfromAPI = async () => {
				// 기상청 xml
				const today = new Date();
				today.setHours(today.getHours() - 1);

				// const xy: any = dfsXyConv('toXY', coods.lat, coods.lon);
				const city = 'Seoul';

				try {
					const response = await fetch(
						`https://api.openweathermap.org/data/2.5/forecast?lat=${coods.lat}&lon=${coods.lon}&appid=a5d2b4278856ed415b6a1a255cf1353b&units=metric`,
					);
					const xmlString = await response.text();
					const { list } = JSON.parse(xmlString);
					const weatherList: any = {};
					const weatherDateList: string[] = [];
					const today = moment();
					for (let i = 0; i < 5; i++) {
						// if (i !== 0) {
						// 	today.setDate(today.getDate() + 1);
						// }
						const oDateStr = today.format('YYYYMMDD');
						weatherDateList.push(oDateStr);
						for (let j = 0; j < list.length; j++) {
							const wEl = list[j];
							const date = moment(wEl.dt_txt);
							if (oDateStr === date.format('YYYYMMDD')) {
								if (!weatherList[oDateStr]) {
									weatherList[oDateStr] = {
										weatherType: WeatherType.UNKNOWN,
										temperature: 0,
										minTemp: Infinity,
										maxTemp: -Infinity,
										humidity: 0,
										airQuality: 0,
										windSpeed: 0,
										sunset: '',
										city: '',
										date: oDateStr,
									};
								}

								if (Math.floor(weatherList[oDateStr].minTemp) > Math.floor(wEl.main.temp_min))
									weatherList[oDateStr].minTemp = Math.floor(wEl.main.temp_min);
								if (Math.floor(weatherList[oDateStr].maxTemp) < Math.floor(wEl.main.temp_max))
									weatherList[oDateStr].maxTemp = Math.floor(wEl.main.temp_max);

								if (today.diff(date, 'hours') >= 0) {
									weatherList[oDateStr].temperature = Math.floor(wEl.main.temp);
									const mWeather = wEl.weather[0].main.toLowerCase();
									if (mWeather.includes('cloud') > -1) {
										weatherList[oDateStr].weatherType = WeatherType.CLOUDY;
									} else if (mWeather.includes('clear') > -1) {
										weatherList[oDateStr].weatherType = WeatherType.SUNNY;
									} else if (mWeather.includes('rain') > -1) {
										weatherList[oDateStr].weatherType = WeatherType.HEAVY_RAIN;
									} else if (mWeather.includes('snow') > -1) {
										weatherList[oDateStr].weatherType = WeatherType.LIGHT_SNOW;
									} else if (mWeather.includes('hot') > -1) {
										weatherList[oDateStr].weatherType = WeatherType.HOT;
									} else if (mWeather.includes('cold') > -1) {
										weatherList[oDateStr].weatherType = WeatherType.COLD;
									}
								}
							}
						}

						today.add(1, 'day');
					}

					window.appInterface.setWeatherInfo(
						weatherList[weatherDateList[0]],
						weatherList[weatherDateList[1]],
						weatherList[weatherDateList[2]],
						weatherList[weatherDateList[3]],
						weatherList[weatherDateList[4]],
					);
				} catch (error) {
					console.log(error);
				}
			};

			getXMLfromAPI();
		};

		const getMessageType = (e: Event) => {
			const messageType = (e as CustomEvent).detail.type;
			const messageData = (e as CustomEvent).detail.data;
			switch (messageType) {
				case 'MESSAGE':
					// router.replace(`/chat-room/${messageData}`);
					window.location.href = `/#/chat-room/${messageData}`;
					break;
				case 'GROUP':
					// router.replace(`/setting/group`);
					window.location.href = `/#/setting/group`;
					break;
				default:
			}
		};

		const handleGroupLoadComplete = () => {
			getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
			window.appInterface.getMessageType();
		};

		// const handleChatConnect = () => {
		// 	getGroupManager().addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
		// };

		const getToken = (e: Event) => {
			const token = (e as CustomEvent).detail;
			if (getUserData()) {
				apiClient.value.post('/api/1/users/updateUser', { userType: getUserData().userType, appToken: token }).then(res => {});
			}
		};

		watch(
			() => route.name,
			() => {
				setEmergency();
			},
		);

		watch(
			() => compPopupType.value,
			() => {
				if (compPopupType.value === PopupType.NONE) {
					document.body.style.position = 'relative';
				} else {
					document.body.style.position = 'fixed';
					document.body.style.width = '100%';
					document.body.style.height = '100%';
				}
			},
		);

		const unloadApp = () => {
			if (!loadLocalData(KEY_LIST.CONST.LOGIN_KEEP)) {
				store.commit(SET_AUTH_TOKEN, '');
				removeLocalData(KEY_LIST.CONST.LOGIN_USER);
				removeLocalData(KEY_LIST.CONST.LOGIN_TOKEN);
				removeCookie(KEY_LIST.CONST.LOGIN_TOKEN);
			}
			window.removeEventListener('resize', handleResize);
			// try {
			// 	getChatUtils().removeEventListener(ChatUtilEvent.CONNECT, handleChatConnect);
			// } catch (error) {
			// 	console.error(error);
			// }
			getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
			getGroupManager().destroy();
			window.appInterface.removeEventListener(AndroidEventType.GET_ALARM, sendAlarmToChat);
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_CONNECTING, getConnecting);
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.removeEventListener(AndroidEventType.GET_LOCATION, getLocation);
			window.appInterface.removeEventListener(AndroidEventType.MESSAGE_TYPE, getMessageType);
			window.appInterface.removeEventListener(AndroidEventType.GET_TOKEN, getToken);
		};

		onMounted(() => {
			if (route.name === undefined) {
				if (window.location.pathname === '/downloads') {
					window.location.href = AppConfig.FRONT_HOST + 'downloads';
					return;
				}
				if (window.location.hash === '#/downloads') {
					return;
				}
				if (window.location.pathname === '/downloads/' || window.location.pathname === '/downloads') {
					return;
				}
			}
			initApp();

			if (store.state.authToken === '' && !!loadLocalData(AppConfig.KEY_LIST.CONST.LOGIN_TOKEN)) {
				store.commit(SET_AUTH_TOKEN, loadLocalData(AppConfig.KEY_LIST.CONST.LOGIN_TOKEN));
			}
			const loginUser = getUserData();
			if (!loginUser) {
				router.replace({ path: '/login' });
				return;
			}
			if (loadLocalData(KEY_LIST.CONST.LOGIN_TOKEN)) authTokenCheck();
			window.appInterface.addEventListener(AndroidEventType.GET_ALARM, sendAlarmToChat);
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_CONNECTING, getConnecting);
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.addEventListener(AndroidEventType.GET_LOCATION, getLocation);
			window.appInterface.addEventListener(AndroidEventType.MESSAGE_TYPE, getMessageType);
			window.appInterface.addEventListener(AndroidEventType.GET_TOKEN, getToken);
			window.appInterface.addEventListener(AndroidEventType.GET_WEATHER, getWeatherLatLon);

			// try {
			// createGroupManager().launchChat();
			// 	getChatUtils().addEventListener(ChatUtilEvent.CONNECT, handleChatConnect);
			// } catch (e) {}
			window.addEventListener(
				'unload',
				() => {
					unloadApp();
				},
				{ once: true },
			);
		});

		onUnmounted(() => {
			unloadApp();
			window.appInterface.removeEventListener(AndroidEventType.GET_WEATHER, getWeatherLatLon);
		});
		return {
			store,
			PopupType,
			compCount,
			compPopupType,
			handleClosePopup,
			goDashBoard,
		};
	},
	methods: {
		unloadKeep() {
			alert('exit!!!');
		},
	},
});
</script>

<template>
	<div class="wrapper">
		<router-view />
		<layout-footer />
	</div>
	<div v-if="compPopupType !== PopupType.NONE" @click.self="handleClosePopup" class="popup-wrapper fixed w-full h-screen top-0 left-0 z-[101]">
		<portal-target v-if="compPopupType === PopupType.GROUP_FIND_USER" name="find-user-popup"></portal-target>
		<portal-target v-else-if="compPopupType === PopupType.GROUP_EMERGENCY_CHANGE" name="group-users-emergency"></portal-target>
		<portal-target v-else-if="compPopupType === PopupType.CHAT_USERS" name="chat-users"></portal-target>
		<portal-target v-else-if="compPopupType === PopupType.GROUP_USERS" name="group-users"></portal-target>
		<portal-target v-else-if="compPopupType === PopupType.GROUP_STATE_MANAGE" name="group-state-manage"></portal-target>
		<portal-target v-else-if="compPopupType === PopupType.WATCHFACE" name="watchface-popup"></portal-target>
		<portal-target v-else-if="compPopupType === PopupType.DISTURB" name="disturb-popup"></portal-target>
	</div>
	<div v-if="store.state.isLoading" ref="axiosWrapper" class="axios-loading">
		<div ref="loader" class="loader"></div>
	</div>
</template>

<style lang="scss">
@import 'assets/css/app.scss';
</style>
