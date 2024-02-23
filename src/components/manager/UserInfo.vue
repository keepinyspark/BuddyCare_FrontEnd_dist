<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, onUnmounted, PropType, ref, watch } from 'vue';
import KpImage from '@components/common/KpImage.vue';
import { getUserData, parsedImgSrc } from '@utils/common-utils';
import { Group } from '@utils/group/dto/group';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import KpLink from '@components/common/KpLink.vue';
import { getGroupManager } from '@utils/group/group-instance';
import { useRouter } from 'vue-router';
import { getApiClient } from '@utils/api-client';
import AppConfig from '@src/constants';
import { UserType } from '@src/types/types';
import { useStore } from 'vuex';

export default defineComponent({
	name: 'UserInfo',
	components: { KpLink, KpImage },
	props: {
		currentGroup: {
			type: Object as PropType<Group>,
			required: true,
		},
		needWatch: {
			type: Boolean as PropType<boolean>,
			default: false,
		},
	},
	setup(props) {
		const store = useStore();
		const router = useRouter();
		const battery = ref<number>(0);
		const chartConfig = ref<object | null>(null);
		const chartRef = ref<HTMLCanvasElement | null>(null);
		const chartRefEmergency = ref<HTMLCanvasElement | null>(null);
		const group = computed(() => props.currentGroup);
		const batteryVisible = ref<boolean>(false);
		const userProfile = ref<string>();

		const creatorProfileResolver = (): void => {
			if (group.value) {
				try {
					const creatorProfile = group.value.creatorInfo?.userProfile;
					userProfile.value = parsedImgSrc(creatorProfile);
				} catch (e) {}
			}
		};

		const getBatteryChartData = () => {
			return {
				datasets: [
					{
						data: [100 - battery.value, battery.value],
						backgroundColor: [
							props.needWatch && group.value?.emergencyState ? '#DC2626' : '#ffffff',
							props.needWatch && group.value?.emergencyState ? '#FFFFFF' : 'rgba(44, 128, 255, 1)',
						],
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
					},
					animation: {
						animateScale: false,
						animateRotate: true,
					},
				},
			};
		};

		const handleSelectUser = () => {
			getGroupManager().setCurrentGroup(group.value.groupIdx);
			router.push({ path: '/health' });
		};

		const getDeviceInfo = () => {
			if (group.value) {
				if (group.value.creatorInfo?.deviceIdx) {
					try {
						getApiClient(AppConfig.API_URL, store)
							.post('/api/1/device/getDeviceInfo', { deviceIdx: group.value.creatorInfo?.deviceIdx })
							.then(res => {
								if (res.data.resultCode === 0) {
									const { batteryLevel } = res.data.data[0];
									battery.value = Number(batteryLevel);
									batteryVisible.value = true;
									nextTick(() => {
										drawChart();
									});
								}
							});
					} catch (e) {}
				} else {
					batteryVisible.value = false;
				}
			}
		};

		const drawChart = () => {
			chartConfig.value = getBatteryChartConfig();

			if (chartRef.value) {
				let chart = Chart.getChart(chartRef.value as HTMLCanvasElement);
				if (chart) {
					chart.destroy();
				}
			}

			if (chartRef.value && chartConfig.value) {
				// @ts-ignore
				new Chart(chartRef.value, chartConfig.value as ChartConfiguration);
			}
		};

		watch(
			() => battery.value,
			() => {
				drawChart();
			},
		);

		watch(
			() => chartRef.value,
			() => {
				if (chartRef.value) drawChart();
			},
		);

		onMounted(() => {
			creatorProfileResolver();
			getDeviceInfo();
		});

		onUnmounted(() => {});

		return {
			group,
			chartRef,
			chartRefEmergency,
			battery,
			batteryVisible,
			userProfile,
			handleSelectUser,
			creatorProfileResolver,
		};
	},
});
</script>

<template>
	<div
		class="user-info-wrapper manager-box-shadow w-full h-[120px] flex justify-between items-center bg-[#fff] px-[25px] rounded-[15px]"
		:class="{ emergency: group.emergencyState && needWatch }">
		<div class="inline-flex flex-row justify-center items-center" @click.stop.prevent="handleSelectUser">
			<kp-image
				v-if="userProfile"
				class="w-[80px] h-[80px] mr-[25px] rounded-[50%] object-cover"
				:src="userProfile"
				@click.stop.prevent="handleSelectUser"></kp-image>
			<div v-else class="w-[80px] h-[80px] mr-[25px] profile-background">
				<kp-image src="/images/common/base-profile.svg"></kp-image>
			</div>

			<div class="inline-flex flex-col">
				<span v-if="group && group.creatorInfo" class="inline-flex name mb-[5px]" :class="{ emergency: group.emergencyState && needWatch }">{{
					group.creatorInfo.username
				}}</span>
				<span v-if="group && group.creatorInfo" class="inline-flex id" :class="{ emergency: group.emergencyState && needWatch }">{{
					group.creatorInfo.userId
				}}</span>
			</div>
		</div>
		<div v-if="batteryVisible" class="battery-wrapper h-full py-[25px]">
			<div class="battery flex items-center justify-center" :class="{ emergency: group.emergencyState && needWatch }">
				<kp-image v-if="group.emergencyState && needWatch" src="images/icon/ico-battery-white.svg" />
				<div v-else class="battery-img"><span :style="{ width: battery + '%' }" /></div>
				<div class="chart-wrapper" style="max-width: 48px">
					<canvas ref="chartRef" :id="group.groupIdx" />
				</div>
			</div>
			<div class="battery-percent pt-[10px] text-center" :class="{ emergency: group && group.emergencyState && needWatch }">{{ battery }}%</div>
		</div>
		<div v-else class="battery-wrapper h-full py-[25px]">
			<div class="battery-empty w-[40px] h-[40px] rounded-[50%] flex items-center justify-center mb-[10px]">
				<kp-image class="w-[25px] h-[25px]" src="images/icon/icon-base-battery.svg" />
			</div>
			<div class="w-[40px] h-[40px] flex justify-center items-start">
				<kp-image class="w-[25px] h-[19px]" src="images/icon/icon-base-percent.svg" />
			</div>
		</div>
	</div>
</template>

<style scoped></style>
