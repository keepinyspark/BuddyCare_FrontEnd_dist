<script lang="ts">
import { defineComponent, nextTick, onMounted, onUnmounted, ref } from 'vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import KpLink from '@components/common/KpLink.vue';
import { useRouter } from 'vue-router';
import KpToggle from '@components/common/KpToggle.vue';
import { getApiClient } from '@utils/api-client';
import { getUserData } from '@utils/common-utils';
import { AndroidEventType, DeviceConnectStateType, PopupType } from '@src/types/types';
import KpTimePicker from '@components/common/KpTimePicker.vue';
import { SET_POPUP } from '@src/store/actions';
import { useStore } from 'vuex';
import DisturbPopup from '@components/popup/DisturbPopup.vue';
import AppConfig from '@src/constants';

export default defineComponent({
	name: 'DeviceNotDisturb',
	components: { DisturbPopup, KpTimePicker, KpToggle, KpLink, LayoutHeader },
	setup() {
		const store = useStore();
		const router = useRouter();
		const isOpenOption = ref<boolean>(true);
		const openPopup = ref<boolean>(false);
		const timeList = ref([
			{ hour: 9, min: 0, value: '09:00', label: '시작' },
			{ hour: 23, min: 0, value: '23:00', label: '종료' },
		]);
		const deviceInfo = ref<{ firmwareVersion: string; macAddress: string }>({
			firmwareVersion: '-',
			macAddress: '-',
		});
		const selectType = ref<string>('');

		const getDisturbMode = (e: Event) => {
			let setting = JSON.parse((e as CustomEvent).detail);
			isOpenOption.value = setting.isEnableDisturbMode;
			let fromTime = `${setting.fromHour.toString().padStart(2, '0')}:${setting.fromMinute.toString().padStart(2, '0')}`;
			let toTime = `${setting.toHour.toString().padStart(2, '0')}:${setting.toMinute.toString().padStart(2, '0')}`;
			timeList.value = [
				{ hour: setting.fromHour, min: setting.fromMinute, value: fromTime, label: '시작' },
				{ hour: setting.toHour, min: setting.toMinute, value: toTime, label: '종료' },
			];
		};

		const onClickTime = (type: string) => {
			selectType.value = type;
			store.dispatch(SET_POPUP, PopupType.DISTURB);
			openPopup.value = true;
		};

		const changeOption = () => {
			let setting = {
				isEnableDisturbMode: isOpenOption.value,
				fromHour: timeList.value[0].hour,
				fromMinute: timeList.value[0].min,
				toHour: timeList.value[1].hour,
				toMinute: timeList.value[0].min,
			};
			window.appInterface.setDisturbModeSetting(setting);
		};

		const getConnectedDeviceInfo = (deviceIdx: string) => {
			if (deviceIdx) {
				getApiClient(AppConfig.API_URL, store)
					.post('/api/1/device/getDeviceInfo', { deviceIdx })
					.then(res => {
						if (res.data.resultCode === 0) {
							const { deviceName, macAddress, firmwareVersion } = res.data.data[0];
							deviceInfo.value = {
								firmwareVersion: firmwareVersion,
								macAddress: macAddress,
							};
						}
					});
			}
		};

		const handleSubmit = (data: any) => {
			let times = Array.from(timeList.value);
			let selectTime = times.filter(t => t.label === data.type);
			let selectTimeIndex = times.findIndex(t => t.label === data.type);
			if (selectTime && selectTime.length > 0) {
				selectTime[0].hour = data.hour;
				selectTime[0].min = data.min;
				selectTime[0].value = `${data.hour.toString().padStart(2, '0')}:${data.min.toString().padStart(2, '0')}`;
			}
			times[selectTimeIndex] = selectTime[0];
			timeList.value = times;
			store.dispatch(SET_POPUP, PopupType.NONE);
			openPopup.value = false;

			nextTick(() => {
				changeOption();
			});
		};

		const handleCancel = () => {
			store.dispatch(SET_POPUP, PopupType.NONE);
			openPopup.value = false;
		};

		const getDeviceConnectState = (e: Event) => {
			if ((e as CustomEvent).detail.indexOf(DeviceConnectStateType.DISCONNECTED) > -1) {
				window.alert('기기연결이 끊어졌습니다.');
				router.back();
			}
		};

		onMounted(() => {
			window.appInterface.addEventListener(AndroidEventType.GET_DISTURB_MODE, getDisturbMode);
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.getDisturbModeSetting();
			getConnectedDeviceInfo(getUserData().deviceIdx);
		});

		onUnmounted(() => {
			window.appInterface.removeEventListener(AndroidEventType.GET_DISTURB_MODE, getDisturbMode);
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
		});

		return {
			isOpenOption,
			timeList,
			onClickTime,
			doToggle: () => {
				isOpenOption.value = !isOpenOption.value;
				changeOption();
			},
			changeOption,
			openPopup,
			selectType,
			handleSubmit,
			handleCancel,
		};
	},
});
</script>

<template>
	<layout-header title="방해 금지 모드" />
	<section class="device-not-disturb">
		<article class="title-wrapper flex flex-row justify-between">
			<div class="flex flex-col">
				<p class="title">방해 금지 모드</p>
				<p class="desc mt-[5px]">
					설정하신 시간대의 알림은<br />
					무음으로 수신됩니다.
				</p>
			</div>
			<kp-toggle :is-checked="isOpenOption" @onToggleClick="doToggle" />
		</article>
		<article class="update-time mt-[30px] py-[5px] px-[20px]" v-if="isOpenOption">
			<ul>
				<li v-for="(item, index) in timeList" :key="index" class="flex items-center">
					<span class="px-[10px]">{{ item.label }}</span>
					<kp-link :on-click="() => onClickTime(item.label)">{{ item.value }}</kp-link>
				</li>
			</ul>
		</article>
	</section>
	<disturb-popup
		v-if="openPopup"
		:type="selectType"
		:hour="timeList.filter(t => t.label === selectType)[0].hour"
		:min="timeList.filter(t => t.label === selectType)[0].min"
		:submit-handler="handleSubmit"
		:cancel-handler="handleCancel" />
</template>

<style scoped></style>
