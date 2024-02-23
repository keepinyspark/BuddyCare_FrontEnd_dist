<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

export default defineComponent({
	name: 'KpImage',
	props: {
		src: {
			type: String as PropType<string>,
		},
		originSrc: {
			type: String as PropType<string>,
		},
		imgSets: {
			type: Number as PropType<number>,
			default: 1,
			required: false,
		},
		alt: {
			type: String as PropType<string>,
			required: false,
		},
	},
	setup(props) {
		let srcSet = computed(() => {
			let imgSrcSet = '';
			if (props.src && props.imgSets > 1) {
				const lastDotIndex = props.src.lastIndexOf('.');
				const fileName = props.src.substring(0, lastDotIndex);
				const ext = props.src.substring(lastDotIndex);
				imgSrcSet += `${fileName}@2x${ext} 2x`;
				if (props.imgSets > 2) {
					imgSrcSet += ` , ${fileName}@3x${ext} 3x`;
				}
			}
			return imgSrcSet;
		});
		const onError = (e: Event) => {
			if (e.currentTarget) {
				let currentTarget = e.currentTarget as HTMLImageElement;
				currentTarget.onerror = null;
				if (props.originSrc) currentTarget.src = props.originSrc;
			}
		};
		return {
			srcSet,
			onError,
		};
	},
});
</script>

<template>
	<img :src="src" :srcset="srcSet" :alt="alt" :onerror="onError" />
</template>

<style scoped></style>
