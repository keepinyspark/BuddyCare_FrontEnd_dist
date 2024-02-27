<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import KpImage from '@components/common/KpImage.vue';
import KpButton from '@components/common/KpButton.vue';
import { DeviceInterface } from '@src/types/types';

export default defineComponent({
	name: 'DeviceConnectItem',
	components: { KpButton, KpImage },
	props: {
		deviceInfo: {
			type: Object as PropType<DeviceInterface>,
			require: true,
		},
		onConnect: {
			type: Function,
			require: true,
		},
		onDisconnect: {
			type: Function,
			require: true,
		},
	},
	setup(props) {
		const label = ref('연결');
		const onClickConnect = () => {
			if (props.onConnect && props.onDisconnect) {
				if (label.value === '연결중') {
					label.value = '연결';
					props.onDisconnect();
				} else {
					label.value = '연결중';
					props.onConnect(props.deviceInfo?.macAddress);
				}
			}
		};

		return {
			label,
			onClickConnect,
		};
	},
});
</script>

<template>
	<li class="device-list-item flex justify-between">
		<div class="flex flex-row">
			<kp-image class="mr-[10px]" :src="`images/icon/ico-footer-device-active.svg`" />
			<div class="text-left">
				<p class="device-name">{{ deviceInfo?.deviceName }}</p>
				<span class="device-address mt-[5px]">{{ deviceInfo?.macAddress }}</span>
			</div>
		</div>
		<kp-button class="w-[68px] px-0" :on-click="onClickConnect" btn-class="device-btn">{{ label }}</kp-button>
	</li>
</template>

<style scoped></style>
