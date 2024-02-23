<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import KpButton from '@components/common/KpButton.vue';
import { useRouter } from 'vue-router';
import { getApiClient } from '@utils/api-client';
import { getUserData } from '@utils/common-utils';
import { useStore } from 'vuex';
import AppConfig from '@src/constants';
import { AndroidEventType, DeviceConnectStateType } from '@src/types/types';

export default defineComponent({
	name: 'DeviceFirmwareUpdate',
	components: { KpButton, LayoutHeader },
	setup() {
		const store = useStore();
		const router = useRouter();
		const isNeedUpdate = ref<boolean>(false);
		const deviceInfo = ref<{ firmwareName: string; firmwareVersion: string; macAddress: string }>({
			firmwareName: '',
			firmwareVersion: '-',
			macAddress: '-',
		});
		const newFirmware = ref<any>({ name: '', version: '', fileInfo: '' });
		const compVersions = computed(() => {
			const sp = deviceInfo.value.firmwareVersion.split('V');
			if (sp.length < 2) return 0;

			return Number(sp[1]);
		});
		const compNewVersions = computed(() => {
			const sp = newFirmware.value.version.split('V');
			if (sp.length < 2) return 0;

			return Number(sp[1]);
		});

		const getConnectedDeviceInfo = (deviceIdx: string, appDeviceInfo?: any) => {
			if (deviceIdx) {
				getApiClient(AppConfig.API_URL, store)
					.post('/api/1/device/getDeviceInfo', { deviceIdx })
					.then(res => {
						if (res.data.resultCode === 0) {
							const latestData = res.data.data[0];
							deviceInfo.value = {
								firmwareName: latestData?.firmwareName ?? '',
								firmwareVersion: (appDeviceInfo?.firmwareVersion ? appDeviceInfo?.firmwareVersion : latestData?.firmwareVersion) ?? '', // latestData?.firmwareVersion
								macAddress: latestData?.macAddress,
							};

							getFirmwareList();
						}
					});
			}
		};

		const getFirmwareList = () => {
			getApiClient(AppConfig.API_URL, store)
				.post('/api/1/device-firmware/getDeviceFirmwareInfo')
				.then(res => {
					if (res.data.resultCode === 0) {
						newFirmware.value = {
							name: res.data.data.dataList[0].firmwareName,
							version: res.data.data.dataList[0].firmwareVersion,
							fileInfo: res.data.data.dataList[0].fileInfo,
						};
					}
				});
		};

		const doUpdate = () => {
			window.appInterface.startFirmwareUpgrade(newFirmware.value.fileInfo);
		};

		const getDeviceConnectState = (e: Event) => {
			if ((e as CustomEvent).detail.indexOf(DeviceConnectStateType.DISCONNECTED) > -1) {
				window.alert('기기연결이 끊어졌습니다.');
				router.back();
			}
		};

		const getDeviceInfo = (e: Event) => {
			let deviceInfoJson = JSON.parse((e as CustomEvent).detail);

			if (deviceInfoJson) {
				// deviceInfo.value = {
				// 				firmwareName: deviceInfoJson.firmware ?? '',
				// 				firmwareVersion: firmwareVersion ?? '',
				// 				macAddress: macAddress,
				// 			};

				getConnectedDeviceInfo(getUserData().deviceIdx, deviceInfoJson);
			}
		};

		const handleUpgradeFirmware = (e: Event) => {
			let callbackState = JSON.parse((e as CustomEvent).detail);
			switch (callbackState) {
				case 'FIRMWARE_SUCCESS':
					window.alert('업그레이드가 완료되었습니다.');
					break;
				case 'FIRMWARE_FAILED':
					window.alert('업그레이드에 실패하였습니다.');
					break;
				case 'FIRMWARE_CANCELED':
					window.alert('업그레이드가 취소되었습니다.');
					break;
				case 'FIRMWARE_PREPARE':
				case 'FIRMWARE_PROGRESS':
				case 'FIRMWARE_RETRY':
				default:
					break;
			}
		};

		watch(
			() => newFirmware.value,
			() => {
				if (compVersions.value === compNewVersions.value) {
					isNeedUpdate.value = false;
				} else if (compNewVersions.value < 1) {
					isNeedUpdate.value = false;
				} else {
					isNeedUpdate.value = true;
				}
			},
		);

		onMounted(() => {
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_INFO, getDeviceInfo);
			window.appInterface.addEventListener(AndroidEventType.UPGRADE_FIRMWARE_CALLBACK, handleUpgradeFirmware);
			window.appInterface.getDeviceInfo();
		});

		onUnmounted(() => {
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_INFO, getDeviceInfo);
			window.appInterface.removeEventListener(AndroidEventType.UPGRADE_FIRMWARE_CALLBACK, handleUpgradeFirmware);
		});

		return {
			isNeedUpdate,
			deviceInfo,
			newFirmware,
			doUpdate,
		};
	},
});
</script>

<template>
	<layout-header title="펌웨어 업데이트" />
	<section class="firmware-update">
		<article class="title-wrapper">
			<p class="title">펌웨어 업데이트</p>
			<p class="desc mt-[5px]">
				펌웨어의 현재 버전을 확인하고<br />
				최신 버전으로 업데이트 할 수 있습니다.
			</p>
		</article>
		<article class="firmware-info-wrapper mt-[30px] py-[20px] px-[20px]">
			<ul class="firmware-info">
				<li><label>펌웨어 명 : </label>{{ deviceInfo?.firmwareName ?? '' }}</li>
				<li><label>맥 어드레스 : </label>{{ deviceInfo?.macAddress ?? '-' }}</li>
				<li><label>현재 버전 : </label>{{ deviceInfo?.firmwareVersion ?? '' }}</li>
			</ul>
		</article>
		<article class="firmware-info-wrapper mt-[10px] py-[20px] px-[20px]">
			<ul class="firmware-info">
				<li><label>최신 버전 : </label>{{ newFirmware?.version ?? '' }}</li>
			</ul>
		</article>
		<div class="btn-wrapper">
			<label class="firmware-desc flex justify-center mb-[15px]" v-if="!isNeedUpdate">펌웨어가 현재 최신 버전입니다.</label>
			<kp-button class="mb-[10px] h-[50px]" :is-disabled="!isNeedUpdate" :on-click="doUpdate">업데이트</kp-button>
		</div>
	</section>
</template>

<style scoped></style>
