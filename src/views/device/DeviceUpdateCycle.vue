<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import KpLink from '@components/common/KpLink.vue';
import KpImage from '@components/common/KpImage.vue';
import KpButton from '@components/common/KpButton.vue';
import { useRouter } from 'vue-router';
import { getUserData, setUserData } from '@utils/common-utils';
import { AndroidEventType, UserType } from '@src/types/types';
import { getApiClient } from '@utils/api-client';
import moment from 'moment';
import { getGroupManager } from '@utils/group/group-instance';
import { useStore } from 'vuex';
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
import { Moment } from 'moment/moment';
import { SET_SYNC_UPDATE_TIME } from '../../store/actions';

export default defineComponent({
	name: 'DeviceUpdateCycle',
	components: { KpButton, KpImage, KpLink, LayoutHeader },
	setup() {
		const store = useStore();
		const router = useRouter();
		const apiClient = computed(() => getApiClient(AppConfig.API_URL, store));
		const selectCycleOption = ref('');
		const updateCycleList = ref([
			{ value: '10', label: '10분' },
			{ value: '30', label: '30분' },
			{ value: '60', label: '1시간' },
			{ value: '120', label: '2시간' },
			{ value: '180', label: '3시간' },
		]);
		const isDeviceUser = ref<boolean>();
		const deviceInfo = ref<{ deviceName: string; macAddress: string }>({
			deviceName: '-',
			macAddress: '-',
		});
		const healthInfoUpdateTime = ref<string | Moment>(store.state.syncUpdateTime ? moment(store.state.syncUpdateTime) : '');

		const updateSync = (value: string) => {
			if (!isDeviceUser.value) return;

			selectCycleOption.value = value;
		};

		const onClickSubmit = () => {
			if (!isDeviceUser.value) return;

			/**
			 * stateUpdate값은 구조 변경으로 인하여 user_info테이블로 변경되었습니다.
			 */
			apiClient.value.post('/api/1/users/updateUser', { stateUpdate: selectCycleOption.value }).then(res => {
				setUserData(Object.assign(getUserData(), { stateUpdate: selectCycleOption.value }));
				window.appInterface.setBackgroundSyncTime(Number(selectCycleOption.value) * 60);
				router.back();
			});

			// apiClient.value
			// 	.post('/api/1/device/insertUserDeviceInfo', { deviceIdx: getUserData().deviceIdx, stateUpdate: selectCycleOption.value })
			// 	.then(res => {
			// 		if (res.data.resultCode === 0) {
			// 		}
			// 	});
		};

		const onClickCancel = () => {
			router.back();
		};

		const onClickUpdate = () => {
			if (!isDeviceUser.value) return;
			window.appInterface.syncAll(moment(new Date()).format('YYYYMMDD'));
		};

		const getConnectedDeviceInfo = (deviceIdx: string) => {
			if (deviceIdx) {
				apiClient.value.post('/api/1/device/getDeviceInfo', { deviceIdx }).then(res => {
					if (res.data.resultCode === 0) {
						const { deviceName, macAddress, stateUpdate } = res.data.data[0];
						selectCycleOption.value = getUserData().stateUpdate;
						deviceInfo.value = {
							deviceName: deviceName,
							macAddress: macAddress,
						};
					}
				});
			}
		};

		const syncData = (e: Event) => {
			let localTime = moment().local();
			setUpdateTime(localTime);
			store.commit(SET_SYNC_UPDATE_TIME, localTime.toDate());
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
				apiClient.value.post('/api/1/health/insertTemperature', { data: params }).then(res => {
					if (res.data.resultCode === 0) {
					}
				});
			}
		};

		const insertBloodPressure = (data: any) => {
			let params = getInsertBloodPressureParam(data);

			if (params && params.length > 0) {
				apiClient.value.post('/api/1/health/insertBloodPressure', { data: params }).then(res => {
					if (res.data.resultCode === 0) {
					}
				});
			}
		};

		const insertHeartRate = (data: any) => {
			let params = getInsertHeartRateParam(data);

			if (params && params.length > 0) {
				apiClient.value.post('/api/1/health/insertHeartRate', { data: params }).then(res => {
					if (res.data.resultCode === 0) {
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
				apiClient.value.post('/api/1/health/insertActivity', { data: params }).then(res => {
					if (res.data.resultCode === 0) {
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
			let params = getInsertSleepParam(data);

			if (params && params.length > 0) {
				apiClient.value.post('/api/1/health/insertSleepTime', { data: params }).then(res => {
					if (res.data.resultCode === 0) {
					}
				});
			}
		};

		const setUpdateTime = (localTime: Moment) => {
			if (healthInfoUpdateTime.value === '') {
				healthInfoUpdateTime.value = localTime;
			} else {
				if ((healthInfoUpdateTime.value as Moment).isBefore(localTime)) {
					healthInfoUpdateTime.value = localTime;
				}
			}
		};

		const getDashboardData = () => {
			// let params: { userIdx: string; startDt?: number; endDt?: number } = {
			// 	userIdx: getUserData().userIdx,
			// };
			// let localTime = moment().local();
			// setUpdateTime(localTime);
			// apiClient.value.post('/api/1/health/getActivity', params).then(res => {
			// 	let { data } = res.data;
			// 	if (data && data.length > 0) {
			// 		let resentData = data[0];
			// 		let localTime = moment.utc(resentData.dateReg).local();
			// 		setUpdateTime(localTime);
			// 	}
			// });
			// apiClient.value.post('/api/1/health/getHeartRate', params).then(res => {
			// 	let { data } = res.data;
			// 	if (data && data.length > 0) {
			// 		let resentData = data[0];
			// 		let localTime = moment.utc(resentData.dateReg).local();
			// 		setUpdateTime(localTime);
			// 	}
			// });
			// apiClient.value.post('/api/1/health/getTemperature', params).then(res => {
			// 	let { data } = res.data;
			// 	if (data && data.length > 0) {
			// 		let resentData = data[0];
			// 		let localTime = moment.utc(resentData.dateReg).local();
			// 		setUpdateTime(localTime);
			// 	}
			// });
			// apiClient.value.post('/api/1/health/getBloodPressure', params).then(res => {
			// 	let { data } = res.data;
			// 	if (data && data.length > 0) {
			// 		let resentData = data[0];
			// 		let localTime = moment.utc(resentData.dateReg).local();
			// 		setUpdateTime(localTime);
			// 	}
			// });
			// apiClient.value.post('/api/1/health/getOxygen', params).then(res => {
			// 	let { data } = res.data;
			// 	if (data && data.length > 0) {
			// 		let resentData = data[0];
			// 		let localTime = moment.utc(resentData.dateReg).local();
			// 		setUpdateTime(localTime);
			// 	}
			// });
			// apiClient.value.post('/api/1/health/getStress', params).then(res => {
			// 	let { data } = res.data;
			// 	if (data && data.length > 0) {
			// 		let resentData = data[0];
			// 		let localTime = moment.utc(resentData.dateReg).local();
			// 		setUpdateTime(localTime);
			// 	}
			// });
			// params.startDt = Number(moment(new Date()).format('YYYYMMDD0000'));
			// params.endDt = Number(moment(new Date()).format('YYYYMMDD9999'));
			// apiClient.value.post('/api/1/health/getSleepTime', params).then(res => {
			// 	let { data } = res.data;
			// 	if (data && data.length > 0) {
			// 		let localTime = moment.utc(data[data.length - 1].dateReg).local();
			// 		setUpdateTime(localTime);
			// 	}
			// });
		};

		onMounted(() => {
			getConnectedDeviceInfo(getUserData().deviceIdx);
			getDashboardData();
			isDeviceUser.value = getUserData().userType === UserType.USER_DEVICE;
			window.appInterface.addEventListener(AndroidEventType.SYNC_DATA, syncData);
		});

		onUnmounted(() => {
			window.appInterface.removeEventListener(AndroidEventType.SYNC_DATA, syncData);
		});

		return {
			updateCycleList,
			selectCycleOption,
			isDeviceUser,
			updateTime: computed(() => {
				return healthInfoUpdateTime.value === '' ? '' : (healthInfoUpdateTime.value as Moment).format('MM.DD a HH:mm');
			}),
			updateSync,
			onClickSubmit,
			onClickCancel,
			onClickUpdate,
		};
	},
});
</script>

<template>
	<layout-header title="정보 업데이트 주기" />
	<section class="device-update-cycle">
		<div class="flex w-full flex-col justify-between">
			<article class="title-wrapper">
				<p class="title">기기 데이터 업데이트</p>
				<p class="desc mt-[5px]">
					디바이스의 업데이트 주기를<br />
					직접 설정하실 수 있습니다.
				</p>
			</article>
			<article class="update-cycle mt-[30px] py-[5px] px-[20px]">
				<ul>
					<li v-for="(item, index) in updateCycleList" :key="index">
						<kp-link :on-click="() => updateSync(item.value)" class="flex items-center">
							<span class="px-[10px]">{{ item.label }}</span>
							<kp-image v-if="selectCycleOption === item.value" src="images/icon/ico-device-update-select.svg" class="h-[15px]" />
						</kp-link>
					</li>
				</ul>
			</article>
			<article class="update-direct flex items-center justify-between mt-[15px]">
				<div class="flex items-center" @click="onClickUpdate">
					<kp-button class="flex items-center justify-center" btn-class="btn-refresh" @click="onClickUpdate">
						<kp-image src="images/icon/ico-btn-refresh.svg" />
					</kp-button>
					<label class="ml-[10px]">지금 업데이트</label>
				</div>
				<span>{{ updateTime }}</span>
			</article>
		</div>
		<div class="btn-wrapper">
			<kp-button :on-click="onClickSubmit" class="mb-[10px] h-[50px]">저장</kp-button>
			<kp-button :on-click="onClickCancel" is-secondary class="h-[50px]">취소</kp-button>
		</div>
	</section>
</template>

<style scoped></style>
