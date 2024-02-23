<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import KpImage from '@components/common/KpImage.vue';
import KpSelectBox, { SelectOptionInterface } from '@components/common/KpSelectBox.vue';
import KpButton from '@components/common/KpButton.vue';
import { useRouter } from 'vue-router';
import { getUserData } from '@utils/common-utils';
import { UserType } from '@src/types/types';
import { getApiClient } from '@utils/api-client';
import AppConfig from '@src/constants';
import { useStore } from 'vuex';

export default defineComponent({
	name: 'SettingTarget',
	components: { KpButton, KpSelectBox, KpImage, LayoutHeader },
	setup() {
		const store = useStore();
		const router = useRouter();
		const workingTarget = ref<string>('');
		const selectHour = ref<string>('');
		const selectMin = ref<string>('');
		const isDeviceUser = ref<boolean>();

		const workingOptions: SelectOptionInterface[] = [
			{
				label: '20,000',
				value: '20000',
			},
			{
				label: '18,000',
				value: '18000',
			},
			{
				label: '16,000',
				value: '16000',
			},
			{
				label: '14,000',
				value: '14000',
			},
			{
				label: '12,000',
				value: '12000',
			},
			{
				label: '10,000',
				value: '10000',
			},
			{
				label: '8,000',
				value: '8000',
			},
			{
				label: '6,000',
				value: '6000',
			},
			{
				label: '4,000',
				value: '4000',
			},
			{
				label: '2,000',
				value: '2000',
			},
			{
				label: '1,000',
				value: '1000',
			},
		];
		const sleepHourOptions = ref<SelectOptionInterface[]>([]);
		const sleepMinOptions = ref<SelectOptionInterface[]>([]);

		const onClickSave = () => {
			let params = { goalType: 'SLEEP', goalValue: Number(selectHour.value) * 60 + Number(selectMin.value) };

			getApiClient(AppConfig.API_URL, store)
				.post('/api/1/goal/insertGoalInfo', params)
				.then(res => {
					if (res.data.resultCode === 0) {
						params = { goalType: 'STEP', goalValue: Number(workingTarget.value) };
						getApiClient(AppConfig.API_URL, store)
							.post('/api/1/goal/insertGoalInfo', params)
							.then(res => {
								if (res.data.resultCode === 0) {
									window.alert('저장되었습니다.');
									router.back();
								}
							});
					}
				});
		};

		const onClickCancel = () => {
			router.back();
		};

		const onChangeWorking = (value: string) => {
			workingTarget.value = value;
		};

		const onChangeHour = (value: string) => {
			selectHour.value = value;
		};

		const onChangeMin = (value: string) => {
			selectMin.value = value;
		};

		const getGoalInfo = () => {
			getApiClient(AppConfig.API_URL, store)
				.post('/api/1/goal/getGoalInfo', { goalType: 'SLEEP' })
				.then(res => {
					if (res.data.resultCode === 0) {
						if (res.data.data.length > 0) {
							selectHour.value = Math.floor(Number(res.data.data[0].goalValue) / 60).toString();
							selectMin.value = Math.floor(Number(res.data.data[0].goalValue) % 60).toString();
						} else {
							selectHour.value = '8';
							selectMin.value = '0';
							let params = { goalType: 'SLEEP', goalValue: Number(selectHour.value) * 60 + Number(selectMin.value) };

							getApiClient(AppConfig.API_URL, store)
								.post('/api/1/goal/insertGoalInfo', params)
								.then(res => {
									if (res.data.resultCode === 0) {
									}
								});
						}
					}
				});
			getApiClient(AppConfig.API_URL, store)
				.post('/api/1/goal/getGoalInfo', { goalType: 'STEP' })
				.then(res => {
					if (res.data.resultCode === 0) {
						if (res.data.data.length > 0) {
							workingTarget.value = res.data.data[0].goalValue;
						} else {
							workingTarget.value = '10000';

							let params = { goalType: 'STEP', goalValue: Number(workingTarget.value) };
							getApiClient(AppConfig.API_URL, store)
								.post('/api/1/goal/insertGoalInfo', params)
								.then(res => {
									if (res.data.resultCode === 0) {
									}
								});
						}
					}
				});
		};

		onMounted(() => {
			let hours: SelectOptionInterface[] = [];
			let mins: SelectOptionInterface[] = [];
			for (let i = 1; i <= 24; i++) {
				hours.push({
					label: i.toString().padStart(2, '0'),
					value: i.toString(),
				});
			}
			sleepHourOptions.value = hours;
			for (let i = 0; i <= 60; i++) {
				mins.push({
					label: i.toString().padStart(2, '0'),
					value: i.toString(),
				});
			}
			sleepMinOptions.value = mins;
			isDeviceUser.value = getUserData().userType === UserType.USER_DEVICE;

			getGoalInfo();
		});

		return {
			workingTarget,
			workingOptions,
			selectHour,
			sleepHourOptions,
			selectMin,
			sleepMinOptions,
			isDeviceUser,
			onClickSave,
			onClickCancel,
			onChangeWorking,
			onChangeHour,
			onChangeMin,
		};
	},
});
</script>

<template>
	<layout-header title="목표 설정"></layout-header>
	<section class="setting-target">
		<article>
			<div class="flex justify-start items-center">
				<span class="icon mr-[10px]"><kp-image :src="`images/icon/ico-main-working.svg`" /></span>
				<span class="title">걸음 수 목표</span>
			</div>
			<div class="mt-[20px]">
				<kp-select-box :select-value="workingTarget" :options="workingOptions" :is-disabled="!isDeviceUser" @onChange="onChangeWorking" />
			</div>
		</article>
		<article class="mt-[20px]">
			<div class="flex justify-start items-center">
				<span class="icon mr-[10px]"><kp-image :src="`images/icon/ico-main-sleep.svg`" /></span>
				<span class="title">수면 시간 목표</span>
			</div>
			<div class="mt-[20px]">
				<kp-select-box :select-value="selectHour" :options="sleepHourOptions" :is-disabled="!isDeviceUser" @onChange="onChangeHour" />
				<label class="select-prefix">시간</label>
				<kp-select-box :select-value="selectMin" :options="sleepMinOptions" :is-disabled="!isDeviceUser" @onChange="onChangeMin" />
				<label class="select-prefix">분</label>
			</div>
		</article>
		<div class="btn-wrapper">
			<kp-button :on-click="onClickSave">저장</kp-button>
			<kp-button class="mt-[10px]" :on-click="onClickCancel" is-secondary>취소</kp-button>
		</div>
	</section>
</template>

<style scoped></style>
