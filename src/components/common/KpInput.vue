<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
	name: 'KpInput',
	props: {
		placeholder: {
			type: String as PropType<string>,
		},
		type: {
			type: String as PropType<string>,
			default: 'text',
		},
		modelValue: {
			type: String as PropType<string>,
		},
		readOnly: {
			type: Boolean as PropType<boolean>,
			required: false,
			default: false,
		},
		length: {
			type: Number,
			required: false,
		},
		useKeyword: {
			type: Boolean as PropType<boolean>,
			required: false,
		},
		handleKeyUp: {
			type: Function as PropType<(v: string) => string>,
			required: false,
		},
		onEnter: {
			type: Function as PropType<(data: string | number | boolean | Date | undefined) => void>,
			required: false,
		},
	},
	setup(props) {
		const store = useStore();
		const inputValue = ref(props.modelValue || '');
		const compModelValue = computed(() => props.modelValue || '');
		const stopModelValue = watch(compModelValue, () => {
			inputValue.value = props.modelValue || '';
		});
		return {
			store,
			// customBorderColor,
			inputValue,
			stopModelValue,
		};
	},
	unmounted() {
		this.stopModelValue();
	},
	methods: {
		handleClick(): void {
			this.$nextTick(() => {
				(this.$refs.inputRef as HTMLInputElement).focus();
			});
		},
		handleKeyup(e: KeyboardEvent): void {
			if (e.code === 'Enter') {
				if (this.onEnter) this.onEnter(this.inputValue);
			} else {
				const value = e.target as HTMLInputElement;
				if (this.handleKeyUp) {
					value.value = this.handleKeyUp(value.value as string);
				}
			}
		},
		handleInput(e: Event): void {
			this.$emit(`update:modelValue`, (e.target as HTMLInputElement).value);
		},
		handleBlur(e: Event): void {
			this.$emit(`blur`, (e.target as HTMLInputElement).value);
		},
		handleChange(e: Event): void {
			this.$emit(`change`, (e.target as HTMLInputElement).value);
		},
	},
});
</script>

<template>
	<input
		ref="inputRef"
		:readonly="readOnly"
		:placeholder="placeholder"
		:type="type"
		:maxlength="length"
		v-model="inputValue"
		@input="handleInput"
		@keyup="handleKeyup"
		@blur="handleBlur"
		@change="handleChange"
		:autocomplete="type === 'password' ? 'off' : 'on'"
		autocapitalize="off"
		@touchstart="handleClick" />
</template>

<style scoped></style>
