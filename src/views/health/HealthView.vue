<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import { useRoute, useRouter } from 'vue-router';
import { KEY_LIST } from '../../constants-keys';
import KpImage from '@components/common/KpImage.vue';
import slider from 'vue3-slider';
import ChartView from '@components/layout/health/ChartView.vue';
import { ChartDataTypes, UserType } from '@src/types/types';
import { getApiClient } from '@utils/api-client';
import { getNumberFormat, getUserData } from '@utils/common-utils';
import UserInfo from '@components/manager/UserInfo.vue';
import { Group } from '@utils/group/dto/group';
import { createGroupManager, getGroupManager, NotChatReadyException } from '@utils/group/group-instance';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import moment from 'moment/moment';
import { useStore } from 'vuex';
import AppConfig from '@src/constants';
import 'moment/locale/ko';

export default defineComponent({
	name: 'HealthView',
	components: { UserInfo, ChartView, KpImage, LayoutHeader, slider },
	setup() {
		const store = useStore();
		const apiClient = computed(() => getApiClient(AppConfig.API_URL, store));
		const route = useRoute();
		const router = useRouter();
		const pageTitle = ref<string>('');
		const pageHealthType = ref<ChartDataTypes | ''>('');
		const userType = ref<string>();
		const currentGroup = ref<Group>();
		const routeParamType = computed(() => route.params.type);
		const { HEALTH_TYPE } = KEY_LIST;
		// .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ','),
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
		const healthOxygenInfo = ref({
			type: HEALTH_TYPE.OXYGEM,
			title: '산소포화도',
			prefix: '%',
			value: '-',
			prefixSub: '',
		});
		const healthStressInfo = ref({
			type: HEALTH_TYPE.STRESS,
			title: '스트레스',
			prefix: '%',
			value: '0',
			prefixSub: '',
		});
		const healthInfo = computed(() => {
			return [
				healthWorkingInfo.value,
				healthHeartrateInfo.value,
				healthTemperatureInfo.value,
				healthBloodInfo.value,
				healthSleepInfo.value,
				healthOxygenInfo.value,
				healthStressInfo.value,
			];
		});

		const handleChatLoadComplete = () => {
			getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleChatLoadComplete);
			getDashboardData();
		};

		const getDashboardData = () => {
			let params: { userIdx: string; startDt?: number; endDt?: number } = {
				userIdx: getUserData().userIdx,
			};

			if (getUserData().userType === UserType.USER) {
				params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx as string;
			} else if (getUserData().userType === UserType.MANAGER) {
				params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx as string;
			} else if (getUserData().userType === UserType.USER_DEVICE) {
				if (params.userIdx !== getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx) {
					params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx as string;
				}
			}
			apiClient.value.post('/api/1/health/getActivity', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					let resentData = data[0];
					// const lastedUpdatePeriod = new Date(resentData.period.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3 $4:$5'));

					// let now = moment(new Date());
					// let lastedUpdate = moment(lastedUpdatePeriod);
					// if (moment.duration(now.diff(lastedUpdate)).asMinutes() < 30) {
					healthWorkingInfo.value = {
						...healthWorkingInfo.value,
						value: getNumberFormat(resentData.totalStepCount),
					};
					// }
				}
			});

			apiClient.value.post('/api/1/health/getHeartRate', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					let resentData = data[0];
					const lastedUpdatePeriod = new Date(resentData.period.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3 $4:$5'));

					let now = moment(new Date());
					let lastedUpdate = moment(lastedUpdatePeriod);
					healthHeartrateInfo.value = {
						...healthHeartrateInfo.value,
						value: getNumberFormat(resentData.value),
						prefixSub: '',
					};
					if (moment.duration(now.diff(lastedUpdate)).asMinutes() > 30) {
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
					const lastedUpdatePeriod = new Date(resentData.period.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3 $4:$5'));

					let now = moment(new Date());
					let lastedUpdate = moment(lastedUpdatePeriod);
					healthTemperatureInfo.value = {
						...healthTemperatureInfo.value,
						value: getNumberFormat(resentData.value),
						prefixSub: '',
					};
					if (moment.duration(now.diff(lastedUpdate)).asMinutes() > 30) {
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

			apiClient.value.post('/api/1/health/getOxygen', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					let resentData = data[0];
					healthOxygenInfo.value = {
						...healthOxygenInfo.value,
						value: getNumberFormat(resentData.value),
					};
				}
			});

			apiClient.value.post('/api/1/health/getStress', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
					let resentData = data[0];
					healthStressInfo.value = {
						...healthStressInfo.value,
						value: getNumberFormat(resentData.value),
					};
				}
			});

			params.startDt = Number(moment(new Date()).format('YYYYMMDD0000'));
			params.endDt = Number(moment(new Date()).format('YYYYMMDD9999'));
			apiClient.value.post('/api/1/health/getSleepTime', params).then(res => {
				let { data } = res.data;
				if (data && data.length > 0) {
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
			router.push(`/health/${path}`);
			pageHealthType.value = path as ChartDataTypes;
		};

		const setCurrentGroup = () => {
			const cur = getGroupManager().getCurrentGroup();
			currentGroup.value = cur;
		};

		const goBack = () => {
			if (userType.value !== UserType.MANAGER) return;
			getGroupManager().setCurrentGroup(undefined);
		};

		// const handleGroupLoadComplete = () => {
		// 	getDashboardData();
		// };

		const handleBinding = () => {
			getDashboardData();
			// try {
			// 	const isReady = getGroupManager().isReady;
			// 	if (isReady) getDashboardData();
			// 	else getGroupManager().addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
			// } catch (e) {
			// 	if (e instanceof NotChatReadyException) {
			// 		const groupManager = createGroupManager();
			// 		groupManager.addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
			// 		groupManager.launchChat();
			// 	} else {
			// 		throw e;
			// 	}
			// }
		};

		watch(
			() => route.name,
			() => {
				if (route.params.type) {
					pageHealthType.value = route.params.type as ChartDataTypes;
				} else {
					pageHealthType.value = '';
					getDashboardData();
				}
			},
		);

		onMounted(async () => {
			handleBinding();

			await router.isReady();
			switch ((route.params.type ?? '') as string) {
				case HEALTH_TYPE.WORKING:
					pageTitle.value = '걸음수';
					break;
				case HEALTH_TYPE.SLEEP:
					pageTitle.value = '수면';
					break;
				case HEALTH_TYPE.HEARTRATE:
					pageTitle.value = '심박수';
					break;
				case HEALTH_TYPE.BLOODPRESSURE:
					pageTitle.value = '혈압';
					break;
				case HEALTH_TYPE.OXYGEM:
					pageTitle.value = '산소포화도';
					break;
				case HEALTH_TYPE.STRESS:
					pageTitle.value = '스트레스';
					break;
				case HEALTH_TYPE.TEMPERATURE:
					pageTitle.value = '체온';
					break;
				default:
					pageTitle.value = '건강정보';
					break;
			}

			if (route.params.type) {
				pageHealthType.value = route.params.type as ChartDataTypes;
			}
			const userData = getUserData();
			if (userData && userData.userType) userType.value = userData.userType;
			setCurrentGroup();
		});

		watch(
			() => routeParamType.value,
			() => {
				switch ((routeParamType.value ?? '') as string) {
					case HEALTH_TYPE.WORKING:
						pageTitle.value = '걸음수';
						break;
					case HEALTH_TYPE.SLEEP:
						pageTitle.value = '수면';
						break;
					case HEALTH_TYPE.HEARTRATE:
						pageTitle.value = '심박수';
						break;
					case HEALTH_TYPE.BLOODPRESSURE:
						pageTitle.value = '혈압';
						break;
					case HEALTH_TYPE.OXYGEM:
						pageTitle.value = '산소포화도';
						break;
					case HEALTH_TYPE.STRESS:
						pageTitle.value = '스트레스';
						break;
					case HEALTH_TYPE.TEMPERATURE:
						pageTitle.value = '체온';
						break;
					default:
						pageTitle.value = '건강정보';
						break;
				}
			},
		);

		onUnmounted(() => {
			// getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
		});

		return {
			HEALTH_TYPE,
			pageTitle,
			pageHealthType,
			healthInfo,
			userType,
			UserType,
			currentGroup,
			goToHealthPage,
			goBack,
		};
	},
});
</script>

<template>
	<layout-header :title="pageTitle" :is-disabled-back="pageHealthType === '' && userType !== UserType.MANAGER" :before-go-back="goBack" />
	<section class="health-overview scroll-body" v-if="pageHealthType === ''">
		<article class="info px-[20px] pt-[30px]">
			<user-info v-if="userType === UserType.MANAGER && currentGroup" :current-group="currentGroup"></user-info>
			<div class="contents-wrapper grid grid-cols-2 gap-[10px] pt-[20px]" :class="userType === UserType.MANAGER ? 'gap-[20px]' : ''">
				<template v-for="item in healthInfo" :key="item.type">
					<div
						v-if="item.type === HEALTH_TYPE.STRESS"
						class="board detail-info flex flex-col justify-between stress"
						@click="goToHealthPage(item.type)">
						<div class="flex justify-between items-center">
							<span class="title">{{ item.title }}</span>
							<span class="icon"><kp-image :src="`images/icon/ico-main-${item.type}.svg`" /></span>
						</div>
						<div class="value">
							<slider
								v-model="item.value"
								:disabled="true"
								:alwaysShowHandle="true"
								color="#8A8D9F"
								track-color="#F4F5F7"
								:handleScale="1.5"
								:height="8" />
							{{ item.value }}
							<div class="prefix">{{ item.prefix }}</div>
						</div>
					</div>
					<div v-else class="board detail-info flex flex-col justify-between" :class="item.type" @click="goToHealthPage(item.type)">
						<div class="flex justify-between items-center">
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
			</div>
		</article>
	</section>
	<chart-view v-else :data-type="pageHealthType" />
</template>

<style scoped></style>
