<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import KpImage from '@components/common/KpImage.vue';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import ChatPreview from '@components/chat/ChatPreview.vue';
import { findIndex } from 'lodash';
import { createGroupManager, getGroupManager, NotChatReadyException } from '@utils/group/group-instance';
import { Group, GroupCreatorInterface } from '@utils/group/dto/group';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import { useStore } from 'vuex';
import RefreshButton from '@components/layout/RefreshButton.vue';
import KpLink from '@components/common/KpLink.vue';
import {
	CHANGE_SELECTED_GROUP,
	SET_AUTH_TOKEN,
	SET_EMERGENCY_PHONE,
	SET_FOOTER_LOCK,
	SET_HEART_SETTING,
	SET_OXYGEN_SETTING,
	SET_POPUP,
	SET_SLEEP_SETTING,
	SET_STRESS_SETTING,
	SET_SYNC_UPDATE_TIME,
	SET_TEMP_SETTING,
} from '@src/store/actions';
import { AndroidEventType, DeviceConnectStateType, PopupType } from '@src/types/types';
import GroupUsersPopup from '@components/popup/GroupUsersPopup.vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import { getImgUrl, getNumberFormat, getUserData, loadLocalData } from '@utils/common-utils';
import LocationMap from '@components/layout/LocationMap.vue';
import { KEY_LIST } from '@src/constants-keys';
import { useRouter } from 'vue-router';
import GroupWaitingPopup from '@components/popup/GroupWaitingPopup.vue';
import { getApiClient } from '@utils/api-client';
import moment, { Moment } from 'moment';
import AppConfig from '@src/constants';
import {
	getInsertActivityParam,
	getInsertBloodPressureParam,
	getInsertHeartRateParam,
	getInsertOxygenParam,
	getInsertSleepParam,
	getInsertStressParam,
	getInsertTemperatureParam,
} from '@components/layout/health/heath-data';
import { getGroupList } from '@src/utils/group/api/group-api';
import { STATE_REG } from '@src/components/Profile.vue';
import { getHeartNotice, getOxyNotice, getSleepNotice, getStressNotice, getTempNotice } from '@utils/setting/api/setting-api';
import 'moment/locale/ko';
import { releaseSocket } from '../../utils/group/chat-utils';
import { getGroupEmergencyInfo } from '@utils/api-utils';

export default defineComponent({
	name: 'DashBoard',
	components: { GroupWaitingPopup, LocationMap, LayoutHeader, GroupUsersPopup, KpLink, RefreshButton, ChatPreview, KpImage },
	setup() {
		const store = useStore();
		const apiClient = computed(() => getApiClient(AppConfig.API_URL, store));
		const router = useRouter();
		const profileImg = ref<string | null>(null);
		const selectedGroup = ref<Group | undefined>();
		const groupList = ref<Group[]>();
		const battery = ref<number>(0);
		const chartConfig = ref<object | null>(null);
		const chartRef = ref<HTMLCanvasElement | null>(null);
		const healthInfoUpdateTime = ref<string | Moment>(store.state.syncUpdateTime ? moment(store.state.syncUpdateTime) : '');
		const isOpenGroups = ref<boolean>(false);
		const currentUserInfo = ref<GroupCreatorInterface>();
		const isOpenWaiting = ref<boolean>(false);
		const myDevice = ref<any>(null);

		const { HEALTH_TYPE } = KEY_LIST;
		const healthWorkingInfo = ref({
			type: HEALTH_TYPE.WORKING,
			title: '걸음수',
			prefix: '걸음',
			value: '-',
			prefixSub: '',
		});
		const healthHeartrateInfo = ref({
			type: HEALTH_TYPE.HEARTRATE,
			title: '심박수',
			prefix: 'BPM',
			value: '-',
			prefixSub: '',
		});
		const healthTemperatureInfo = ref({
			type: HEALTH_TYPE.TEMPERATURE,
			title: '체온',
			prefix: '°C',
			value: '-',
			prefixSub: '',
		});
		const healthBloodInfo = ref({
			type: HEALTH_TYPE.BLOODPRESSURE,
			title: '혈압',
			prefix: 'mmHg',
			value: '-/-',
			prefixSub: '',
		});
		const healthSleepInfo = ref({
			type: HEALTH_TYPE.SLEEP,
			title: '수면',
			prefix: '시간',
			value: '-',
			prefixSub: '',
		});
		const healthInfo = computed(() => {
			return [healthWorkingInfo.value, healthHeartrateInfo.value, healthTemperatureInfo.value, healthBloodInfo.value, healthSleepInfo.value];
		});

		const getBatteryChartData = () => {
			return {
				datasets: [
					{
						data: [100 - battery.value, battery.value],
						backgroundColor: ['#ffffff', 'rgba(44, 128, 255, 1)'],
						borderWidth: 0,
						borderJoinStyle: 'round',
						borderRadius: 100,
					},
				],
			};
		};

		const getBatteryChartConfig = () => {
			return {
				type: 'doughnut',
				data: getBatteryChartData(),
				options: {
					responsive: true,
					cutout: 20,
					plugins: {
						legend: {
							display: false,
						},
						title: {
							display: false,
						},
						tooltip: {
							enabled: false,
						},
					},
					animation: {
						animateScale: false,
						animateRotate: true,
					},
				},
			};
		};

		const getUpdateData = () => {
			window.appInterface.getDeviceInfo();
			window.appInterface.syncAll(moment(new Date()).format('YYYYMMDD'));
			window.appInterface.getGpsInfo();
			let localTime = moment().local();
			setUpdateTime(localTime);
			store.commit(SET_SYNC_UPDATE_TIME, localTime.toDate());
			getDashboardData();
		};

		const updateChannelList = (e?: Event, channelIdx?: string) => {
			if (channelIdx) {
				if (!groupList.value) return;

				const index = findIndex(groupList.value, c => c.channelIdx === channelIdx);
				const updateGroup = getGroupManager().groupList.find(c => c.channelIdx === channelIdx);
				if (updateGroup && index > -1) {
					groupList.value[index] = updateGroup;
				}
			} else {
				groupList.value = getGroupManager().getGroupList();
				selectedGroup.value = undefined;
				nextTick(() => {
					if (groupList.value && groupList.value.length > 0) selectedGroup.value = groupList.value[0];
				});
			}
		};

		const handleChatLoadComplete = async (e: Event) => {
			// await setUserInfo();
			updateChannelList(e);
			isOpenWaiting.value = false;
			store.commit(SET_FOOTER_LOCK, false);

			const curGroup = getGroupManager().getCurrentGroup();
			if (curGroup) {
				if (getUserData().userIdx !== curGroup?.creatorInfo?.userIdx) {
					router.replace({ path: '/main-user' });
				}
				if (currentUserInfo.value === undefined) {
					currentUserInfo.value = curGroup.creatorInfo;
				}
				getDashboardData();
			} else {
				currentUserInfo.value = {
					userIdx: getUserData().userIdx,
					username: getUserData().userName,
					userId: getUserData().userId,
					userProfile: undefined,
					deviceIdx: getUserData().deviceIdx ?? undefined,
					email: getUserData().email,
					tel: getUserData().tel,
					dateReg: new Date(),
				};
			}
		};

		const setUserInfo = () => {
			const funcPromise = (fnResolve: (dt?: any) => void, fnReject: (dt?: any) => void) => {
				getGroupList(apiClient.value, { stateReg: STATE_REG.RESOLVE })
					.then(async res => {
						const dataList = res.data as any;
						const curGroup = getGroupManager().getCurrentGroup();
						currentUserInfo.value = undefined;
						if (curGroup) currentUserInfo.value = curGroup.creatorInfo;
						else {
							const groupList = getGroupManager().getGroupList();
							if (groupList && groupList.length > 0) currentUserInfo.value = groupList[0].creatorInfo;
						}
						if (currentUserInfo.value?.userProfile) profileImg.value = getImgUrl(currentUserInfo.value?.userProfile);
						else profileImg.value = null;

						await getGroupManager().updateGroupList(dataList);

						updateChannelList();
						// getGroupManager().addEventListener(
						// 	GroupManagerEvent.LOAD_COMPLETE,
						// 	() => {
						// 		const curGroup = getGroupManager().getCurrentGroup();
						// 		console.log('🚀 ~ file: DashBoardDevice.vue:202 ~ funcPromise ~ curGroup:', curGroup);
						// 		if (curGroup) currentUserInfo.value = curGroup.creatorInfo;
						// 		else {
						// 			const groupList = getGroupManager().getGroupList();
						// 			if (groupList && groupList.length > 0) currentUserInfo.value = groupList[0].creatorInfo;
						// 		}
						// 		if (currentUserInfo.value?.userProfile) profileImg.value = getImgUrl(currentUserInfo.value?.userProfile);
						// 		else profileImg.value = null;
						// 	},
						// 	{ once: true },
						// );

						fnResolve();
					})
					.catch(e => {
						fnReject(e);
					});
			};
			return new Promise(funcPromise);
		};

		const handleMessageReceived = (e: Event) => {
			const channelIdx = (e as CustomEvent).detail;
			updateChannelList(e, channelIdx);

			window.appInterface.getMessageType();
		};

		const handleChangeGroup = async () => {
			await setUserInfo();
			selectedGroup.value = getGroupManager().getCurrentGroup();

			store.dispatch(CHANGE_SELECTED_GROUP, selectedGroup.value?.groupIdx);
		};

		const showMyGroupList = () => {
			if (groupList.value && groupList.value?.length > 0) {
				isOpenGroups.value = true;
				store.dispatch(SET_POPUP, PopupType.GROUP_USERS);
			}
		};

		const closeMyGroupList = () => {
			isOpenGroups.value = false;
			if (getUserData().userIdx !== getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx) {
				router.replace('/main-user');
				return;
			}

			getUpdateData();

			nextTick(() => {
				updateChannelList();
			});
		};

		const syncData = (e: Event) => {
			let data: { type: string; data: string } = JSON.parse((e as CustomEvent).detail as string);
			switch (data.type) {
				case 'body_temp':
					insertTemperature(JSON.parse(data.data));
					break;
				case 'bool_pressure':
					insertBloodPressure(JSON.parse(data.data));
					break;
				case 'heart_rate':
					insertHeartRate(JSON.parse(data.data));
					break;
				case 'stress':
					insertStress(JSON.parse(data.data));
					break;
				case 'sport_activity':
					insertActivity(JSON.parse(data.data));
					break;
				case 'oxygen':
					insertOxygen(JSON.parse(data.data));
					break;
				case 'sleep':
					insertSleep(JSON.parse(data.data));
					break;
			}
		};

		const insertTemperature = (data: any) => {
			let params = getInsertTemperatureParam(data);

			if (params && params.length > 0) {
				healthTemperatureInfo.value = {
					...healthTemperatureInfo.value,
					value: getNumberFormat(params[params.length - 1].temperature.toString()),
				};

				apiClient.value.post('/api/1/health/insertTemperature', { data: params }).then(res => {
					if (res.data.resultCode === 0) {
						getDashboardData();
					}
				});
			}
		};

		const insertBloodPressure = (data: any) => {
			let params = getInsertBloodPressureParam(data);

			if (params && params.length > 0) {
				healthBloodInfo.value = {
					...healthBloodInfo.value,
					value: `${getNumberFormat(params[params.length - 1].bloodPressure)}/${getNumberFormat(params[params.length - 1].bloodPressureLow)}`,
				};

				apiClient.value.post('/api/1/health/insertBloodPressure', { data: params }).then(res => {
					if (res.data.resultCode === 0) {
						getDashboardData();
					}
				});
			}
		};

		const insertHeartRate = (data: any) => {
			let params = getInsertHeartRateParam(data);

			if (params && params.length > 0) {
				healthHeartrateInfo.value = {
					...healthHeartrateInfo.value,
					value: getNumberFormat(params[params.length - 1].heartRate),
				};

				apiClient.value.post('/api/1/health/insertHeartRate', { data: params }).then(res => {
					if (res.data.resultCode === 0) {
						getDashboardData();
					}
				});
			}
		};

		const insertStress = (data: any) => {
			let params = getInsertStressParam(data);

			if (params && params.length > 0) {
				apiClient.value.post('/api/1/health/insertStress', { data: params }).then(res => {
					if (res.data.resultCode === 0) {
					}
				});
			}
		};

		const insertActivity = (data: any) => {
			let params = getInsertActivityParam(data);

			if (params && params.length > 0) {
				healthWorkingInfo.value = {
					...healthWorkingInfo.value,
					value: getNumberFormat(`${params[params.length - 1].totalStepCount}`),
				};

				apiClient.value.post('/api/1/health/insertActivity', { data: params }).then(res => {
					if (res.data.resultCode === 0) {
						getDashboardData();
					}
				});
			}
		};

		const insertOxygen = (data: any) => {
			let params = getInsertOxygenParam(data);

			if (params && params.length > 0) {
				apiClient.value.post('/api/1/health/insertOxygen', { data: params }).then(res => {
					if (res.data.resultCode === 0) {
					}
				});
			}
		};

		const insertSleep = (data: any) => {
			// data = {
			// 	awakeCount: 6,
			// 	awakeMins: 5,
			// 	deepSleepCount: 3,
			// 	deepSleepMins: 98,
			// 	items: [
			// 		{
			// 			duration: 11,
			// 			endTime: 1437,
			// 			level: 1,
			// 			startTime: 1426,
			// 		},
			// 		{
			// 			duration: 21,
			// 			endTime: 18,
			// 			level: 0,
			// 			startTime: 1437,
			// 		},
			// 		{
			// 			duration: 44,
			// 			endTime: 62,
			// 			level: 1,
			// 			startTime: 18,
			// 		},
			// 		{
			// 			duration: 1,
			// 			endTime: 63,
			// 			level: 2,
			// 			startTime: 62,
			// 		},
			// 		{
			// 			duration: 9,
			// 			endTime: 72,
			// 			level: 1,
			// 			startTime: 63,
			// 		},
			// 		{
			// 			duration: 39,
			// 			endTime: 111,
			// 			level: 0,
			// 			startTime: 72,
			// 		},
			// 		{
			// 			duration: 5,
			// 			endTime: 116,
			// 			level: 1,
			// 			startTime: 111,
			// 		},
			// 		{
			// 			duration: 1,
			// 			endTime: 117,
			// 			level: 2,
			// 			startTime: 116,
			// 		},
			// 		{
			// 			duration: 78,
			// 			endTime: 195,
			// 			level: 1,
			// 			startTime: 117,
			// 		},
			// 		{
			// 			duration: 1,
			// 			endTime: 196,
			// 			level: 2,
			// 			startTime: 195,
			// 		},
			// 		{
			// 			duration: 79,
			// 			endTime: 275,
			// 			level: 1,
			// 			startTime: 196,
			// 		},
			// 		{
			// 			duration: 1,
			// 			endTime: 276,
			// 			level: 2,
			// 			startTime: 275,
			// 		},
			// 		{
			// 			duration: 12,
			// 			endTime: 288,
			// 			level: 1,
			// 			startTime: 276,
			// 		},
			// 		{
			// 			duration: 38,
			// 			endTime: 326,
			// 			level: 0,
			// 			startTime: 288,
			// 		},
			// 		{
			// 			duration: 36,
			// 			endTime: 362,
			// 			level: 1,
			// 			startTime: 326,
			// 		},
			// 		{
			// 			duration: 1,
			// 			endTime: 363,
			// 			level: 2,
			// 			startTime: 362,
			// 		},
			// 		{
			// 			duration: 78,
			// 			endTime: 441,
			// 			level: 1,
			// 			startTime: 363,
			// 		},
			// 		{
			// 			duration: 0,
			// 			endTime: 441,
			// 			level: 2,
			// 			startTime: 441,
			// 		},
			// 	],
			// 	lightSleepCount: 9,
			// 	lightSleepMins: 352,
			// 	remMins: 0,
			// 	sleepEndTimeHour: 7,
			// 	sleepEndTimeMins: 21,
			// 	sleepScore: 0,
			// 	sleepStartTimeHour: 23,
			// 	sleepStartTimeMinute: 46,
			// 	totalSleepMins: 455,
			// 	average: 0,
			// 	day: 14,
			// 	max: 0,
			// 	min: 0,
			// 	month: 9,
			// 	year: 2023,
			// };
			let params = getInsertSleepParam(data);

			if (params && params.length > 0) {
				const sleepTime = params[params.length - 1].totalSleepMin;
				healthSleepInfo.value = {
					...healthSleepInfo.value,
					value: `${Math.floor(sleepTime / 60)
						.toString()
						.padStart(2, '0')}:${(sleepTime % 60).toString().padStart(2, '0')}`,
				};

				apiClient.value.post('/api/1/health/insertSleepTime', { data: params }).then(res => {
					if (res.data.resultCode === 0) {
						getDashboardData();
					}
				});
			}
		};

		const goToHealthPage = (path: string) => {
			router.push(`/health/${path}`);
		};

		const openChannelRoom = () => {
			if (selectedGroup.value) {
				getGroupManager().joinChannel(selectedGroup.value.channelIdx);
				router.push({ path: `/chat-room/${selectedGroup.value.groupIdx}` });
			}
		};

		const getConnectedDeviceInfo = (deviceIdx: string) => {
			if (deviceIdx) {
				apiClient.value.post('/api/1/device/getDeviceInfo', { deviceIdx }).then(res => {
					if (res.data.resultCode === 0) {
						let selectDevice = res.data.data[0];
						myDevice.value = selectDevice;
						window.appInterface.doConnectDevice(selectDevice.macAddress);
					}
				});
			}
		};

		const getDeviceConnectState = (e: Event) => {
			if ((e as CustomEvent).detail === DeviceConnectStateType.SUCCESS_BIND) {
				window.appInterface.getDeviceInfo();
			}
		};

		const getDeviceInfo = (e: Event) => {
			let deviceInfo = JSON.parse((e as CustomEvent).detail);
			battery.value = deviceInfo.batteryLevel;

			let params = {
				deviceIdx: getUserData().deviceIdx,
				batteryLevel: deviceInfo.batteryLevel,
				stateConnect: 'Y',
				firmwareVersion: deviceInfo.firmwareVersion !== '' ? 'V' + deviceInfo.firmwareVersion.split('V')[1] : '',
			};
			apiClient.value.post('/api/1/device/updateDeviceInfoForUser', params).then(res => {});

			nextTick(() => {
				setBatteryChartConfig();
			});
		};

		const setBatteryChartConfig = () => {
			chartConfig.value = getBatteryChartConfig();
			nextTick(() => {
				if (chartRef.value && chartConfig.value) {
					let chart = Chart.getChart(chartRef.value as HTMLCanvasElement);
					if (chart) chart.destroy();
					// @ts-ignore
					new Chart(chartRef.value, chartConfig.value as ChartConfiguration);
				}
			});
		};

		const setUpdateTime = (localTime: Moment) => {
			store.commit(SET_SYNC_UPDATE_TIME, localTime.toDate());
			if (healthInfoUpdateTime.value === '') {
				healthInfoUpdateTime.value = localTime;
			} else {
				if ((healthInfoUpdateTime.value as Moment).isBefore(localTime)) {
					healthInfoUpdateTime.value = localTime;
				}
			}
		};

		const getDashboardData = () => {
			let localTime = moment().local();
			setUpdateTime(localTime);

			let params: { userIdx: string; startDt?: number; endDt?: number } = {
				userIdx: getUserData().userIdx,
			};

			apiClient.value.post('/api/1/health/getActivity', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					let resentData = data[0];
					const lastedUpdatePeriod = new Date(resentData.period.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3 $4:$5'));
					let now = moment(new Date());
					let lastedUpdate = moment(lastedUpdatePeriod);

					if (now.diff(lastedUpdate, 'days') < 2) {
						healthWorkingInfo.value = {
							...healthWorkingInfo.value,
							value: getNumberFormat(resentData.totalStepCount),
						};
					} else {
						healthWorkingInfo.value = {
							...healthWorkingInfo.value,
							value: getNumberFormat(0),
						};
					}
				}
			});

			apiClient.value.post('/api/1/health/getHeartRate', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					let resentData = data[0];
					// let localTime = moment.utc(resentData.dateReg).local();
					// setUpdateTime(localTime);
					const lastedUpdatePeriod = new Date(resentData.period.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3 $4:$5'));

					let now = moment(new Date());
					let lastedUpdate = moment(lastedUpdatePeriod);
					healthHeartrateInfo.value = {
						...healthHeartrateInfo.value,
						value: getNumberFormat(resentData.value),
						prefixSub: ``,
					};
					if (moment.duration(now.diff(lastedUpdate)).asMinutes() > 30) {
						// healthHeartrateInfo.value = {
						// 	...healthHeartrateInfo.value,
						// 	prefix: 'BPM',
						// };
						// 	healthHeartrateInfo.value = {
						// 		...healthHeartrateInfo.value,
						// 		value: getNumberFormat(resentData.value),
						// 	};
						healthHeartrateInfo.value = {
							...healthHeartrateInfo.value,
							prefixSub: `(${moment(resentData.period, 'YYYYMMDDHHmm').fromNow()})`,
						};
					}
				}
			});

			apiClient.value.post('/api/1/health/getTemperature', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					let resentData = data[0];
					// let localTime = moment.utc(resentData.dateReg).local();
					// setUpdateTime(localTime);
					const lastedUpdatePeriod = new Date(resentData.period.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3 $4:$5'));

					let now = moment(new Date());
					let lastedUpdate = moment(lastedUpdatePeriod);
					healthTemperatureInfo.value = {
						...healthTemperatureInfo.value,
						value: getNumberFormat(resentData.value),
						prefixSub: '',
					};
					if (moment.duration(now.diff(lastedUpdate)).asMinutes() > 30) {
						// healthTemperatureInfo.value = {
						// 	...healthTemperatureInfo.value,
						// 	value: getNumberFormat(resentData.value),
						// };
						healthTemperatureInfo.value = {
							...healthTemperatureInfo.value,
							prefixSub: `(${moment(resentData.period, 'YYYYMMDDHHmm').fromNow()})`,
						};
					}
				}
			});

			apiClient.value.post('/api/1/health/getBloodPressure', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					let resentData = data[0];
					// let localTime = moment.utc(resentData.dateReg).local();
					// setUpdateTime(localTime);
					const lastedUpdatePeriod = new Date(resentData.period.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3 $4:$5'));

					let now = moment(new Date());
					let lastedUpdate = moment(lastedUpdatePeriod);
					healthBloodInfo.value = {
						...healthBloodInfo.value,
						value: `${getNumberFormat(resentData.valueHigh)}/${getNumberFormat(resentData.valueLow)}`,
						prefixSub: '',
					};
					if (moment.duration(now.diff(lastedUpdate)).asMinutes() > 30) {
						healthBloodInfo.value = {
							...healthBloodInfo.value,
							prefixSub: `(${moment(resentData.period, 'YYYYMMDDHHmm').fromNow()})`,
						};
					}
				}
			});

			params.startDt = Number(moment(new Date()).format('YYYYMMDD0000'));
			params.endDt = Number(moment(new Date()).format('YYYYMMDD9999'));
			apiClient.value.post('/api/1/health/getSleepTime', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					// let localTime = moment.utc(data[data.length - 1].dateReg).local();
					// setUpdateTime(localTime);

					const sleepTime = data[data.length - 1].totalSleepMin ?? 0;
					if (Number(sleepTime) > 0) {
						healthSleepInfo.value = {
							...healthSleepInfo.value,
							value: `${Math.floor(sleepTime / 60)
								.toString()
								.padStart(2, '0')}:${(sleepTime % 60).toString().padStart(2, '0')}`,
						};
					}
				}
			});
		};

		const getSyncSetting = () => {
			apiClient.value.post('/api/1/device/getDeviceInfoByGroup').then(res => {
				if (res.data.resultCode === 0) {
					if (res.data.data && res.data.data.length > 0 && res.data.data.filter((f: any) => f.userIdx === getUserData().userIdx).length > 0) {
						let data = res.data.data.filter((f: any) => f.userIdx === getUserData().userIdx);
						if (data[0].batteryLevel) {
							battery.value = Number(data[0].batteryLevel);
							setBatteryChartConfig();
						}
					}
					if (getUserData().stateUpdate) {
						window.appInterface.setBackgroundSyncTime(Number(getUserData().stateUpdate) * 60);
					}
				}
			});
			getNoticeInfo();
		};

		const goToLocation = () => {
			router.push('/map');
		};

		const handleWaitingPopup = () => {
			isOpenWaiting.value = false;
			store.commit(SET_FOOTER_LOCK, false);
		};

		const handleChat = async () => {
			try {
				addChatEvent();
				createGroupManager().launchChat();
				await setUserInfo();
				updateChannelList();
				handleWaitingPopup();
			} catch (e) {
				// if (e instanceof NotChatReadyException) {
				// 	createGroupManager().launchChat();
				// addChatEvent();
				// } else {
				throw e;
				// }
			}
		};

		const getConnecting = (e: Event) => {
			let status = (e as CustomEvent).detail;
			if (status === DeviceConnectStateType.CONNECTED) {
				window.appInterface.getDeviceInfo();
			}
		};
		const getDeviceBindState = (e: Event) => {
			if ((e as CustomEvent).detail === DeviceConnectStateType.SUCCESS_BIND) {
				createGroupManager().launchChat();
				window.appInterface.getDeviceInfo();
			}
			if ((e as CustomEvent).detail === DeviceConnectStateType.FAILED_BIND) {
				getConnectedDeviceInfo(getUserData().deviceIdx);
			}
		};

		const getNoticeInfo = () => {
			let params = {
				deviceIdx: getUserData().deviceIdx,
			};

			if (!store.state.isHeartSetting) {
				getHeartNotice(apiClient.value, params).then((res: { data: string | any[] }) => {
					if (res.data.length > 0) {
						window.appInterface.setHeartRateSetting({
							startRemindHour: 0,
							startRemindMinute: 0,
							endRemindHour: 23,
							endRemindMinute: 59,
							maxHeartRate: res.data[0].maxHeartRate,
							minHeartRate: 0,
							interval: 10,
							isEnableAutoTest: true,
						});
					}
				});
			}

			if (!store.state.isTempSetting) {
				getTempNotice(apiClient.value, params).then((res: { data: string | any[] }) => {
					if (res.data.length > 0) {
						window.appInterface.setTemperatureSetting({
							endRemindHour: 23,
							endRemindMinute: 59,
							interval: 10,
							isEnableAutoTest: true,
							isEnableTimePeriod: false,
							isEnableWarningTemperature: res.data[0].stateReg === 'Y',
							startRemindHour: 0,
							startRemindMinute: 0,
							warningTemperature: Number(res.data[0].maxWaringTemp).toFixed(1),
						});
					}
				});
			}

			if (!store.state.isSleepSetting) {
				getSleepNotice(apiClient.value, params).then((res: { data: string | any[] }) => {
					if (res.data.length > 0) {
						const SleepQuality = {
							PERFECT: 'PERFECT',
							GOOD: 'GOOD',
							OK: 'OK',
							BAD: 'BAD',
						};

						let quality = SleepQuality.PERFECT;
						if (Number(res.data[0].sleepQuality) < 6) {
							quality = SleepQuality.GOOD;
						} else if (Number(res.data[0].sleepQuality) < 5) {
							quality = SleepQuality.OK;
						} else if (Number(res.data[0].sleepQuality) < 4) {
							quality = SleepQuality.BAD;
						}
						window.appInterface.setSleepQualitySetting({
							qualityScore: quality,
						});
					}
				});
			}

			if (!store.state.isOxygenSetting) {
				getOxyNotice(apiClient.value, params).then((res: { data: string | any[] }) => {
					if (res.data.length > 0) {
						window.appInterface.setBloodOxygenSetting({
							isEnableAutoTest: true,
							isEnableTimePeriod: false,
							isEnableWarningOxygen: res.data[0].stateReg === 'Y',
							startRemindHour: 0,
							startRemindMinute: 0,
							endRemindHour: 23,
							endRemindMinute: 59,
							interval: 10,
							minOxygen: res.data[0].maxOxy,
							maxOxygen: 100,
						});
					}
				});
			}

			if (!store.state.isStressSetting) {
				getStressNotice(apiClient.value, params).then((res: { data: string | any[] }) => {
					if (res.data.length > 0) {
						window.appInterface.setStressSetting({
							startRemindHour: 0,
							startRemindMinute: 0,
							endRemindHour: 23,
							endRemindMinute: 59,
							interval: 10,
							minStress: res.data[0].maxStress,
							maxStress: 100,
						});
					}
				});
			}
		};

		const setHearRateSetting = () => {
			store.commit(SET_HEART_SETTING, true);
		};

		const setTemperatureSetting = () => {
			store.commit(SET_TEMP_SETTING, true);
		};

		const setSleepSetting = () => {
			store.commit(SET_SLEEP_SETTING, true);
		};

		const setOxygenSetting = () => {
			store.commit(SET_OXYGEN_SETTING, true);
		};
		const setStressSetting = () => {
			store.commit(SET_STRESS_SETTING, true);
		};

		const addChatEvent = () => {
			removeChatEvent();
			getGroupManager().addEventListener(GroupManagerEvent.LOAD_START, updateChannelList);
			getGroupManager().addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleChatLoadComplete);
			getGroupManager().addEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleMessageReceived);
			getGroupManager().addEventListener(GroupManagerEvent.CHANGE_GROUP, handleChangeGroup);
		};

		const removeChatEvent = () => {
			getGroupManager().removeEventListener(GroupManagerEvent.LOAD_START, updateChannelList);
			getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleChatLoadComplete);
			getGroupManager().removeEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleMessageReceived);
			getGroupManager().removeEventListener(GroupManagerEvent.CHANGE_GROUP, handleChangeGroup);
		};

		watch(
			() => battery.value,
			() => {
				setBatteryChartConfig();
			},
		);

		watch(
			() => chartRef.value,
			() => {
				if (chartRef.value) setBatteryChartConfig();
			},
		);

		onMounted(() => {
			console.log(getUserData());
			if (store.state.authToken === '' && !!loadLocalData(AppConfig.KEY_LIST.CONST.LOGIN_TOKEN)) {
				store.commit(SET_AUTH_TOKEN, loadLocalData(AppConfig.KEY_LIST.CONST.LOGIN_TOKEN));
			}
			handleChat();
			getSyncSetting();
			getUpdateData();
			// getDashboardData();
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_BIND_STATE, getDeviceBindState);
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_INFO, getDeviceInfo);
			window.appInterface.addEventListener(AndroidEventType.SYNC_DATA, syncData);
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_CONNECTING, getConnecting);

			window.appInterface.addEventListener(AndroidEventType.HEART_SETTING_CALLBACK, setHearRateSetting);
			window.appInterface.addEventListener(AndroidEventType.TEMP_SETTING_CALLBACK, setTemperatureSetting);
			window.appInterface.addEventListener(AndroidEventType.SLEEP_SETTING_CALLBACK, setSleepSetting);
			window.appInterface.addEventListener(AndroidEventType.OXYGEN_SETTING_CALLBACK, setOxygenSetting);
			window.appInterface.addEventListener(AndroidEventType.STRESS_SETTING_CALLBACK, setStressSetting);

			getGroupEmergencyInfo(getApiClient(), {}).then(res => {
				if (res.data.emergencyUserInfo.length > 0) {
					const emergencyInfo = res.data.emergencyUserInfo[0];
					if (emergencyInfo.tel) {
						const phone = emergencyInfo.tel.replace(/-/g, '');
						store.commit(SET_EMERGENCY_PHONE, phone);
						window.appInterface.setEmergencyNum(phone);
					}
				}
			});
		});

		onUnmounted(() => {
			removeChatEvent();
			releaseSocket();
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_BIND_STATE, getDeviceBindState);
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_INFO, getDeviceInfo);
			window.appInterface.removeEventListener(AndroidEventType.SYNC_DATA, syncData);
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_CONNECTING, getConnecting);

			window.appInterface.removeEventListener(AndroidEventType.HEART_SETTING_CALLBACK, setHearRateSetting);
			window.appInterface.removeEventListener(AndroidEventType.TEMP_SETTING_CALLBACK, setTemperatureSetting);
			window.appInterface.removeEventListener(AndroidEventType.SLEEP_SETTING_CALLBACK, setSleepSetting);
			window.appInterface.removeEventListener(AndroidEventType.OXYGEN_SETTING_CALLBACK, setOxygenSetting);
			window.appInterface.removeEventListener(AndroidEventType.STRESS_SETTING_CALLBACK, setStressSetting);
		});

		return {
			HEALTH_TYPE,
			chartRef,
			healthInfo,
			battery,
			updateTime: computed(() => {
				return healthInfoUpdateTime.value === '' ? '' : (healthInfoUpdateTime.value as Moment).format('MM.DD a HH:mm');
			}),
			groupList,
			selectedGroup,
			isOpenGroups,
			currentUserInfo,
			isOpenWaiting,
			profileImg,
			hasNoGroup: computed(() => {
				return !groupList.value || (groupList.value && groupList.value.length === 0);
			}),
			getImgUrl,
			showMyGroupList,
			closeMyGroupList,
			getUpdateData,
			goToHealthPage,
			openChannelRoom,
			goToLocation,
			getNumberFormat,
		};
	},
});
</script>

<template>
	<layout-header />
	<section class="dash-board">
		<article class="board user-info flex items-center w-full px-[20px] pb-[20px]">
			<div class="flex-none thumbnail mr-px">
				<kp-image v-if="!profileImg" :src="`images/view/default-profile.svg`" />
				<kp-image v-else :src="profileImg" class="rounded-full object-cover w-[80px] h-[80px]" />
			</div>
			<div class="name-space w-[calc(100%_-_150px)] flex-col ml-[15px]">
				<div class="user-name flex items-center">
					<span v-if="currentUserInfo" class="mr-[5px] truncate">{{ currentUserInfo.username }}</span>
					<span v-else-if="hasNoGroup || !currentUserInfo" class="mr-[5px]">사용자</span>
					<kp-link link="#" class="min-w-[20px] h-[20px]" :on-click="showMyGroupList">
						<kp-image :src="`images/common/main-arrow-down.svg`"
					/></kp-link>
				</div>
				<div v-if="currentUserInfo" class="user-id mt-[5px]">{{ currentUserInfo.userId }}</div>
				<div v-else-if="hasNoGroup || !currentUserInfo" class="user-id mt-[5px]">BuddyCare</div>
			</div>
			<div class="w-[40px] ml-[10px]">
				<div v-if="currentUserInfo" class="battery-wrapper">
					<div class="battery flex items-center justify-center">
						<div class="battery-img"><span :style="{ width: battery + '%' }" /></div>
						<div class="chart-wrapper" style="max-width: 48px">
							<canvas ref="chartRef" />
						</div>
					</div>
					<div class="battery-percent">{{ battery }}%</div>
				</div>
				<div v-else-if="hasNoGroup || !currentUserInfo" class="battery-wrapper">
					<div class="battery-empty w-[40px] h-[40px] rounded-[50%] flex items-center justify-center mb-[10px] mt-[10px]">
						<kp-image class="w-[25px] h-[25px]" src="images/icon/icon-base-battery.svg" />
					</div>
					<div class="w-[40px] h-[19px] flex justify-center items-start">
						<kp-image class="w-[25px] h-[19px]" src="images/icon/icon-base-percent.svg" />
					</div>
				</div>
			</div>
		</article>
		<article class="info px-[20px] pt-[30px]">
			<div class="title-wrapper flex justify-between items-center mb-[10px]">
				<h2 class="title">건강정보</h2>
				<div class="flex flex-row items-center">
					<span class="time-refresh">{{ updateTime }}</span>
					<refresh-button @click="getUpdateData" />
				</div>
			</div>
			<div class="contents-wrapper grid grid-cols-3 gap-[10px]">
				<template v-for="item in healthInfo" :key="`${item.type}_${item.value}`">
					<div class="board detail-info flex flex-col justify-between" :class="item.type" @click="goToHealthPage(item.type)">
						<div class="flex justify-between items-center w-full px-[10px]">
							<span class="title">{{ item.title }}</span>
							<span class="icon"><kp-image :src="`images/icon/ico-main-${item.type}.svg`" /></span>
						</div>
						<div class="value" :class="item.prefixSub ? 'prev' : ''">
							{{ item.value }}
							<div class="prefix">
								{{ item.prefix }} <span v-if="item.prefixSub" class="prefix-sub">{{ item.prefixSub ? `${item.prefixSub}` : '' }}</span>
							</div>
						</div>
					</div>
				</template>
				<div class="board detail-info map" @click="goToLocation">
					<location-map />
				</div>
			</div>
		</article>
		<article class="chat-wrapper info px-[20px] pt-[30px] pb-[110px]">
			<div class="title-wrapper flex justify-between items-center mb-[10px]">
				<h2 class="title">채팅</h2>
				<div class="flex flex-row items-center">
					<kp-link link="#" :on-click="openChannelRoom" class="btn-more flex items-center justify-center">더보기</kp-link>
				</div>
			</div>
			<div class="preview-wrapper">
				<chat-preview v-if="selectedGroup && selectedGroup.messageList.length > 0" />
				<div v-else class="empty-chat w-full text-center pt-[33px]">돌봄그룹에서 대화를 시작해보세요!</div>
			</div>
		</article>
		<GroupUsersPopup to="group-users" v-if="isOpenGroups" :close-handler="closeMyGroupList" class="group-users-popup relative" />
		<GroupWaitingPopup v-if="isOpenWaiting" />
	</section>
</template>

<style scoped></style>
