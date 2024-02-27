<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, PropType, ref, toRef, watch } from 'vue';
import KpImage from '@components/common/KpImage.vue';
import { Group } from '@utils/group/dto/group';
import moment from 'moment';
import { getApiClient } from '@utils/api-client';
import AppConfig from '@src/constants';
import { KEY_LIST } from '@src/constants-keys';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { getNumberFormat, getUserData } from '@utils/common-utils';
import { Moment } from 'moment/moment';
import { SET_SYNC_UPDATE_TIME } from '../../store/actions';

export default defineComponent({
	name: 'HealthInfo',
	props: {
		currentGroup: {
			type: Object as PropType<Group>,
			required: false,
		},
		isUpdateData: {
			type: Boolean,
			required: true,
		},
		setDashboardUpdateTime: {
			type: Function,
			required: false,
		},
	},
	components: { KpImage },
	setup(props) {
		const store = useStore();
		const router = useRouter();
		const group = toRef(props, 'currentGroup');
		const isUpdate = toRef(props, 'isUpdateData');
		const apiClient = computed(() => getApiClient(AppConfig.API_URL, store));
		const { HEALTH_TYPE } = KEY_LIST;
		const healthInfoUpdateTime = ref<string | Moment>(store.state.syncUpdateTime ? moment(store.state.syncUpdateTime) : '');
		const healthWorkingInfo = ref({
			type: HEALTH_TYPE.WORKING,
			title: '걸음수',
			prefix: '걸음',
			value: '-',
		});
		const healthHeartrateInfo = ref({
			type: HEALTH_TYPE.HEARTRATE,
			title: '심박수',
			prefix: 'BPM',
			value: '-',
		});
		const healthTemperatureInfo = ref({
			type: HEALTH_TYPE.TEMPERATURE,
			title: '체온',
			prefix: '°C',
			value: '-',
		});
		const healthBloodInfo = ref({
			type: HEALTH_TYPE.BLOODPRESSURE,
			title: '혈압',
			prefix: 'mmHg',
			value: '-/-',
		});
		const healthSleepInfo = ref({
			type: HEALTH_TYPE.SLEEP,
			title: '수면',
			prefix: '시간',
			value: '-',
		});
		const healthInfo = computed(() => {
			return [healthWorkingInfo.value, healthHeartrateInfo.value, healthTemperatureInfo.value, healthBloodInfo.value, healthSleepInfo.value];
		});

		const setUpdateTime = (localTime: Moment) => {
			store.commit(SET_SYNC_UPDATE_TIME, localTime.toDate());
			if (healthInfoUpdateTime.value === '') {
				healthInfoUpdateTime.value = localTime;
			} else {
				if ((healthInfoUpdateTime.value as Moment).isBefore(localTime)) {
					healthInfoUpdateTime.value = localTime;
				}
			}
			store.commit(SET_SYNC_UPDATE_TIME, localTime.toDate());
			if (props.setDashboardUpdateTime) {
				props.setDashboardUpdateTime(healthInfoUpdateTime.value);
			}
		};

		const getDashboardData = () => {
			let params: { userIdx: string; startDt?: number; endDt?: number } = {
				userIdx: group.value?.creatorInfo?.userIdx as string,
			};

			apiClient.value.post('/api/1/health/getActivity', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					let resentData = data[0];
					let localTime = moment.utc(resentData.dateReg).local();
					setUpdateTime(localTime);
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
					let localTime = moment.utc(resentData.dateReg).local();
					setUpdateTime(localTime);
					const lastedUpdatePeriod = new Date(resentData.period.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3 $4:$5'));

					let now = moment(new Date());
					let lastedUpdate = moment(lastedUpdatePeriod);
					if (moment.duration(now.diff(lastedUpdate)).asMinutes() < 30) {
						healthHeartrateInfo.value = {
							...healthHeartrateInfo.value,
							value: getNumberFormat(resentData.value),
						};
					}
				}
			});

			apiClient.value.post('/api/1/health/getTemperature', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					let resentData = data[0];
					let localTime = moment.utc(resentData.dateReg).local();
					setUpdateTime(localTime);
					const lastedUpdatePeriod = new Date(resentData.period.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3 $4:$5'));

					let now = moment(new Date());
					let lastedUpdate = moment(lastedUpdatePeriod);
					if (moment.duration(now.diff(lastedUpdate)).asMinutes() < 30) {
						healthTemperatureInfo.value = {
							...healthTemperatureInfo.value,
							value: getNumberFormat(resentData.value),
						};
					}
				}
			});

			apiClient.value.post('/api/1/health/getBloodPressure', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					let resentData = data[0];
					let localTime = moment.utc(resentData.dateReg).local();
					setUpdateTime(localTime);
					const lastedUpdatePeriod = new Date(resentData.period.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3 $4:$5'));

					let now = moment(new Date());
					let lastedUpdate = moment(lastedUpdatePeriod);
					if (moment.duration(now.diff(lastedUpdate)).asMinutes() < 30) {
						healthBloodInfo.value = {
							...healthBloodInfo.value,
							value: `${getNumberFormat(resentData.valueHigh)}/${getNumberFormat(resentData.valueLow)}`,
						};
					}
				}
			});

			params.startDt = Number(moment(new Date()).format('YYYYMMDD0000'));
			params.endDt = Number(moment(new Date()).format('YYYYMMDD9999'));
			apiClient.value.post('/api/1/health/getSleepTime', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					let localTime = moment.utc(data[data.length - 1].dateReg).local();
					setUpdateTime(localTime);

					const sleepTime = data[data.length - 1].totalSleepMin;
					healthSleepInfo.value = {
						...healthSleepInfo.value,
						value: `${Math.floor(sleepTime / 60)
							.toString()
							.padStart(2, '0')}:${(sleepTime % 60).toString().padStart(2, '0')}`,
					};
				}
			});
		};

		const goToHealthPage = (path: string) => {
			router.push(`/health/${path}?group=${group.value?.groupIdx}`);
		};

		watch(
			() => isUpdate.value,
			() => {
				getDashboardData();
			},
		);

		onMounted(() => {
			getDashboardData();
		});

		return {
			healthInfo,
			goToHealthPage,
		};
	},
});
</script>
<template>
	<template v-for="item in healthInfo" :key="item.type">
		<div
			class="detail-info flex flex-col justify-between max-w-[100%] w-[105px] h-[120px] rounded-[15px] pt-[15px] pb-[10px]"
			:class="item.type"
			@click="goToHealthPage(item.type)">
			<div class="flex justify-between items-center w-full px-[10px]">
				<span class="title">{{ item.title }}</span>
				<span class="icon"><kp-image :src="`images/icon/ico-main-${item.type}.svg`" /></span>
			</div>
			<div class="value text-center">
				{{ item.value }}
				<div class="prefix mt-[5px]">{{ item.prefix }}</div>
			</div>
		</div>
	</template>
</template>

<style scoped></style>
