<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
	name: 'KpLink',
	props: {
		link: {
			type: String as PropType<string>,
			required: false,
		},
		title: {
			type: String as PropType<string>,
		},
		onClick: {
			type: Function as PropType<() => void>,
			required: false,
		},
	},
	methods: {
		handleClick(e: Event) {
			e.stopPropagation();
			if (this.onClick) {
				this.onClick();
			} else {
				if (this.link) {
					this.$router.push(this.link);
				}
			}
		},
	},
});
</script>

<template>
	<a class="" :href="link" v-on:click.prevent.stop="handleClick" :title="title"><slot></slot></a>
</template>

<style scoped></style>
