<script lang="ts">
import ChatPreview from '@components/chat/ChatPreview.vue';
import KpButton from '@components/common/KpButton.vue';
import KpImage from '@components/common/KpImage.vue';
import KpLink from '@components/common/KpLink.vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import LocationMap from '@components/layout/LocationMap.vue';
import RefreshButton from '@components/layout/RefreshButton.vue';
import GroupUsersPopup from '@components/popup/GroupUsersPopup.vue';
import GroupWaitingPopup from '@components/popup/GroupWaitingPopup.vue';
import { STATE_REG } from '@src/components/Profile.vue';
import AppConfig from '@src/constants';
import { CHANGE_SELECTED_GROUP, SET_AUTH_TOKEN, SET_FOOTER_LOCK, SET_POPUP, SET_SYNC_UPDATE_TIME } from '@src/store/actions';
import { PopupType, UserType } from '@src/types/types';
import { getGroupList } from '@src/utils/group/api/group-api';
import { getApiClient } from '@utils/api-client';
import { getImgUrl, getNumberFormat, getUserData, loadLocalData } from '@utils/common-utils';
import { Group, GroupCreatorInterface } from '@utils/group/dto/group';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import { createGroupManager, getGroupManager } from '@utils/group/group-instance';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import { findIndex } from 'lodash';
import moment from 'moment';
import { Moment } from 'moment/moment';
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { KEY_LIST } from '../../constants-keys';
import { releaseSocket } from '../../utils/group/chat-utils';

export default defineComponent({
	name: 'DashBoard',
	components: { GroupWaitingPopup, LocationMap, LayoutHeader, GroupUsersPopup, KpLink, RefreshButton, ChatPreview, KpButton, KpImage },
	setup() {
		const store = useStore();
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
		const apiClient = computed(() => getApiClient(AppConfig.API_URL, store));
		const isOpenWaiting = ref<boolean>(false);

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

		const getUpdateData = async () => {
			if (getUserData().userType === UserType.USER_DEVICE) {
				if (getUserData().userIdx === getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx) {
					window.appInterface.getDeviceInfo();
					window.appInterface.syncAll(moment(new Date()).format('YYYYMMDD'));
					window.appInterface.getGpsInfo();
				} else {
					getGroupConnectedDeviceInfo();
				}
			} else if (getUserData().userType === UserType.USER) {
				getGroupConnectedDeviceInfo();
			}
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
				nextTick(() => {
					if (groupList.value && groupList.value.length > 0) selectedGroup.value = groupList.value[0];
				});
			}
		};

		const handleChatLoadComplete = async (e: Event) => {
			await setUserInfo();
			updateChannelList(e);
			if (getUserData().userType === UserType.USER_DEVICE) {
				isOpenWaiting.value = false;
				store.commit(SET_FOOTER_LOCK, false);
			} else {
				isOpenWaiting.value = getGroupManager().getGroupList().length < 1;
				store.commit(SET_FOOTER_LOCK, getGroupManager().getGroupList().length < 1);

				// currentUserInfo.value = {
				// 	userIdx: getUserData().userIdx,
				// 	username: getUserData().userName,
				// 	userId: getUserData().userId,
				// 	userProfile: undefined,
				// 	deviceIdx: getUserData().deviceIdx ?? undefined,
				// 	email: getUserData().email,
				// 	tel: getUserData().tel,
				// 	dateReg: new Date(),
				// };
			}
			getUpdateData();
		};

		const setUserInfo = () => {
			const funcPromise = (fnResolve: (dt?: any) => void, fnReject: (dt?: any) => void) => {
				getGroupList(apiClient.value, { stateReg: STATE_REG.RESOLVE })
					.then(res => {
						const dataList = res.data as any;

						if (getGroupManager().groupList.length === dataList.length) {
							for (let i = 0; i < dataList.length; i++) {
								let targetGroupIndex = getGroupManager().groupList.findIndex(t => t.creatorInfo?.userIdx === dataList[i].creatorInfo?.userIdx);
								getGroupManager().groupList[targetGroupIndex].creatorInfo = dataList[i].creatorInfo;
							}

							const curGroup = getGroupManager().getCurrentGroup();
							if (curGroup) currentUserInfo.value = curGroup.creatorInfo;
							else {
								const groupList = getGroupManager().getGroupList();
								if (groupList && groupList.length > 0) currentUserInfo.value = groupList[0].creatorInfo;
								else currentUserInfo.value = undefined;
							}
							if (currentUserInfo.value?.userProfile) profileImg.value = getImgUrl(currentUserInfo.value?.userProfile);
							else profileImg.value = null;
						}
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
		};

		const handleChangeGroup = async () => {
			await setUserInfo();
			selectedGroup.value = getGroupManager().getCurrentGroup();

			if (getGroupManager().getCurrentGroup() === undefined) {
				isOpenWaiting.value = getGroupManager().getGroupList().length < 1;
				store.commit(SET_FOOTER_LOCK, getGroupManager().getGroupList().length < 1);
				healthWorkingInfo.value = {
					type: HEALTH_TYPE.WORKING,
					title: '걸음수',
					prefix: '걸음',
					value: '-',
					prefixSub: '',
				};
				healthHeartrateInfo.value = {
					type: HEALTH_TYPE.HEARTRATE,
					title: '심박수',
					prefix: 'BPM',
					value: '-',
					prefixSub: '',
				};
				healthTemperatureInfo.value = {
					type: HEALTH_TYPE.TEMPERATURE,
					title: '체온',
					prefix: '°C',
					value: '-',
					prefixSub: '',
				};
				healthBloodInfo.value = {
					type: HEALTH_TYPE.BLOODPRESSURE,
					title: '혈압',
					prefix: 'mmHg',
					value: '-/-',
					prefixSub: '',
				};
				healthSleepInfo.value = {
					type: HEALTH_TYPE.SLEEP,
					title: '수면',
					prefix: '시간',
					value: '-',
					prefixSub: '',
				};
			}

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
			} else if (getUserData().userIdx === getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx) {
				router.replace('/main-device');
			}

			getUpdateData();
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

		const setBatteryChartConfig = () => {
			chartConfig.value = getBatteryChartConfig();
			if (chartRef.value && chartConfig.value) {
				let chart = Chart.getChart(chartRef.value as HTMLCanvasElement);
				if (chart) {
					chart.destroy();
				}
				// @ts-ignore
				new Chart(chartRef.value, chartConfig.value as ChartConfiguration);
			}
		};

		const getTargetDeviceInfo = () => {
			getApiClient(AppConfig.API_URL, store)
				.post('/api/1/device/getDeviceInfo', { deviceIdx: getGroupManager().getCurrentGroup()?.creatorInfo?.deviceIdx })
				.then(res => {
					if (res.data.resultCode === 0) {
						const { batteryLevel } = res.data.data[0];
						battery.value = Number(batteryLevel);

						nextTick(() => {
							setBatteryChartConfig();
						});
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

			const creatorIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx;
			if (creatorIdx) {
				let params: { userIdx: string; startDt?: number; endDt?: number } = {
					userIdx: creatorIdx,
				};

				apiClient.value.post('/api/1/health/getActivity', params).then(res => {
					let { data } = res.data;
					if (data && data.length > 0) {
						let resentData = data[0];
						const lastedUpdatePeriod = new Date(resentData.period.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3 $4:$5'));
						let now = moment(new Date());
						let lastedUpdate = moment(lastedUpdatePeriod);

						if (now.diff(lastedUpdate, 'days') < 1) {
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
			}
		};

		const goToLocation = () => {
			router.push(`/map`);
		};

		const handleWaitingPopup = () => {
			if (getGroupManager().isReady) {
				isOpenWaiting.value = getGroupManager().getGroupList().length < 1;
				store.commit(SET_FOOTER_LOCK, getGroupManager().getGroupList().length < 1);
			}
		};

		const handleChat = async () => {
			try {
				addChatEvent();
				await setUserInfo();
				createGroupManager().launchChat();
				updateChannelList();
				handleWaitingPopup();

				// getUpdateData();
			} catch (e) {
				// if (e instanceof NotChatReadyException) {
				// 	createGroupManager().launchChat();
				// 	addChatEvent();
				// } else {
				// 	throw e;
				// }
				throw e;
			}
		};

		const getGroupConnectedDeviceInfo = () => {
			getApiClient(AppConfig.API_URL, store)
				.post('/api/1/device/getDeviceInfoByGroup')
				.then(res => {
					if (res.data.resultCode === 0) {
						let targetGroup = res.data.data.filter((t: any) => {
							return t.groupIdx === getGroupManager().getCurrentGroup()?.groupIdx;
						});
						if (targetGroup && targetGroup.length > 0) {
							const { deviceName, macAddress, firmwareVersion, batteryLevel, stateConnect } = targetGroup[0];
							battery.value = isNaN(batteryLevel) ? 0 : Number(batteryLevel);
						}
					}
				});
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
			if (store.state.authToken === '' && !!loadLocalData(AppConfig.KEY_LIST.CONST.LOGIN_TOKEN)) {
				store.commit(SET_AUTH_TOKEN, loadLocalData(AppConfig.KEY_LIST.CONST.LOGIN_TOKEN));
			}

			handleChat();
		});

		onUnmounted(() => {
			removeChatEvent();
			releaseSocket();
			// removeGroupManager();
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
					<span v-if="currentUserInfo" class="mr-[5px] truncate">{{ currentUserInfo.username ?? '-' }}</span>
					<span v-else-if="hasNoGroup || !currentUserInfo" class="mr-[5px]">사용자</span>
					<kp-link link="#" class="min-w-[20px] h-[20px]" :on-click="showMyGroupList">
						<kpImage :src="`images/common/main-arrow-down.svg`"
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
					<div class="battery-empty w-[48px] h-[48px] rounded-[50%] flex items-center justify-center mb-[10px] mt-[0px]">
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
						<div class="value">
							{{ item.value }}
							<div class="prefix">{{ item.prefix }}</div>
						</div>
					</div>
				</template>
				<div class="board detail-info map" @click="goToLocation">
					<location-map v-if="selectedGroup" :is-group-empty="isOpenWaiting" />
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
		<group-users-popup to="group-users" v-if="isOpenGroups" :close-handler="closeMyGroupList" class="group-users-popup relative" />
		<group-waiting-popup v-if="isOpenWaiting" />
	</section>
</template>

<style scoped></style>
