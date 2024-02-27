<script lang="ts">
import { defineComponent } from 'vue';
import KpButton from '@components/common/KpButton.vue';
import KpImage from '@components/common/KpImage.vue';

export default defineComponent({
	name: 'RefreshButton',
	components: { KpImage, KpButton },
	emit: ['click'],
	setup(props, { emit }) {
		const onClickBtn = () => {
			emit('click');
		};
		return { onClickBtn };
	},
});
</script>

<template>
	<kp-button class="flex items-center justify-center ml-[8px]" btn-class="btn-refresh" :on-click="onClickBtn">
		<kp-image src="images/icon/ico-btn-refresh.svg" />
	</kp-button>
</template>

<style scoped></style>
