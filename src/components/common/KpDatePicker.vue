<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

export default defineComponent({
	name: 'KpDatePicker',
	components: { VueDatePicker },
	props: {
		date: {
			type: Date,
		},
		isWhite: {
			type: Boolean,
			default: false,
		},
	},
	emit: ['onChangeDate'],
	setup(props, { emit }) {
		const selectDate = computed(() => props.date);

		const getFormat = (date: Date) => {
			const day = date.getDate();
			const month = date.getMonth() + 1;
			const year = date.getFullYear();

			return `${year}년 ${month}월 ${day}일`;
		};

		const onChangeDate = (modelData: Date) => {
			emit('onChangeDate', modelData);
		};

		return { selectDate, getFormat, onChangeDate };
	},
});
</script>

<template>
	<vue-date-picker
		:class="{ 'white-theme': isWhite }"
		v-model="selectDate"
		:format="getFormat"
		:max-date="new Date()"
		locale="ko"
		@update:model-value="onChangeDate"
		auto-apply
		:enable-time-picker="false">
		<template #input-icon>
			<img v-if="isWhite" class="input-slot-image" :src="'images/icon/ico-calendar-white.svg'" />
			<img v-else class="input-slot-image" :src="'images/icon/ico-calendar.svg'" />
		</template>
	</vue-date-picker>
</template>

<style scoped></style>
