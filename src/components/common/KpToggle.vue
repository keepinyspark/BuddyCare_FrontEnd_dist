<script lang="ts">
import { defineComponent, toRef } from 'vue';

export default defineComponent({
	name: 'KpToggle',
	props: {
		isChecked: {
			type: Boolean,
			default: false,
		},
	},
	emit: ['onToggleClick'],
	setup(props, { emit }) {
		const value = toRef(props, 'isChecked');

		const onCheck = () => {
			emit('onToggleClick');
		};

		return {
			value,
			onCheck,
		};
	},
});
</script>

<template>
	<label class="kp-switch">
		<input type="checkbox" :checked="value" @change.stop.prevent="e => onCheck()" />
		<span class="kp-slider round"></span>
	</label>
</template>

<style scoped></style>
