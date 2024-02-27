<script lang="ts">
import { defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue';
import { useStore } from 'vuex';
import KpImage from '@components/common/KpImage.vue';
import KpLink from '@components/common/KpLink.vue';
import { GroupCreatorInterface } from '@utils/group/dto/group';
import { getGroupManager } from '@utils/group/group-instance';
import { SET_POPUP } from '@src/store/actions';
import { PopupType } from '@src/types/types';
import { GroupUserManager } from '@utils/group/group-user-manager';
import { getUserData, parsedImgSrc } from '@utils/common-utils';

export default defineComponent({
	name: 'GroupUsersPopup',
	components: { KpLink, KpImage },
	props: {
		closeHandler: {
			type: Function as PropType<() => void>,
			required: false,
		},
	},
	setup(props) {
		const store = useStore();
		const curGroup = ref<GroupCreatorInterface>();
		const groupInfoList = ref<GroupCreatorInterface[]>([]);
		const isOpen = ref<boolean>(false);

		const init = () => {
			curGroup.value = getGroupManager().getCurrentGroup()?.creatorInfo;

			for (const group of getGroupManager().groupList) {
				if (group.creatorInfo && group.creatorInfo.userIdx !== curGroup.value?.userIdx) groupInfoList.value?.push(group.creatorInfo);
			}

			isOpen.value = true;
		};

		const handleSelectGroup = (user: GroupCreatorInterface) => {
			const creatorIdx = user.userIdx;
			const findGroup = getGroupManager().groupList.find(g => g.creatorInfo?.userIdx === creatorIdx);
			if (findGroup) (getGroupManager() as GroupUserManager).setCurrentGroup(findGroup.groupIdx);
			if (props.closeHandler) props.closeHandler();
			store.dispatch(SET_POPUP, PopupType.NONE);
		};

		const profileResolver = (v: string): string => {
			return parsedImgSrc(v) || 'images/common/base-profile.svg';
		};

		onMounted(() => {
			init();
		});

		onUnmounted(() => {
			if (props.closeHandler) props.closeHandler();
			store.dispatch(SET_POPUP, PopupType.NONE);
		});

		return {
			isOpen,
			curGroup,
			groupInfoList,
			handleSelectGroup,
			profileResolver,
		};
	},
});
</script>

<template>
	<portal to="group-users" v-if="isOpen" class="group-users-popup relative">
		<div class="group-users-wrapper w-full min-h-[80px] absolute left-0 top-0 flex flex-col rounded-b-[25px]">
			<div v-if="curGroup" class="cur-group px-[30px] h-[80px] flex items-center justify-between" :class="{ single: groupInfoList.length < 1 }">
				<div class="mr-[15px]">
					<div v-if="!curGroup.userProfile" class="profile-background w-[40px] h-[40px]">
						<kp-image class="w-[20px] h-[25px]" src="images/common/base-profile.svg"></kp-image>
					</div>
					<kp-image v-else class="w-[40px] h-[40px] object-cover rounded-[50%]" :src="profileResolver(curGroup.userProfile)"></kp-image>
				</div>
				<div class="text-wrapper flex-1">
					<span class="user-name mr-[10px]">{{ curGroup.userId }}</span>
					<span class="user-etc">{{ curGroup.username }}</span>
				</div>
				<kp-image class="w-[20px] h-[15px]" src="images/common/check-icon.png"></kp-image>
			</div>
			<div v-if="groupInfoList && groupInfoList.length > 0" class="w-full h-full">
				<div class="group-list-wrapper rounded-b-[25px]" v-for="group of groupInfoList" :key="`${group.userIdx}`">
					<kp-link link="#" class="group-area flex items-center h-[70px] px-[30px] w-full" :on-click="() => handleSelectGroup(group)">
						<div class="mr-[15px]">
							<div v-if="!group.userProfile" class="profile-background w-[40px] h-[40px]">
								<kp-image class="w-[20px] h-[25px]" src="images/common/base-profile.svg"></kp-image>
							</div>
							<kp-image v-else class="w-[40px] h-[40px] rounded-[50%] object-cover" :src="profileResolver(group.userProfile)"></kp-image>
						</div>
						<div class="text-wrapper">
							<span class="user-name mr-[10px]">{{ group.userId }}</span>
							<span class="user-etc">{{ group.username }}</span>
						</div></kp-link
					>
				</div>
			</div>
		</div>
	</portal>
</template>

<style scoped></style>
