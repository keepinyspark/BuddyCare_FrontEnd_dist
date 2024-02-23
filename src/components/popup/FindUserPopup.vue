<script lang="ts">
import { defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue';
import { FindUserInterface } from '@utils/api-utils';
import KpImage from '@components/common/KpImage.vue';
import KpLink from '@components/common/KpLink.vue';
import { parsedImgSrc } from '@utils/common-utils';
import { SET_POPUP } from '@src/store/actions';
import { PopupType } from '@src/types/types';
import { useStore } from 'vuex';

export default defineComponent({
	name: 'FindUserPopup',
	components: { KpLink, KpImage },
	props: {
		userInfo: {
			type: Object as PropType<FindUserInterface>,
			required: false,
		},
		doInviteUser: {
			type: Function as PropType<() => void>,
			default: () => {
				return;
			},
		},
		doCancelUser: {
			type: Function as PropType<() => void>,
			default: () => {
				return;
			},
		},
	},
	setup(props) {
		const store = useStore();
		const findUser = ref<FindUserInterface>();
		const isOpen = ref<boolean>(false);

		const init = () => {
			if (props.userInfo) {
				isOpen.value = true;
				findUser.value = props.userInfo;
			}
		};

		const profileResolver = (v?: string): string => {
			return parsedImgSrc(v) || '';
		};

		onMounted(() => {
			init();
		});

		onUnmounted(() => {
			store.dispatch(SET_POPUP, PopupType.NONE);
		});

		return {
			isOpen,
			findUser,
			profileResolver,
		};
	},
});
</script>

<template>
	<portal to="find-user-popup" v-if="isOpen">
		<div
			class="find-user-wrapper absolute bg-white max-w-[315px] w-[315px] h-[240px] left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] p-[20px] rounded-[10px] flex flex-col justify-between">
			<div v-if="findUser" class="user-info-wrapper w-full flex flex-col items-center justify-start">
				<kp-image
					v-if="findUser.userProfile"
					class="w-[60px] h-[60px] object-cover mb-[15px] rounded-[50%]"
					:src="profileResolver(findUser.userProfile)"></kp-image>
				<div v-else class="profile-background w-[60px] h-[60px] mb-[10px]">
					<kp-image class="w-[25px] h-[30px]" src="images/common/base-profile.svg"></kp-image>
				</div>
				<div class="user-name w-full text-center truncate">{{ findUser.username }}</div>
				<div class="user-id mt-[15px]">{{ findUser.userId }}</div>
			</div>
			<div class="flex justify-between items-center w-full">
				<kp-link link="#" :on-click="doCancelUser" class="bg-[#FF31311A] w-[130px] h-[50px] rounded-[25px] flex items-center"
					><div class="w-full text-center align-middle text-[#FF3131]">취소</div></kp-link
				>
				<kp-link link="#" :on-click="doInviteUser" class="bg-[#466FFF] w-[130px] h-[50px] rounded-[25px] flex items-center"
					><div class="w-full text-center align-middle text-[#ffffff]">연결신청</div></kp-link
				>
			</div>
		</div>
	</portal>
</template>

<style scoped></style>
