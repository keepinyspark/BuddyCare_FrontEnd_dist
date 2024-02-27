<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue';
import { useStore } from 'vuex';
import KpImage from '@components/common/KpImage.vue';
import KpLink from '@components/common/KpLink.vue';
import { useRouter } from 'vue-router';
import { GroupJoinRequestInterface, ProfileInterface } from '@views/settings/SettingGroup.vue';
import { updateUserGroupJoinState, DeleteGroupUserRequest, deleteGroupUser } from '@utils/api-utils';
import { getApiClient } from '@utils/api-client';
import { getUserData } from '@utils/common-utils';
import { getGroupManager } from '@utils/group/group-instance';
import { CreatorDtoInterface, PopupType, UserDtoInterface } from '@src/types/types';
import { GroupUserManager } from '@utils/group/group-user-manager';
import GroupStateManagePopup from '@components/popup/GroupStateManagePopup.vue';
import { SET_POPUP } from '@src/store/actions';

export enum STATE_REG {
	PENDING = 'PENDING',
	RESOLVE = 'RESOLVE',
	REJECT = 'REJECT',
}

export enum PROFILE_TYPE {
	CHANGE_EMERGENCY_TARGET = 'CHANGE_EMERGENCY_TARGET',
	MY_GROUP_LIST = 'MY_GROUP_LIST',
	GROUP_JOIN_REQUEST = 'GROUP_JOIN_REQUEST',
}

export default defineComponent({
	name: 'Profile',
	components: { KpLink, KpImage, GroupStateManagePopup },
	props: {
		userInfo: {
			type: Object as PropType<ProfileInterface>,
			required: false,
		},
		profileType: {
			type: String as PropType<PROFILE_TYPE>,
			required: false,
		},
		changeUserState: {
			type: Function as PropType<(creatorList: Array<CreatorDtoInterface>, userList: Array<UserDtoInterface>) => void>,
			required: false,
		},
		callbackHandler: {
			type: Function as PropType<(v?: any) => void>,
			required: false,
		},
	},

	setup(props) {
		const store = useStore();
		const router = useRouter();
		const compUserInfo = computed(() => props.userInfo);
		const userIdx = ref<string>('');
		const imgSrc = ref<string>('');
		const username = ref<string>('');
		const ext = ref<string>('');
		const state = ref<boolean | string>('');
		const types = ref<PROFILE_TYPE | undefined>();
		const stateReg = ref<STATE_REG>();
		const stateRegView = ref<string>();
		const groupIdx = ref<string>();
		const channelIdx = ref<string>();
		const openManagePopup = ref<boolean>(false);

		const initData = () => {
			if (props.userInfo && props.userInfo.userIdx) userIdx.value = props.userInfo.userIdx;
			if (props.userInfo && props.userInfo.imgSrc) imgSrc.value = props.userInfo.imgSrc;
			if (props.userInfo && props.userInfo.username) username.value = props.userInfo.username;
			if (props.userInfo && props.userInfo.ext) ext.value = props.userInfo.ext;
			if (props.userInfo && props.userInfo.state) state.value = props.userInfo.state;
			if (props.userInfo && props.userInfo.stateReg) stateReg.value = props.userInfo.stateReg;
			if (props.userInfo && props.userInfo.groupIdx) groupIdx.value = props.userInfo.groupIdx;
			if (props.userInfo && props.userInfo.messageChannelIdx) channelIdx.value = props.userInfo.messageChannelIdx;
			if (props.profileType) types.value = props.profileType;
			stateResolver();
		};

		const handleRemoveGroup = () => {
			const param = {
				targetUserIdx: props.userInfo?.isSlave ? userIdx.value : getUserData().userIdx,
				groupIdx: groupIdx.value,
				channelIdx: channelIdx.value,
			};

			deleteGroupUser(getApiClient(), param as DeleteGroupUserRequest)
				.then(res => {
					if (props.callbackHandler) {
						props.callbackHandler();
						stateResolver();
						const data = res.data;

						// 내가 나갈 경우
						if (res.data.userIdx === getUserData().userIdx) {
							(getGroupManager() as GroupUserManager).leaveGroup(data.groupIdx, data.userIdx, data.channelIdx);
						} else if (data.stateReg === STATE_REG.RESOLVE) {
							getGroupManager().removeUser(data.groupIdx, data.userIdx, data.channelIdx);
						}
					}
				})
				.catch(e => console.log(e));
			store.dispatch(SET_POPUP, PopupType.NONE);
		};

		const handleOpenManagePopup = () => {
			store.dispatch(SET_POPUP, PopupType.GROUP_STATE_MANAGE);
			openManagePopup.value = true;
		};

		const handleCloseManagerPopup = () => {
			openManagePopup.value = false;
		};

		const handleChangeEmergency = () => {
			if (props.callbackHandler) props.callbackHandler();
		};

		const handleAcceptJoinRequest = () => {
			const userInfo = compUserInfo.value as ProfileInterface;
			const param = {
				groupIdx: userInfo.groupIdx,
				channelIdx: userInfo.messageChannelIdx,
				stateReg: STATE_REG.RESOLVE,
			};

			updateUserGroupJoinState(getApiClient(), param)
				.then(res => {
					if (props.callbackHandler) {
						props.callbackHandler(res.data.requestList as GroupJoinRequestInterface[]);
						getGroupManager().enterChannel({
							userIdx: getUserData().userIdx,
							groupIdx: userInfo.groupIdx,
							messageChannelIdx: userInfo.messageChannelIdx,
						});
					}
				})
				.catch(e => {
					if (e === 'msg.RESULT_DUPLICATED') window.alert('이미 등록된 매니저가 존재합니다.');
					console.log(e);
				});
		};

		const handleRefuseJoinRequest = () => {
			const userInfo = compUserInfo.value as ProfileInterface;
			const param = {
				groupIdx: userInfo.groupIdx,
				channelIdx: userInfo.messageChannelIdx,
				stateReg: STATE_REG.REJECT,
			};

			updateUserGroupJoinState(getApiClient(), param)
				.then(res => {
					if (props.callbackHandler) {
						props.callbackHandler(res.data.requestList as GroupJoinRequestInterface[]);
					}
				})
				.catch(e => console.error(e));

			console.warn(compUserInfo.value);
		};

		const stateResolver = () => {
			if (stateReg.value === STATE_REG.RESOLVE) {
				stateRegView.value = '연결취소';
			} else if (stateReg.value === STATE_REG.REJECT) {
				stateRegView.value = 'REJECT';
			} else if (stateReg.value === STATE_REG.PENDING) {
				stateRegView.value = '연결대기';
			}
		};

		onMounted(() => {
			initData();
		});

		onUnmounted(() => {});

		return {
			PROFILE_TYPE,
			STATE_REG,
			username,
			imgSrc,
			ext,
			stateReg,
			stateRegView,
			openManagePopup,
			isMyGroupList: computed(() => types.value === PROFILE_TYPE.MY_GROUP_LIST),
			isChangeEmergencyTarget: computed(() => types.value === PROFILE_TYPE.CHANGE_EMERGENCY_TARGET),
			isGroupJoinRequest: computed(() => types.value === PROFILE_TYPE.GROUP_JOIN_REQUEST),
			handleRemoveGroup,
			handleChangeEmergency,
			handleAcceptJoinRequest,
			handleRefuseJoinRequest,
			stateResolver,
			handleOpenManagePopup,
			handleCloseManagerPopup,
		};
	},
});
</script>

<template>
	<div class="profile-wrapper h-[40px] flex justify-start w-full mb-[20px] gap-0">
		<div class="w-[40px] min-w-[40px] flex justify-center items-center h-full mr-[15px]" :key="imgSrc">
			<div v-if="imgSrc === 'images/common/base-profile.svg'" class="profile-background w-[40px] h-[40px]">
				<kpImage class="w-[20px] h-[25px]" :src="imgSrc"></kpImage>
			</div>
			<kpImage v-else class="w-[40px] h-[40px] rounded-[50%] object-cover" :src="imgSrc"></kpImage>
		</div>
		<div
			class="flex justify-start w-full"
			:class="isGroupJoinRequest ? 'max-w-[calc(100vw_-_290px)]' : isMyGroupList ? 'max-w-[calc(100vw_-_240px)]' : 'max-w-[calc(100vw_-_200px)]'">
			<div
				class="profile-info flex flex-col h-full justify-start w-full"
				:class="isGroupJoinRequest ? 'max-w-[85%] w-[85%]' : isMyGroupList ? 'max-w-[90%] w-[90%]' : 'max-w-[75%] w-[75%]'">
				<span class="name mb-[5px] text-ellipsis overflow-hidden whitespace-nowrap">{{ username }}</span>
				<span class="etc text-ellipsis overflow-hidden whitespace-nowrap">{{ ext }}</span>
			</div>
		</div>
		<div class="profile-btn h-full flex items-center justify-end flex-1">
			<kpLink
				v-if="isMyGroupList"
				link="#"
				:on-click="handleOpenManagePopup"
				class="group-list-wrapper w-[100px] h-[40px] rounded-[25px] flex justify-center items-center"
				:class="stateReg === STATE_REG.RESOLVE ? 'state-resolve' : stateReg === STATE_REG.PENDING ? 'state-pending' : 'state-reject'"
				><div class="text-center">{{ stateRegView }}</div>
			</kpLink>
			<kp-link
				v-else-if="isChangeEmergencyTarget"
				link="#"
				:on-click="handleChangeEmergency"
				class="emergency-wrapper w-[70px] h-[40px] flex items-center text-center rounded-[25px]"
				><div class="w-full">변경</div>
			</kp-link>
			<div v-else-if="isGroupJoinRequest" class="join-request-wrapper flex justify-between w-full">
				<kp-link
					link="#"
					:on-click="handleRefuseJoinRequest"
					class="refuse-btn w-[70px] h-[40px] text-center mr-[10px] rounded-[25px] flex items-center flex items-center"
					><span class="w-full">거절</span></kp-link
				>
				<kp-link link="#" :on-click="handleAcceptJoinRequest" class="accept-btn w-[70px] h-[40px] text-center rounded-[25px] flex items-center"
					><span class="w-full">연결</span></kp-link
				>
			</div>
		</div>
		<group-state-manage-popup
			v-if="openManagePopup"
			:user-info="userInfo"
			:accept-handler="handleRemoveGroup"
			:refuse-handler="handleCloseManagerPopup"></group-state-manage-popup>
	</div>
</template>

<style scoped></style>
