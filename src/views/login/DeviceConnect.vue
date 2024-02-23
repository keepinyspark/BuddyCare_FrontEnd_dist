<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, onUnmounted, ref } from 'vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import KpImage from '@components/common/KpImage.vue';
import KpButton from '@components/common/KpButton.vue';
import { KEY_LIST } from '../../constants-keys';
import DeviceConnectItem from '@components/layout/device/DeviceConnectItem.vue';
import { AndroidEventType, DeviceConnectStateType, DeviceInterface, UserType } from '@src/types/types';
import { createGroupManager, getGroupManager, removeGroupManager } from '@utils/group/group-instance';
import { getUserData, doLogout, saveLocalData, setUserData } from '@utils/common-utils';
import { createGroup, getGroupEmergencyInfo } from '@utils/api-utils';
import { getApiClient } from '@utils/api-client';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import router from '@src/router';
import { useStore } from 'vuex';
import AppConfig from '@src/constants';
import { SET_AUTH_TOKEN, SET_CONNECTED_STATUS, SET_FOOTER_TYPE } from '@src/store/actions';
import { split } from 'lodash';
import { getGroupList } from '../../utils/group/api/group-api';
import { STATE_REG } from '../../components/Profile.vue';
import { Group } from '@utils/group/dto/group';

export default defineComponent({
	name: 'DeviceConnect',
	components: { DeviceConnectItem, KpButton, KpImage, LayoutHeader },
	setup() {
		const store = useStore();
		const { SCAN } = KEY_LIST;
		const scanStatus = ref(SCAN.NONE);
		const selectMacAddress = ref('');
		const scanDescription = {
			[SCAN.NONE]: '',
			[SCAN.SCANNING]: '기기를 찾고 있습니다.',
			[SCAN.DONE]: '검색이 완료되었습니다.',
		};
		const apiClient = computed(() => getApiClient(AppConfig.API_URL, store));
		const lastConnectMacAddress = ref('');

		const deviceList = ref<DeviceInterface[]>([]);
		const allDeviceList = ref<any[]>([]);

		const compDeviceList = computed(() =>
			deviceList.value.reduce((prev: DeviceInterface[], now: DeviceInterface) => {
				if (!prev.some((item: DeviceInterface) => item.macAddress === now.macAddress)) {
					prev.push(now);
				}
				return prev;
			}, []),
		);

		const onClickScan = () => {
			deviceList.value = [];
			switch (scanStatus.value) {
				case SCAN.NONE:
					scanStatus.value = SCAN.SCANNING;
					window.appInterface.checkBluetooth();
					getAllDeviceList(() => {
						window.appInterface.doScanDevice();
					});
				case SCAN.DONE:
					// TODO: sdk scan
					scanStatus.value = SCAN.SCANNING;
					break;
				case SCAN.SCANNING:
					// TODO: sdk scan stop
					window.appInterface.doScanStop();
					scanStatus.value = SCAN.NONE;
					break;
				default:
					break;
			}
		};

		const onClickConnect = (macAddress: string) => {
			// createGroupManager().launchChat();
			// 2023-10-20 박영수 책임 메일 요청 내용
			// window.appInterface.doScanStop();
			window.appInterface.doConnectDevice(macAddress);
			selectMacAddress.value = macAddress;
		};

		const onClickDisConnect = () => {
			window.appInterface.disconnectDevice();
		};

		// TEST용 그룹 생성
		const doCreateGroup = () => {
			createGroup(apiClient.value, {
				creatorIdx: getUserData().userIdx,
			})
				.then(res => {
					// router.replace({ path: `/` });
					reCreateGroup();
				})
				.catch(e => console.log(e));
		};

		const reCreateGroup = () => {
			getGroupList(apiClient.value, { stateReg: STATE_REG.RESOLVE })
				.then(async res => {
					const dataList = res.data as any;

					getGroupManager().addEventListener(
						GroupManagerEvent.CHANGE_GROUP,
						() => {
							router.replace({ path: `/` });
						},
						{ once: true },
					);

					getGroupManager().addEventListener(
						GroupManagerEvent.LOAD_COMPLETE,
						() => {
							router.replace({ path: `/` });
						},
						{ once: true },
					);

					await getGroupManager().updateGroupList(dataList);
				})
				.catch(e => {
					throw e;
				});

			// const handleLoadComplete = () => {
			// 	getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleLoadComplete);
			// 	router.replace({ path: `/` });
			// };

			// try {
			// 	removeGroupManager();
			// 	createGroupManager().launchChat();
			// 	getGroupManager().addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleLoadComplete);
			// } catch (e) {}
		};

		const getDeviceList = (e: Event) => {
			let deviceInfo = ((e as CustomEvent).detail as string).split('||');
			if (deviceInfo.length > 0 && deviceInfo[0] === 'disconnected') {
				getAllDeviceList(() => {
					window.appInterface.doScanDevice();
				});
			}
			let tempDeviceList: DeviceInterface[] = Array.from(deviceList.value);
			if (
				deviceInfo[0] &&
				allDeviceList.value.filter(t => t.macAddress.toUpperCase() === deviceInfo[0].toUpperCase()).length > 0 &&
				tempDeviceList.filter(t => t.macAddress.toUpperCase() === deviceInfo[0].toUpperCase()).length < 1
			) {
				tempDeviceList.push({ macAddress: deviceInfo[0], deviceName: deviceInfo[1] });

				deviceList.value = tempDeviceList;
			} else {
				if (deviceInfo.length > 1 && deviceInfo[1] && deviceInfo[1].toLowerCase().indexOf('junizen') > -1) {
					if (tempDeviceList.filter(t => t.macAddress.toUpperCase() === deviceInfo[0].toUpperCase()).length < 1) {
						tempDeviceList.push({ macAddress: deviceInfo[0], deviceName: deviceInfo[1] });

						deviceList.value = tempDeviceList;
					}
				}
			}
			if (deviceInfo.length > 0 && deviceInfo[0] === 'success_bind') {
				goToDashBoard();
			}
		};

		const getUserInfoUpdate = () => {
			apiClient.value.post('/api/1/users/me').then(res => {
				if (res.data.resultCode !== 0) {
					window.alert(res.data.resultMsg);
				} else {
					saveLocalData(KEY_LIST.CONST.LOGIN_USER, JSON.stringify(res.data.data));
				}
			});
		};

		const getDeviceConnectState = (e: Event) => {
			const userData = getUserData();

			if ((e as CustomEvent).detail.indexOf(DeviceConnectStateType.SUCCESS) > -1) {
				let macAdd = selectMacAddress.value === '' ? ((e as CustomEvent).detail as string).split('||')[1] : selectMacAddress.value;
				store.commit(SET_CONNECTED_STATUS, true);
				if (lastConnectMacAddress.value !== macAdd) {
					updateDeviceInfoForUser(macAdd);
				} else {
					lastConnectMacAddress.value = macAdd;
				}
			}
			if ((e as CustomEvent).detail.indexOf(DeviceConnectStateType.SUCCESS_BIND) > -1) {
				store.commit(SET_CONNECTED_STATUS, true);
				goToDashBoard();
			}
			if ((e as CustomEvent).detail.indexOf(DeviceConnectStateType.FAILED) > -1) {
				store.commit(SET_CONNECTED_STATUS, false);
				window.alert('기기연결에 실패하였습니다.');
				deviceList.value = [];
				window.appInterface.doScanDevice();
			}
			if ((e as CustomEvent).detail.indexOf(DeviceConnectStateType.DISCONNECTED) > -1) {
				store.commit(SET_CONNECTED_STATUS, false);
				// window.alert('기기연결에 실패하였습니다.');
				// deviceList.value = [];
				// window.appInterface.doScanDevice();
			}
		};

		const getConnecting = (e: Event) => {
			const userData = getUserData();

			if ((e as CustomEvent).detail === DeviceConnectStateType.CONNECTED) {
				window.appInterface.getDeviceInfo();
				// goToDashBoard();
			} else if ((e as CustomEvent).detail === DeviceConnectStateType.NOTCONNECTED) {
				getAllDeviceList(() => {
					window.appInterface.doScanDevice();
				});
			} else {
				getAllDeviceList(() => {
					window.appInterface.doScanDevice();
				});
			}
		};

		const getDeviceInfo = (e: Event) => {
			let deviceInfo = JSON.parse((e as CustomEvent).detail);

			if (deviceInfo) {
				updateDeviceInfoForUser(deviceInfo.mac);
				// goToDashBoard();
			}
		};

		const updateDeviceInfoForUser = (macAdd: string) => {
			const userData = getUserData();

			apiClient.value.post('/api/1/device/getDeviceInfo', { macAddress: macAdd }).then(resDeviceInfo => {
				if (resDeviceInfo.data.resultCode === 0) {
					if (resDeviceInfo.data.data.length > 0) {
						let selectDevice = resDeviceInfo.data.data[0];

						apiClient.value.post('/api/1/device/getDeviceInfoByGroup').then(res => {
							if (res.data.resultCode === 0) {
								if (res.data.data && res.data.data.length > 0 && res.data.data.filter((f: any) => f.userIdx === getUserData().userIdx).length > 0) {
									let data = res.data.data.filter((f: any) => f.userIdx === getUserData().userIdx);
									let time = data[0].stateUpdate ?? 60;

									window.appInterface.setBackgroundSyncTime(Number(getUserData().stateUpdate) * 60);

									/**
									 * stateUpdate값은 구조 변경으로 인하여 user_info테이블로 변경되었습니다.
									 */
									insertDeviceInfo({
										macAddress: macAdd,
										deviceIdx: selectDevice.deviceIdx,
										userIdx: userData.userIdx,
										stateUpdate: time.toString(),
									});
								}
							} else {
								insertDeviceInfo({
									macAddress: macAdd,
									deviceIdx: selectDevice.deviceIdx,
									userIdx: userData.userIdx,
									stateUpdate: '60',
								});
							}

							getUserInfoUpdate();
							goToDashBoard();
						});
					} else {
					}
				} else {
				}
			});
		};

		const insertDeviceInfo = (param: object) => {
			apiClient.value
				.post('/api/1/device/insertUserDeviceInfo', param)
				.then(() => {
					setUserData(Object.assign(getUserData(), { deviceIdx: param.deviceIdx }));
				})
				.catch(e => {
					console.error(e);
				});
		};

		const goToDashBoard = () => {
			apiClient.value.post('/api/1/group/getGroupInfo').then(res => {
				if (res.data.resultCode === 0) {
					if (res.data.data) {
						if (res.data.data.hasOwnProperty('creatorList')) {
							if (res.data.data.creatorList.length > 0) {
								reCreateGroup();
							} else {
								doCreateGroup();
							}
						} else {
							doCreateGroup();
						}
					} else {
						doCreateGroup();
					}
				} else {
					doCreateGroup();
				}
			});
		};

		const getAllDeviceList = (callback?: () => void) => {
			let params = { page: '1', pagingRow: '1000', options: '', keyword: '' };
			apiClient.value.post('/api/1/device/getDeviceInfoForAdmin', params).then(res => {
				if (res.data.resultCode === 0) {
					allDeviceList.value = res.data.data;
					if (callback) {
						callback();
					}
				}
			});
		};

		const goDashboard = () => {
			router.replace({ path: '/' });
		};

		onMounted(() => {
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_LIST, getDeviceList);
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_CONNECTING, getConnecting);
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_INFO, getDeviceInfo);
			window.appInterface.checkBluetooth();
			window.appInterface.getConnectedStatus();

			if (getUserData()) {
				window.appInterface.setUserName(getUserData().userName);
			}

			onClickScan();
		});

		onBeforeUnmount(() => {
			window.appInterface.doScanStop();
		});

		onUnmounted(() => {
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_LIST, getDeviceList);
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_CONNECTING, getConnecting);
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_INFO, getDeviceInfo);
		});

		return {
			...SCAN,
			scanStatus,
			description: computed(() => scanDescription[scanStatus.value]),
			deviceList,
			compDeviceList,
			onClickScan,
			onClickConnect,
			onClickDisConnect,
			goDashboard,
		};
	},
});
</script>

<template>
	<layout-header title="기기 연결" :direct-redirection="goDashboard" />
	<section class="device-connect">
		<kp-image class="mx-[auto]" src="images/view/device-connect/bluetooth-scan.png" alt="bluetooth" />
		<div class="mt-[20px] text-center">
			<label class="scan-description mb-[10px]" v-if="description !== ''">{{ description }}</label>
			<kp-button
				class="py-[15px]"
				:class="{ 'mt-[10px]': scanStatus !== NONE, 'mt-[15px]': scanStatus === NONE }"
				:is-secondary="scanStatus === SCANNING"
				:on-click="onClickScan">
				{{ scanStatus === SCANNING ? '중지' : '스캔' }}
			</kp-button>
		</div>
		<div class="scan-device-wrapper mt-[40px]" v-if="scanStatus !== DONE">
			<ul v-if="deviceList.length > 0">
				<template v-for="item in compDeviceList" :key="item.macAddress">
					<device-connect-item :device-info="item" :on-connect="onClickConnect" :on-disconnect="onClickDisConnect" />
				</template>
			</ul>
			<div v-else class="py-[36px]">검색된 기기가 없습니다.<br />버튼을 눌러 기기를 스캔해주세요.</div>
		</div>
	</section>
</template>

<style scoped></style>
