<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import KpLink from '@components/common/KpLink.vue';
import KpImage from '@components/common/KpImage.vue';
import KpToggle from '@components/common/KpToggle.vue';
import KpButton from '@components/common/KpButton.vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import router from '@src/router';
import { useRouter } from 'vue-router';
import { getUserData, loadLocalData, setUserData } from '@utils/common-utils';
import { AndroidEventType, DeviceConnectStateType, LoginUserInfoInterface, UserType } from '@src/types/types';
import { getApiClient } from '@utils/api-client';
import { KEY_LIST } from '@src/constants-keys';
import { useStore } from 'vuex';
import AppConfig from '@src/constants';
import { callback } from 'chart.js/helpers';
import { SET_CONNECTED_STATUS } from '@src/store/actions';
import { getGroupManager } from '../../utils/group/group-instance';

export enum MENU_TYPE {
	WATCHFACE = 'watchface',
	UPDATECYCLE = 'update-cycle',
	NOTDISTURB = 'not-disturb',
	UPDATE = 'update',
	WRIST = 'wrist',
	SHAKE = 'shake',
	RESTART = 'restart',
	DISCONNECT = 'disconnect',
	RESET = 'reset',
}

interface DeviceInfoInterface {
	deviceIdx: string;
	deviceName: string;
	macAddress: string;
	version: string;
	battery: number;
	isConnect: boolean;
}

export default defineComponent({
	name: 'DeviceMenu',
	components: { LayoutHeader, KpButton, KpToggle, KpImage, KpLink },
	setup() {
		const store = useStore();
		const router = useRouter();
		const shakeHand = ref<'left' | 'right'>('right'); // false = 왼손, true = 오른손
		const isShake = ref<boolean>(true);
		const deviceInfo = ref<DeviceInfoInterface>({
			deviceIdx: '',
			deviceName: '-',
			macAddress: '-',
			version: '-',
			battery: 0,
			isConnect: false,
		});
		const userInfo = ref<LoginUserInfoInterface | null>(null);
		const compVersions = computed(() => {
			if (deviceInfo.value && deviceInfo.value.version) {
				const sp = deviceInfo.value.version.split('V');
				if (sp.length < 2) return '-';
				return sp[1];
			}
			return '-';
		});

		const deviceMenuList = [
			{ type: MENU_TYPE.WATCHFACE, name: '기기 화면 설정', hasArrow: true },
			{ type: MENU_TYPE.UPDATECYCLE, name: '정보 업데이트 주기', hasArrow: true },
			{ type: MENU_TYPE.NOTDISTURB, name: '방해금지 모드', hasArrow: true },
			{ type: MENU_TYPE.UPDATE, name: '펌웨어 업데이트', hasArrow: true },
			{ type: MENU_TYPE.WRIST, name: '손목 방향', hasArrow: false },
			{ type: MENU_TYPE.SHAKE, name: '손 들어 화면 깨우기', hasArrow: false },
			{ type: MENU_TYPE.RESTART, name: '기기 재시작', hasArrow: false },
			{ type: MENU_TYPE.DISCONNECT, name: '기기 연결 해제', hasArrow: false },
			{ type: MENU_TYPE.RESET, name: '초기화', hasArrow: false },
		];

		const onClickMenu = (type: MENU_TYPE) => {
			switch (type) {
				case MENU_TYPE.WATCHFACE:
					router.push('/device/watchface');
					break;
				case MENU_TYPE.UPDATECYCLE:
					router.push('/device/update-cycle');
					break;
				case MENU_TYPE.NOTDISTURB:
					router.push('/device/not-disturb');
					break;
				case MENU_TYPE.UPDATE:
					router.push('/device/firmware-update');
					break;
				case MENU_TYPE.WRIST:
					break;
				case MENU_TYPE.SHAKE:
					changeShake();
					break;
				case MENU_TYPE.RESTART:
					if (window.confirm('기기를 재시작하시겠습니까?')) {
						window.appInterface.getConnectedStatus();
						window.appInterface.rebootDevice();
					}
					break;
				case MENU_TYPE.DISCONNECT:
					if (!deviceInfo.value.isConnect) {
						let params = {
							deviceIdx: getUserData().deviceIdx,
							batteryLevel: '',
							stateConnect: 'N',
						};
						getApiClient(AppConfig.API_URL, store)
							.post('/api/1/device/updateDeviceInfoForUser', params)
							.then(res => {
								window.appInterface.disconnectDevice();
								store.commit(SET_CONNECTED_STATUS, false);
								setUserData(Object.assign(getUserData(), { deviceIdx: undefined }));
								router.replace('/device-connect');
							});
					} else {
						if (window.confirm('연결을 해제하시겠습니까?')) {
							let params = {
								deviceIdx: getUserData().deviceIdx,
								batteryLevel: '',
								stateConnect: 'N',
							};
							getApiClient(AppConfig.API_URL, store)
								.post('/api/1/device/updateDeviceInfoForUser', params)
								.then(res => {
									window.appInterface.disconnectDevice();
									store.commit(SET_CONNECTED_STATUS, false);
									// router.replace('/device-connect');
								});
						}
					}
					break;
				case MENU_TYPE.RESET:
					if (window.confirm('기기를 초기화하시겠습니까?')) {
						window.appInterface.getConnectedStatus();
						window.appInterface.factoryReset();
					}
					break;
			}
		};

		const changeShake = () => {
			window.appInterface.getConnectedStatus();
			if (isShake.value) {
				window.appInterface.setRaiseHandMode(0);
			} else {
				window.appInterface.setRaiseHandMode(1);
			}
			isShake.value = !isShake.value;
		};

		const changeShakeHand = () => {
			window.appInterface.getConnectedStatus();
			// 1 : right, 0 : left
			if (shakeHand.value === 'right') {
				window.appInterface.setHandMode(0);
				shakeHand.value = 'left';
			} else {
				window.appInterface.setHandMode(1);
				shakeHand.value = 'right';
			}
		};

		const getConnectedDeviceInfo = (param: { deviceIdx?: string; macadress?: string }, callback?: () => void) => {
			if (param.deviceIdx || param.macadress) {
				let params: any = {};
				if (param.macadress) {
					params.macAddress = param.macadress;
				}
				if (param.deviceIdx) {
					params.deviceIdx = param.deviceIdx;
				}
				getApiClient(AppConfig.API_URL, store)
					.post('/api/1/device/getDeviceInfo', params)
					.then(res => {
						if (res.data.resultCode === 0) {
							const { deviceIdx, deviceName, macAddress, firmwareVersion, batteryLevel } = res.data.data[0];
							deviceInfo.value = {
								...deviceInfo.value,
								deviceIdx: deviceIdx,
								deviceName: deviceName,
								macAddress: macAddress,
								version: firmwareVersion,
								battery: batteryLevel ?? 0,
							};

							if (callback) {
								callback();
							}
						}
					});
			}
		};

		const getGroupConnectedDeviceInfo = () => {
			getApiClient(AppConfig.API_URL, store)
				.post('/api/1/device/getDeviceInfoByGroup')
				.then(res => {
					if (res.data.resultCode === 0) {
						const curGroup = getGroupManager().getCurrentGroup();
						if (curGroup) {
							for (let i = 0; i < res.data.data.length; i++) {
								const element = res.data.data[i];
								if (curGroup.creatorInfo?.userIdx === element.userIdx) {
									const { deviceIdx, deviceName, macAddress, firmwareVersion, batteryLevel, stateConnect } = element;
									deviceInfo.value = {
										deviceIdx: deviceIdx,
										deviceName: deviceName,
										macAddress: macAddress,
										version: firmwareVersion,
										battery: batteryLevel,
										isConnect: stateConnect === 'Y',
									};
								}
							}
						}
					}
				});
		};

		const getHandSetting = (e: Event) => {
			let settingValue: 'left' | 'right' = (e as CustomEvent).detail as 'left' | 'right';
			shakeHand.value = settingValue;
		};

		const getShakeSetting = (e: Event) => {
			let settingValue = (e as CustomEvent).detail as string;
			if (settingValue === 'true') {
				isShake.value = true;
			} else {
				isShake.value = false;
			}
		};

		const disconnectDevice = (e: Event) => {
			let result = (e as CustomEvent).detail as string;
			if (result === 'disconnected') {
				let params = {
					deviceIdx: getUserData().deviceIdx,
					batteryLevel: '',
					stateConnect: 'N',
				};
				getApiClient(AppConfig.API_URL, store)
					.post('/api/1/device/updateDeviceInfoForUser', params)
					.then(res => {
						getApiClient(AppConfig.API_URL, store)
							.post('/api/1/device/deleteUserDeviceInfo', { deviceIdx: getUserData().deviceIdx, batteryLevel: '', stateConnect: 'N' })
							.then(res => {
								if (res.data.resultCode === 0) {
									setUserData(Object.assign(getUserData(), { deviceIdx: undefined }));
									router.replace('/device-connect');
								}
							});
					});
			} else if (result.indexOf('failed_connect') > -1) {
				window.alert('연결 해제에 실패하였습니다.');
			}
		};

		const getLoginUserInfo = (): void => {
			if (getUserData()) {
				userInfo.value = getUserData();
				if (userInfo.value?.userType === UserType.USER_DEVICE) {
					if (userInfo.value?.deviceIdx && userInfo.value?.deviceIdx !== '') {
						getConnectedDeviceInfo({ deviceIdx: userInfo.value?.deviceIdx });
						window.appInterface.getConnectedStatus();
						window.appInterface.getHandMode();
						window.appInterface.getRaiseHandMode();
					}
				} else if (userInfo.value?.userType === UserType.USER) {
					getGroupConnectedDeviceInfo();
				}
			}
		};

		const getDeviceInfo = (e: Event) => {
			let info = JSON.parse((e as CustomEvent).detail);
			console.log('getDeviceInfo');

			getConnectedDeviceInfo({ macadress: info.mac }, () => {
				let params = {
					deviceIdx: getUserData().deviceIdx,
					batteryLevel: info.batteryLevel,
					stateConnect: 'Y',
					firmwareVersion: info.firmwareVersion !== '' ? 'V' + info.firmwareVersion.split('V')[1] : '',
				};
				getApiClient(AppConfig.API_URL, store)
					.post('/api/1/device/updateDeviceInfoForUser', params)
					.then(res => {});

				deviceInfo.value = {
					...deviceInfo.value,
					version: info.firmwareVersion,
					battery: info.batteryLevel,
					isConnect: true,
				};
			});
		};

		const getConnecting = (e: Event) => {
			let status = (e as CustomEvent).detail;
			if (status === 'connected') {
				store.commit(SET_CONNECTED_STATUS, true);
				window.appInterface.getDeviceInfo();
				deviceInfo.value = {
					...deviceInfo.value,
					isConnect: true,
				};
			} else if (status === 'disconnected') {
				store.commit(SET_CONNECTED_STATUS, false);
				deviceInfo.value = {
					...deviceInfo.value,
					isConnect: false,
				};
			}
		};

		const getDeviceConnectState = (e: Event) => {
			let status = (e as CustomEvent).detail;

			if (status.indexOf(DeviceConnectStateType.SUCCESS) > -1) {
				store.commit(SET_CONNECTED_STATUS, true);
				deviceInfo.value = {
					...deviceInfo.value,
					isConnect: true,
				};
			}
			if (status.indexOf(DeviceConnectStateType.SUCCESS_BIND) > -1) {
			}
			if (status.indexOf(DeviceConnectStateType.FAILED) > -1) {
				store.commit(SET_CONNECTED_STATUS, false);
				deviceInfo.value = {
					...deviceInfo.value,
					isConnect: false,
				};
			}
			if (status.indexOf(DeviceConnectStateType.DISCONNECTED) > -1) {
				store.commit(SET_CONNECTED_STATUS, false);
				deviceInfo.value = {
					...deviceInfo.value,
					isConnect: false,
				};
			}
		};

		onMounted(() => {
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.addEventListener(AndroidEventType.GET_HAND, getHandSetting);
			window.appInterface.addEventListener(AndroidEventType.GET_SHAKE, getShakeSetting);
			window.appInterface.addEventListener(AndroidEventType.DISCONNECT_DEVICE, disconnectDevice);
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_INFO, getDeviceInfo);
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_CONNECTING, getConnecting);

			getLoginUserInfo();
		});

		onUnmounted(() => {
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.removeEventListener(AndroidEventType.GET_HAND, getHandSetting);
			window.appInterface.removeEventListener(AndroidEventType.GET_SHAKE, getShakeSetting);
			window.appInterface.removeEventListener(AndroidEventType.DISCONNECT_DEVICE, disconnectDevice);
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_INFO, getDeviceInfo);
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_CONNECTING, getConnecting);
		});

		return {
			userInfo,
			MENU_TYPE,
			UserType,
			deviceInfo,
			deviceMenuList,
			shakeHand,
			isShake,
			onClickMenu,
			changeShake,
			changeShakeHand,
			compVersions,
		};
	},
});
</script>

<template>
	<layout-header title="기기설정" :is-disabled-back="true" />
	<section class="device-setting">
		<article class="info flex justify-between">
			<div class="device-info flex flex-col">
				<p>{{ deviceInfo.deviceName }}</p>
				<label>{{ deviceInfo.macAddress }}</label>
				<label>{{ compVersions }}</label>
				<div class="battery-info">
					<div class="battery-img"><span :style="{ width: deviceInfo.battery + '%' }" /></div>
					<div class="battery-value">{{ deviceInfo.battery === 0 ? '-' : deviceInfo.battery }}%</div>
				</div>
			</div>
			<div class="flex flex-col items-center">
				<kp-image src="images/view/img-watch.png" :imgSets="3" />
				<label class="connect-state">{{ deviceInfo.isConnect ? '연결됨' : '연결끊김' }}</label>
			</div>
		</article>
		<article v-if="userInfo?.userType === UserType.USER_DEVICE">
			<ul>
				<template v-for="item in deviceMenuList" :key="item.type">
					<li v-if="item.type === MENU_TYPE.WRIST">
						<kp-link link="" :on-click="() => onClickMenu(item.type)" class="pt-[12px] pb-[13px]">
							<div class="flex items-center">
								<kp-image class="icon" :src="`images/icon/ico-device-${item.type}.svg`" /><label>{{ item.name }}</label>
							</div>
							<div class="flex items-center">
								<kp-button :is-default="shakeHand === 'right'" @click="changeShakeHand">왼손</kp-button>
								<kp-button :is-default="shakeHand === 'left'" @click="changeShakeHand">오른손</kp-button>
							</div>
						</kp-link>
					</li>
					<li v-else-if="item.type === MENU_TYPE.SHAKE">
						<kp-link link="" :on-click="() => onClickMenu(item.type)">
							<div class="flex items-center">
								<kp-image class="icon" :src="`images/icon/ico-device-${item.type}.svg`" /><label>{{ item.name }}</label>
							</div>
							<kp-toggle :is-checked="isShake" @onToggleClick="changeShake" />
						</kp-link>
					</li>
					<li v-else-if="item.type === MENU_TYPE.DISCONNECT">
						<kp-link link="" :on-click="() => onClickMenu(item.type)" class="pt-[22px] pb-[23px]">
							<div class="flex items-center">
								<kp-image class="icon" :src="`images/icon/ico-device-${item.type}.svg`" /><label>{{ item.name }}</label>
							</div>
							<kp-image v-if="item.hasArrow" :src="`images/icon/ico-device-arrow.svg`" />
						</kp-link>
					</li>
					<li v-else-if="item.type === MENU_TYPE.RESET">
						<kp-link link="" :on-click="() => onClickMenu(item.type)" class="pt-[20px] pb-[21px]">
							<div class="flex items-center">
								<kp-image class="icon" :src="`images/icon/ico-device-${item.type}.svg`" /><label>{{ item.name }}</label>
							</div>
							<kp-image v-if="item.hasArrow" :src="`images/icon/ico-device-arrow.svg`" />
						</kp-link>
					</li>
					<li v-else>
						<kp-link link="" :on-click="() => onClickMenu(item.type)">
							<div class="flex items-center">
								<kp-image class="icon" :src="`images/icon/ico-device-${item.type}.svg`" /><label>{{ item.name }}</label>
							</div>
							<kp-image v-if="item.hasArrow" :src="`images/icon/ico-device-arrow.svg`" />
						</kp-link>
					</li>
				</template>
			</ul>
		</article>
	</section>
</template>

<style scoped></style>
