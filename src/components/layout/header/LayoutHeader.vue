<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import KpLink from '@components/common/KpLink.vue';
import KpImage from '@components/common/KpImage.vue';
import LogViewer from '@components/popup/log/LogViewer.vue';

export default defineComponent({
	name: 'LayoutHeader',
	components: { LogViewer, KpLink, KpImage },
	props: {
		title: {
			type: String,
			require: false,
		},
		isDisabledBack: {
			type: Boolean,
			default: false,
		},
		beforeGoBack: {
			type: Function as PropType<() => void>,
			default: () => {
				return;
			},
		},
		directRedirection: {
			type: Function as PropType<() => void>,
			require: false,
		},
	},
	setup(props, { slots }) {
		const router = useRouter();
		const pageTitle = computed(() => props.title);
		const hasSlot = (name: string) => !!slots[name];
		const isOpenHistoryPopup = ref<boolean>(false);

		const onClickBack = () => {
			props.beforeGoBack();
			if (props.directRedirection) {
				props.directRedirection();
			} else {
				router.back();
			}
		};

		const doOpenHistory = () => {
			isOpenHistoryPopup.value = !isOpenHistoryPopup.value;
		};

		watch(
			() => pageTitle.value,
			() => {},
		);

		return {
			pageTitle,
			hasSlot,
			onClickBack,
			doOpenHistory,
			isOpenHistoryPopup,
		};
	},
});
</script>

<template>
	<header class="flex flex-col items-center w-full" v-if="!pageTitle && !hasSlot('header')">
		<div class="w-full p-[20px]">
			<div @click="doOpenHistory" class="block w-[96px]"><kp-image class="w-full" src="images/logo/logo.svg" /></div>
		</div>
	</header>
	<template v-else>
		<header class="relative flex w-full items-center z-50 px-[20px] h-[65px] min-h-[65px]">
			<div class="absolute">
				<kp-link link="#" @click="onClickBack" class="w-[12px] h-[20px]" v-if="!isDisabledBack">
					<kp-image :src="`images/common/icon-back.svg`" />
				</kp-link>
			</div>
			<div class="w-full px-[12px] flex flex-row content-center items-center">
				<template v-if="hasSlot('header')">
					<slot name="header" />
				</template>
				<template v-else>
					<div class="title m-[auto]">
						{{ pageTitle }}
					</div>
				</template>
			</div>
		</header>
	</template>

	<log-viewer v-if="isOpenHistoryPopup" />
</template>

<style scoped></style>
