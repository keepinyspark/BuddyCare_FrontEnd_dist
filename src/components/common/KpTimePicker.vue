<script lang="ts">
import { computed, defineComponent, onMounted, onUpdated, PropType, ref, toRef } from 'vue';
import { VueScrollPicker, VueScrollPickerOption } from 'vue-scroll-picker';

export default defineComponent({
	name: 'KpTimePicker',
	components: { VueScrollPicker },
	props: {
		hour: {
			type: Number,
		},
		min: {
			type: Number,
		},
	},
	emits: ['onChange'],
	setup(props, { emit }) {
		const currentHour = ref(toRef(props, 'hour').value);
		const currentMinute = ref(toRef(props, 'min').value);

		onUpdated(() => {
			emit('onChange', { hour: currentHour.value, min: currentMinute.value });
		});

		return {
			currentHour,
			currentMinute,
			hourOptions: computed(() => {
				return Array.from({ length: 24 }, (_, index) => index);
			}),
			minuteOptions: computed(() => {
				return Array.from({ length: 60 }, (_, index) => index);
			}),
		};
	},
});
</script>

<template>
	<div class="kp-time-picker">
		<vue-scroll-picker :options="hourOptions" v-model="currentHour" />
		<span>:</span>
		<vue-scroll-picker :options="minuteOptions" v-model="currentMinute" />
	</div>
</template>

<style scoped></style>
