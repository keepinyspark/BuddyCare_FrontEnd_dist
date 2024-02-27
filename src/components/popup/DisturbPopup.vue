<script lang="ts">
import { defineComponent, onMounted, onUnmounted, PropType, ref, toRef } from 'vue';
import KpButton from '@components/common/KpButton.vue';
import AppConfig from '@src/constants';
import { Portal } from 'portal-vue';
import KpTimePicker from '@components/common/KpTimePicker.vue';

export default defineComponent({
	name: 'DisturbPopup',
	components: { KpTimePicker, Portal, KpButton },
	props: {
		type: {
			type: String,
		},
		hour: {
			type: Number,
		},
		min: {
			type: Number,
		},
		cancelHandler: {
			type: Function as PropType<() => void>,
			default: () => {
				return;
			},
		},
		submitHandler: {
			type: Function as PropType<(arg: any) => void>,
			default: (arg: any) => {
				return;
			},
		},
	},
	setup(props) {
		const isOpen = ref<boolean>(false);
		const selectHour = ref(0);
		const selectMin = ref(0);

		const init = () => {
			isOpen.value = true;
			selectHour.value = toRef(props, 'hour').value as number;
			selectMin.value = toRef(props, 'min').value as number;
		};

		const onSubmit = () => {
			if (props.submitHandler) {
				props.submitHandler({ type: props.type, hour: selectHour.value, min: selectMin.value });
			}
		};

		const changeTime = ({ hour, min }: { hour: number; min: number }) => {
			selectHour.value = hour;
			selectMin.value = min;
		};

		onMounted(() => {
			init();
		});

		onUnmounted(() => {
			props.cancelHandler();
		});

		return {
			isOpen,
			selectHour,
			selectMin,
			changeTime,
			onSubmit,
		};
	},
});
</script>

<template>
	<portal to="disturb-popup">
		<div
			class="disturb-popup-wrapper absolute bg-white max-w-[315px] w-[315px] h-[240px] left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] p-[20px] rounded-[10px] flex flex-col justify-between">
			<div class="watchface-info-wrapper w-full flex flex-col items-center justify-start mt-[10px]">
				<kp-time-picker :hour="selectHour" :min="selectMin" @onChange="changeTime" />
			</div>
			<div class="btn-wrapper flex justify-between items-center w-full">
				<kp-button is-secondary :on-click="cancelHandler">취소</kp-button>
				<kp-button :on-click="onSubmit">확인</kp-button>
			</div>
		</div>
	</portal>
</template>

<style scoped></style>
