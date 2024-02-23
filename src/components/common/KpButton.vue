<script lang="ts">
import { defineComponent, PropType, toRef } from 'vue';

export default defineComponent({
	name: 'KpButton',
	props: {
		isDisabled: {
			type: Boolean as PropType<boolean>,
			isRequire: false,
			default: false,
		},
		isDefault: {
			type: Boolean as PropType<boolean>,
			isRequire: false,
			default: false,
		},
		isSecondary: {
			type: Boolean as PropType<boolean>,
			isRequire: false,
			default: false,
		},
		onClick: {
			type: Function as PropType<() => void>,
			required: false,
		},
		btnClass: {
			type: String,
			require: false,
		},
	},

	setup(props) {
		const btnIsDisabled = toRef(props, 'isDisabled');
		const btnIsDefault = toRef(props, 'isDefault');
		const btnIsSecondary = toRef(props, 'isSecondary');

		const getButtonType = () => {
			if (btnIsDefault.value) {
				return `default ${props.btnClass ?? props.btnClass}`;
			}
			if (btnIsSecondary.value) {
				return `secondary ${props.btnClass ?? props.btnClass}`;
			}
			return `primary ${props.btnClass ?? props.btnClass}`;
		};

		const handleClick = (e: Event) => {
			e.stopPropagation();
			if (props.onClick) {
				props.onClick();
			}
		};

		return { btnIsDisabled, btnIsSecondary, getButtonType, handleClick };
	},
});
</script>

<template>
	<button v-on:click.prevent.stop="handleClick" class="kp-btn" :class="getButtonType()" :disabled="btnIsDisabled">
		<slot></slot>
	</button>
</template>

<style scoped></style>
