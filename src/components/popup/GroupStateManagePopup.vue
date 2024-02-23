<script lang="ts">
import { defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue';
import { useStore } from 'vuex';

import { ProfileInterface } from '@views/settings/SettingGroup.vue';
import { Portal } from 'portal-vue';
import { PopupType } from '@src/types/types';
import { SET_POPUP } from '@src/store/actions';
import { getGroupManager } from '@utils/group/group-instance';
import { GroupUserManager } from '@utils/group/group-user-manager';
import KpLink from '@components/common/KpLink.vue';

export default defineComponent({
	name: 'GroupStateManagePopup',
	components: { KpLink, Portal },
	props: {
		userInfo: {
			type: Object as PropType<ProfileInterface>,
			required: false,
		},
		acceptHandler: {
			type: Function as PropType<(userIdx?: string) => void>,
			required: false,
		},
		refuseHandler: {
			type: Function as PropType<(userIdx?: string) => void>,
			required: false,
		},
	},
	setup(props) {
		const store = useStore();
		const targetUser = ref<ProfileInterface>();
		const isOpen = ref<boolean>(false);
		const isEmergencyTargetUser = ref<boolean>(false);

		const init = () => {
			if (props.userInfo) {
				isOpen.value = true;
				targetUser.value = props.userInfo;
				isEmergencyTargetUser.value = (getGroupManager() as GroupUserManager).getMyGroup()?.emergencyTargetUserIdx === targetUser.value?.userIdx;
			}
		};

		const handleAccept = () => {
			if (props.acceptHandler) props.acceptHandler();
		};

		const handleRefuse = () => {
			if (props.refuseHandler) props.refuseHandler();
			store.dispatch(SET_POPUP, PopupType.NONE);
		};

		onMounted(() => {
			init();
		});

		onUnmounted(() => {
			handleRefuse();
		});

		return {
			isOpen,
			targetUser,
			isEmergencyTargetUser,
			handleAccept,
			handleRefuse,
		};
	},
});
</script>

<template>
	<portal to="group-state-manage" v-if="isOpen && targetUser">
		<div
			class="group-state-manage-wrapper absolute w-[315px] bg-white left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] p-[20px] rounded-[10px] flex flex-col justify-between"
			:class="isEmergencyTargetUser ? 'h-[200px]' : 'h-[165px]'">
			<div class="main-notice mt-[10px]">
				<span class="text-center"> {{ targetUser.username }}님의 <br /> </span>
				<span>돌봄 그룹 연결을 취소하시겠습니까? </span>
			</div>
			<div v-if="isEmergencyTargetUser" class="emergency-deco mt-[10px]">
				<span>*긴급통화 연결 대상입니다.<br /> </span>
				<span>연결 취소 시 재설정이 필요합니다.</span>
			</div>
			<div class="button-area flex justify-between mt-[20px]">
				<kp-link link="#" :on-click="handleRefuse" class="refuse-btn w-[130px] h-[50px] rounded-[25px] flex items-center">
					<span class="w-full text-center">아니오</span></kp-link
				>
				<kp-link link="#" :on-click="handleAccept" class="accept-btn w-[130px] h-[50px] rounded-[25px] flex items-center"
					><span class="w-full text-center">예</span></kp-link
				>
			</div>
		</div>
	</portal>
</template>

<style scoped></style>
