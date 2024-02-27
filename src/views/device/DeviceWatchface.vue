<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import KpImage from '@components/common/KpImage.vue';
import KpLink from '@components/common/KpLink.vue';
import { SET_POPUP } from '@src/store/actions';
import { PopupType } from '@src/types/types';
import { useStore } from 'vuex';
import WatchfacePopup from '@components/popup/WatchfacePopup.vue';
import { getApiClient } from '@utils/api-client';
import AppConfig from '@src/constants';
import { getImgUrl } from '@src/utils/common-utils';

export default defineComponent({
	name: 'DeviceWatchface',
	components: { WatchfacePopup, KpLink, KpImage, LayoutHeader },
	setup() {
		const store = useStore();
		const openWatchfaceDownloadPopup = ref<boolean>(false);
		const watchfaceList = ref<
			{
				displayIdx: string;
				displayFileInfo: string;
				imageFileInfo: string;
				displayName: string;
				displayDesc: string;
			}[]
		>([]);
		const selectWatchface = ref<{
			displayIdx: string;
			displayFileInfo: string;
			imageFileInfo: string;
			displayName: string;
			displayDesc: string;
		}>({
			displayIdx: '',
			displayFileInfo: '',
			imageFileInfo: '',
			displayName: '',
			displayDesc: '',
		});

		const onClickWatchface = (item: {
			displayIdx: string;
			displayFileInfo: string;
			imageFileInfo: string;
			displayName: string;
			displayDesc: string;
		}) => {
			selectWatchface.value = item;
			store.dispatch(SET_POPUP, PopupType.WATCHFACE);
			openWatchfaceDownloadPopup.value = true;
		};

		const handleCancel = () => {
			store.dispatch(SET_POPUP, PopupType.NONE);
			openWatchfaceDownloadPopup.value = false;
		};

		const handleSubmit = () => {
			store.dispatch(SET_POPUP, PopupType.NONE);
			openWatchfaceDownloadPopup.value = false;
		};

		const getList = () => {
			let params = {
				displayName: '',
				page: '1',
				pagingRow: '100',
			};
			getApiClient(AppConfig.API_URL, store)
				.post('/api/1/device-display/getDeviceDisplayInfo', params)
				.then(res => {
					if (res.data.resultCode === 0) {
						watchfaceList.value = res.data.data.dataList;
					}
				});
		};

		onMounted(() => {
			getList();
		});

		return { watchfaceList, selectWatchface, openWatchfaceDownloadPopup, onClickWatchface, handleCancel, handleSubmit, getImgUrl };
	},
});
</script>

<template>
	<layout-header title="기기 화면 설정" />
	<section class="p-[20px]">
		<ul class="flex flex-wrap justify-around">
			<li v-for="(item, index) in watchfaceList" :key="index" class="w-[140px] mb-[35px]">
				<kp-link
					:on-click="
						() => {
							onClickWatchface(item);
						}
					">
					<kp-image :src="getImgUrl(item.imageFileInfo) ?? ''" />
				</kp-link>
			</li>
		</ul>
	</section>
	<watchface-popup v-if="openWatchfaceDownloadPopup" :data="selectWatchface" :cancel-handler="handleCancel" :submit-handler="handleSubmit" />
</template>

<style scoped></style>
