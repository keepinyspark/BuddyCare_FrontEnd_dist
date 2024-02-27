<script lang="ts">
import { defineComponent, onMounted, PropType, ref, toRef } from 'vue';

export interface SelectOptionInterface {
	value: string | number;
	label: string;
}

export default defineComponent({
	name: 'KpSelectBox',
	props: {
		selectValue: {
			type: String,
			require: true,
		},
		options: {
			type: Array as PropType<SelectOptionInterface[]>,
		},
		isDisabled: {
			type: Boolean as PropType<boolean>,
			default: false,
		},
	},
	emit: ['onChange'],
	setup(props, { emit }) {
		const value = toRef(props, 'selectValue');

		const onChange = (e: Event) => {
			emit('onChange', (e.target as HTMLSelectElement).value);
		};

		return { value, onChange };
	},
});
</script>

<template>
	<select class="kp-select" v-model="value" :disabled="isDisabled" @change="e => onChange(e)">
		<option v-for="(item, index) in options" :key="index" :value="item.value">{{ item.label }}</option>
	</select>
</template>

<style scoped></style>
