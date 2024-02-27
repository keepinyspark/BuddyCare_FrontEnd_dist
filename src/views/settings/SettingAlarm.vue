<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, ref } from 'vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import KpImage from '@components/common/KpImage.vue';
import KpSelectBox, { SelectOptionInterface } from '@components/common/KpSelectBox.vue';
import KpButton from '@components/common/KpButton.vue';
import { useRouter } from 'vue-router';
import KpToggle from '@components/common/KpToggle.vue';
import { getUserData } from '@utils/common-utils';
import { UserType } from '@src/types/types';
import { getApiClient } from '@utils/api-client';
import { useStore } from 'vuex';
import AppConfig from '@src/constants';
import {
	getBloodNotice,
	getHeartNotice,
	getOxyNotice,
	getSleepNotice,
	getStressNotice,
	getTempNotice,
	insertBloodNotice,
	insertHeartNotice,
	insertOxygenNotice,
	insertSleepNotice,
	insertStressNotice,
	insertTemperatureNotice,
} from '@utils/setting/api/setting-api';

export default defineComponent({
	name: 'SettingAlarm',
	components: { KpToggle, KpButton, KpSelectBox, KpImage, LayoutHeader },
	setup: function () {
		const store = useStore();
		const apiClient = computed(() => getApiClient(AppConfig.API_URL, store));
		const router = useRouter();
		const isHeartAlarm = ref<boolean>(false);
		const isTemperatureAlarm = ref<boolean>(false);
		const isBloodAlarm = ref<boolean>(false);
		const isSleepAlarm = ref<boolean>(false);
		const isOxygenAlarm = ref<boolean>(false);
		const isStressAlarm = ref<boolean>(false);
		const isDeviceUser = ref<boolean>();

		const heartValue = ref('');
		const heartOptions = ref<SelectOptionInterface[]>([]);
		const temperatureLowValue = ref('');
		const temperatureLowOptions = ref<SelectOptionInterface[]>([]);
		const temperatureHighValue = ref('');
		const temperatureHighOptions = ref<SelectOptionInterface[]>([]);
		const bloodLowValue = ref('');
		const bloodLowOptions = ref<SelectOptionInterface[]>([]);
		const bloodHighValue = ref('');
		const bloodHighOptions = ref<SelectOptionInterface[]>([]);
		const sleepValue = ref('');
		const sleepOptions = ref<SelectOptionInterface[]>([]);
		const oxygenValue = ref('');
		const oxygenOptions = ref<SelectOptionInterface[]>([]);
		const stressValue = ref('');
		const stressOptions = ref<SelectOptionInterface[]>([]);

		const setHeartOptions = () => {
			let options: SelectOptionInterface[] = [];
			for (let i = 15; i < 30; i++) {
				options.push({
					value: (i * 5).toString(),
					label: (i * 5).toString(),
				});
			}
			heartOptions.value = options;
		};

		const setTemperatureOptions = () => {
			let options: SelectOptionInterface[] = [];
			for (let i = 70; i < 80; i++) {
				options.push({
					value: (i * 0.5).toFixed(1).toString(),
					label: (i * 0.5).toFixed(1).toString(),
				});
			}
			temperatureLowOptions.value = options;
			temperatureHighOptions.value = options;
		};

		const setBloodOptions = () => {
			let options: SelectOptionInterface[] = [];
			for (let i = 14; i < 45; i++) {
				options.push({
					value: (i * 5).toString(),
					label: (i * 5).toString(),
				});
			}
			bloodLowOptions.value = options;
			bloodHighOptions.value = options;
		};

		const setSleepOptions = () => {
			let options: SelectOptionInterface[] = [];
			for (let i = 1; i < 25; i++) {
				options.push({
					value: i.toString(),
					label: i.toString(),
				});
			}
			sleepOptions.value = options;
		};

		const setOxygenOptions = () => {
			let options: SelectOptionInterface[] = [];
			for (let i = 0; i < 21; i++) {
				options.push({
					value: (i * 5).toString(),
					label: (i * 5).toString(),
				});
			}
			oxygenOptions.value = options;
		};

		const setStressOptions = () => {
			let options: SelectOptionInterface[] = [];
			for (let i = 0; i < 21; i++) {
				options.push({
					value: (i * 5).toString(),
					label: (i * 5).toString(),
				});
			}
			stressOptions.value = options;
		};

		const changeHeartAlarm = () => {
			isHeartAlarm.value = !isHeartAlarm.value;
		};

		const changeHeart = (value: string) => {
			heartValue.value = value;
		};

		const changeTemperatureAlarm = () => {
			isTemperatureAlarm.value = !isTemperatureAlarm.value;
		};

		const changeTemperatureLow = (value: string) => {
			temperatureLowValue.value = value;
		};

		const changeTemperatureHigh = (value: string) => {
			temperatureHighValue.value = value;
		};

		const changeBloodAlarm = () => {
			isBloodAlarm.value = !isBloodAlarm.value;
		};

		const changeBloodHigh = (value: string) => {
			bloodHighValue.value = value;
		};

		const changeBloodLow = (value: string) => {
			bloodLowValue.value = value;
		};

		const changeSleepAlarm = () => {
			isSleepAlarm.value = !isSleepAlarm.value;
		};

		const changeSleep = (value: string) => {
			sleepValue.value = value;
		};

		const changeOxygenAlarm = () => {
			isOxygenAlarm.value = !isOxygenAlarm.value;
		};

		const changeOxygen = (value: string) => {
			oxygenValue.value = value;
		};

		const changeStressAlarm = () => {
			isStressAlarm.value = !isStressAlarm.value;
		};

		const changeStress = (value: string) => {
			stressValue.value = value;
		};
		const onClickSave = () => {
			insertHeartAlarm();
			insertTemperatureAlarm();
			insertBloodAlarm();
			insertSleepAlarm();
			insertOxygenAlarm();
			insertStressAlarm();
			router.back();
		};

		const insertHeartAlarm = () => {
			let params = {
				deviceIdx: getUserData().deviceIdx,
				maxHeartRate: Number(heartValue.value),
				minHeartRate: 0,
				stateReg: isHeartAlarm.value ? 'Y' : 'N',
			};

			insertHeartNotice(apiClient.value, params);
		};

		const insertTemperatureAlarm = () => {
			let params = {
				deviceIdx: getUserData().deviceIdx,
				maxWaringTemp: Number(temperatureHighValue.value),
				minWaringTemp: Number(temperatureLowValue.value),
				stateReg: isTemperatureAlarm.value ? 'Y' : 'N',
			};
			insertTemperatureNotice(apiClient.value, params);
		};

		const insertBloodAlarm = () => {
			let params = {
				deviceIdx: getUserData().deviceIdx,
				maxBloodPressure: Number(bloodHighValue.value),
				minBloodPressure: Number(bloodLowValue.value),
				stateReg: isBloodAlarm.value ? 'Y' : 'N',
			};
			insertBloodNotice(apiClient.value, params);
		};

		const insertSleepAlarm = () => {
			let params = {
				deviceIdx: getUserData().deviceIdx,
				sleepQuality: (Number(sleepValue.value) * 60).toString(),
				stateReg: isSleepAlarm.value ? 'Y' : 'N',
			};
			insertSleepNotice(apiClient.value, params);
		};

		const insertOxygenAlarm = () => {
			let params = {
				deviceIdx: getUserData().deviceIdx,
				minOxy: Number(oxygenValue.value),
				maxOxy: Number(oxygenValue.value),
				stateReg: isOxygenAlarm.value ? 'Y' : 'N',
			};
			insertOxygenNotice(apiClient.value, params);
		};

		const insertStressAlarm = () => {
			let params = {
				deviceIdx: getUserData().deviceIdx,
				maxStress: Number(stressValue.value),
				minStress: Number(stressValue.value),
				stateReg: isStressAlarm.value ? 'Y' : 'N',
			};
			insertStressNotice(apiClient.value, params);
		};

		const onClickCancel = () => {
			router.back();
		};

		const getNoticeInfo = () => {
			let params = {
				deviceIdx: getUserData().deviceIdx,
			};
			getHeartNotice(apiClient.value, params).then((res: { data: string | any[] }) => {
				if (res.data.length > 0) {
					heartValue.value = res.data[0].maxHeartRate.toString();
					isHeartAlarm.value = res.data[0].stateReg === 'Y';
				} else {
					heartValue.value = '105';
					isHeartAlarm.value = true;

					nextTick(() => {
						insertHeartAlarm();
					});
				}
			});
			getTempNotice(apiClient.value, params).then((res: { data: string | any[] }) => {
				if (res.data.length > 0) {
					temperatureHighValue.value = Number(res.data[0].maxWaringTemp).toFixed(1).toString();
					temperatureLowValue.value = Number(res.data[0].minWaringTemp).toFixed(1).toString();
					isTemperatureAlarm.value = res.data[0].stateReg === 'Y';
				} else {
					temperatureHighValue.value = '37.5';
					temperatureLowValue.value = '36.0';
					isTemperatureAlarm.value = true;

					nextTick(() => {
						insertTemperatureAlarm();
					});
				}
			});
			getBloodNotice(apiClient.value, params).then((res: { data: string | any[] }) => {
				if (res.data.length > 0) {
					bloodHighValue.value = res.data[0].maxBloodPressure;
					bloodLowValue.value = res.data[0].minBloodPressure;
					isBloodAlarm.value = res.data[0].stateReg === 'Y';
				} else {
					bloodHighValue.value = '130';
					bloodLowValue.value = '70';
					isBloodAlarm.value = true;

					nextTick(() => {
						insertBloodAlarm();
					});
				}
			});
			getSleepNotice(apiClient.value, params).then((res: { data: string | any[] }) => {
				if (res.data.length > 0) {
					sleepValue.value = Math.floor(Number(res.data[0].sleepQuality) / 60).toString();
					isSleepAlarm.value = res.data[0].stateReg === 'Y';
				} else {
					sleepValue.value = '6';
					isSleepAlarm.value = true;

					nextTick(() => {
						insertSleepAlarm();
					});
				}
			});
			getOxyNotice(apiClient.value, params).then((res: { data: string | any[] }) => {
				if (res.data.length > 0) {
					oxygenValue.value = res.data[0].maxOxy;
					isOxygenAlarm.value = res.data[0].stateReg === 'Y';
				} else {
					oxygenValue.value = '95';
					isOxygenAlarm.value = true;

					nextTick(() => {
						insertOxygenAlarm();
					});
				}
			});
			getStressNotice(apiClient.value, params).then((res: { data: string | any[] }) => {
				if (res.data.length > 0) {
					stressValue.value = res.data[0].maxStress;
					isStressAlarm.value = res.data[0].stateReg === 'Y';
				} else {
					stressValue.value = '40';
					isStressAlarm.value = true;

					nextTick(() => {
						insertStressAlarm();
					});
				}
			});
		};

		onMounted(() => {
			setHeartOptions();
			setTemperatureOptions();
			setBloodOptions();
			setSleepOptions();
			setOxygenOptions();
			setStressOptions();

			getNoticeInfo();
			isDeviceUser.value = getUserData().userType === UserType.USER_DEVICE;
		});

		return {
			heartValue,
			heartOptions,
			temperatureLowValue,
			temperatureLowOptions,
			temperatureHighValue,
			temperatureHighOptions,
			isHeartAlarm,
			bloodLowValue,
			bloodLowOptions,
			bloodHighValue,
			bloodHighOptions,
			sleepValue,
			sleepOptions,
			oxygenValue,
			oxygenOptions,
			stressValue,
			stressOptions,

			isTemperatureAlarm,
			isBloodAlarm,
			isSleepAlarm,
			isOxygenAlarm,
			isStressAlarm,

			changeHeartAlarm,
			changeTemperatureAlarm,
			changeBloodAlarm,
			changeSleepAlarm,
			changeOxygenAlarm,
			changeStressAlarm,

			changeHeart,
			changeTemperatureLow,
			changeTemperatureHigh,
			changeBloodHigh,
			changeBloodLow,
			changeSleep,
			changeOxygen,
			changeStress,

			isDeviceUser,

			onClickSave,
			onClickCancel,
		};
	},
});
</script>

<template>
	<layout-header title="경고 알림 설정"></layout-header>
	<section class="setting-alarm">
		<article>
			<div class="flex justify-between items-center">
				<div class="flex">
					<span class="icon mr-[10px]"><kp-image :src="`images/icon/ico-main-heart-rate.svg`" /></span>
					<span class="title">심박수</span>
				</div>
				<kp-toggle :is-checked="isHeartAlarm" @onToggleClick="changeHeartAlarm" />
			</div>
			<div class="mt-[20px]">
				<kp-select-box :select-value="heartValue" :options="heartOptions" :is-disabled="!isDeviceUser" @onChange="changeHeart" />
				<label class="select-prefix">bpm 초과</label>
			</div>
			<div class="mt-[10px] select-warning">*성인 평균 심박수: 분당 60~100회</div>
		</article>
		<article class="mt-[20px]">
			<div class="flex justify-between items-center">
				<div class="flex">
					<span class="icon mr-[10px]"><kp-image :src="`images/icon/ico-main-temperature.svg`" /></span>
					<span class="title">체온</span>
				</div>
				<kp-toggle :is-checked="isTemperatureAlarm" @onToggleClick="changeTemperatureAlarm" />
			</div>
			<div class="mt-[20px]">
				<kp-select-box
					:select-value="temperatureHighValue"
					:options="temperatureHighOptions"
					:is-disabled="!isDeviceUser"
					@onChange="changeTemperatureHigh" />
				<label class="select-prefix">°C 초과</label>
			</div>
			<div class="mt-[10px]">
				<kp-select-box
					:select-value="temperatureLowValue"
					:options="temperatureLowOptions"
					:is-disabled="!isDeviceUser"
					@onChange="changeTemperatureLow" />
				<label class="select-prefix">°C 미만</label>
			</div>
			<div class="mt-[10px] select-warning">*성인 평균 체온: 36.0~37.0°C</div>
		</article>
		<article class="mt-[20px]">
			<div class="flex justify-between items-center">
				<div class="flex">
					<span class="icon mr-[10px]"><kp-image :src="`images/icon/ico-main-blood-pressure.svg`" /></span>
					<span class="title">혈압</span>
				</div>
				<kp-toggle :is-checked="isBloodAlarm" @onToggleClick="changeBloodAlarm" />
			</div>
			<div class="mt-[20px]">
				<label class="select-title">수축기</label>
				<kp-select-box :select-value="bloodHighValue" :options="bloodHighOptions" :is-disabled="!isDeviceUser" @onChange="changeBloodHigh" />
				<label class="select-prefix">mmHg 초과</label>
			</div>
			<div class="mt-[10px]">
				<label class="select-title">이완기</label>
				<kp-select-box :select-value="bloodLowValue" :options="bloodLowOptions" :is-disabled="!isDeviceUser" @onChange="changeBloodLow" />
				<label class="select-prefix">mmHg 미만</label>
			</div>
			<div class="mt-[10px] select-warning">*성인 평균 혈압: 수축기 120 이하 / 이완기 80 이상</div>
		</article>
		<article class="mt-[20px]">
			<div class="flex justify-between items-center">
				<div class="flex">
					<span class="icon mr-[10px]"><kp-image :src="`images/icon/ico-main-sleep.svg`" /></span>
					<span class="title">수면</span>
				</div>
				<kp-toggle :is-checked="isSleepAlarm" @onToggleClick="changeSleepAlarm" />
			</div>
			<div class="mt-[20px]">
				<kp-select-box :select-value="sleepValue" :options="sleepOptions" :is-disabled="!isDeviceUser" @onChange="changeSleep" />
				<label class="select-prefix">시간 미만</label>
			</div>
		</article>
		<article class="mt-[20px]">
			<div class="flex justify-between items-center">
				<div class="flex">
					<span class="icon mr-[10px]"><kp-image :src="`images/icon/ico-main-oxygen.svg`" /></span>
					<span class="title">산소포화도</span>
				</div>
				<kp-toggle :is-checked="isOxygenAlarm" @onToggleClick="changeOxygenAlarm" />
			</div>
			<div class="mt-[20px]">
				<kp-select-box :select-value="oxygenValue" :options="oxygenOptions" :is-disabled="!isDeviceUser" @onChange="changeOxygen" />
				<label class="select-prefix">% 미만</label>
			</div>
			<div class="mt-[10px] select-warning">*산소포화도 정상수치: 95% 이상</div>
		</article>
		<article class="mt-[20px]">
			<div class="flex justify-between items-center">
				<div class="flex">
					<span class="icon mr-[10px]"><kp-image :src="`images/icon/ico-main-stress.svg`" /></span>
					<span class="title">스트레스</span>
				</div>
				<kp-toggle :is-checked="isStressAlarm" @onToggleClick="changeStressAlarm" />
			</div>
			<div class="mt-[20px]">
				<kp-select-box :select-value="stressValue" :options="stressOptions" :is-disabled="!isDeviceUser" @onChange="changeStress" />
				<label class="select-prefix">% 초과</label>
			</div>
			<div class="mt-[10px] select-warning">*성인 평균 정상 범위: 25 이하</div>
		</article>
		<div class="btn-wrapper">
			<kp-button :on-click="onClickSave">저장</kp-button>
			<kp-button class="mt-[10px]" :on-click="onClickCancel" is-secondary>취소</kp-button>
		</div>
	</section>
</template>

<style scoped></style>
