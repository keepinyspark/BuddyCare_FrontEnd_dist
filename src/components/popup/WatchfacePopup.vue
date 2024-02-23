<script lang="ts">
import { defineComponent, onMounted, onUnmounted, PropType, ref, toRef, watch } from 'vue';
import KpImage from '@components/common/KpImage.vue';
import KpButton from '@components/common/KpButton.vue';
import { AndroidEventType, DeviceConnectStateType, UserType } from '@src/types/types';
import { getImgUrl, getUserData, parsedImgSrc } from '@utils/common-utils';
import KpLink from '@components/common/KpLink.vue';
import AppConfig from '@src/constants';
import { useStore } from 'vuex';
import { Portal } from 'portal-vue';

export default defineComponent({
	name: 'WatchfacePopup',
	components: { Portal, KpLink, KpButton, KpImage },
	props: {
		data: {
			type: Object as PropType<{
				displayIdx: string;
				displayFileInfo: string;
				imageFileInfo: string;
				displayName: string;
				displayDesc: string;
			}>,
		},
		cancelHandler: {
			type: Function as PropType<() => void>,
			default: () => {
				return;
			},
		},
		submitHandler: {
			type: Function as PropType<() => void>,
			default: () => {
				return;
			},
		},
	},
	setup(props) {
		const store = useStore();
		const watchfaceData = toRef(props, 'data');
		const isOpen = ref<boolean>(false);
		const isSync = ref<boolean>(false);
		const syncValue = ref<number>(0);
		let timer: string | number | NodeJS.Timeout | undefined;
		const isDeviceUser = ref<boolean>();

		const init = () => {
			isOpen.value = true;
			isDeviceUser.value = getUserData().userType === UserType.USER_DEVICE;
		};

		const handleCancelSync = () => {
			props.cancelHandler();
		};

		const handleSync = () => {
			const watchfaceConfig = {
				title: watchfaceData.value?.displayName,
				author: watchfaceData.value?.displayIdx,
				previewPath: parsedImgSrc(watchfaceData.value?.imageFileInfo),
				url: parsedImgSrc(watchfaceData.value?.displayFileInfo),
			};

			if (!isDeviceUser.value) return;

			isSync.value = true;

			window.appInterface.setWatchFace(watchfaceConfig);
		};

		const setSyncPercent = (e: Event) => {
			syncValue.value = Number((e as CustomEvent).detail as string);
			if (Number((e as CustomEvent).detail as string) === 100) {
				// window.alert('완료되었습니다.');
			}
		};

		const getDeviceConnectState = (e: Event) => {
			if ((e as CustomEvent).detail.indexOf(DeviceConnectStateType.DISCONNECTED) > -1) {
				handleCancelSync();
			}
		};

		onMounted(() => {
			window.appInterface.addEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.addEventListener(AndroidEventType.SYNC_WATCH_FACE, setSyncPercent);
			init();
		});

		onUnmounted(() => {
			if (timer) {
				clearTimeout(timer);
			}
			window.appInterface.removeEventListener(AndroidEventType.GET_DEVICE_CONNECT_STATE, getDeviceConnectState);
			window.appInterface.removeEventListener(AndroidEventType.SYNC_WATCH_FACE, setSyncPercent);
			props.cancelHandler();
		});

		return {
			isOpen,
			isSync,
			watchfaceData,
			syncValue,
			isDeviceUser,
			getImgUrl,
			handleCancelSync,
			handleSync,
		};
	},
});
</script>

<template>
	<portal to="watchface-popup" v-if="isOpen">
		<div
			class="watchface-popup-wrapper absolute bg-white max-w-[315px] w-[315px] h-[240px] left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] p-[20px] rounded-[10px] flex flex-col justify-between">
			<div class="watchface-info-wrapper w-full flex flex-col items-center justify-start mt-[10px]">
				<kp-image class="w-[90px] h-[90px] object-cover mb-[10px]" :src="getImgUrl(watchfaceData?.imageFileInfo) ?? ''"></kp-image>
				<kp-link v-if="isSync" class="absolute top-[15px] right-[15px]" link="#" :on-click="handleCancelSync">
					<kp-image class="w-[30px] h-[30px] object-cover mb-[10px]" src="images/common/plus-icon.png"></kp-image>
				</kp-link>
				<div class="watchface-name">{{ watchfaceData?.displayName }}</div>
			</div>
			<div v-if="!isSync" class="btn-wrapper flex justify-between items-center w-full">
				<kp-button is-secondary :on-click="cancelHandler">취소</kp-button>
				<kp-button :is-disabled="!isDeviceUser" :on-click="handleSync">동기화</kp-button>
			</div>
			<div v-else class="sync-wrapper">
				<p class="flex items-center justify-center mb-[10px]">{{ syncValue === 100 ? '동기화 완료되었습니다.' : '동기화 중...' }}</p>
				<div><span :style="{ width: syncValue + '%' }" /></div>
			</div>
		</div>
	</portal>
</template>

<style scoped></style>
