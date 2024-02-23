<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import KpInput from '@components/common/KpInput.vue';
import KpButton from '@components/common/KpButton.vue';
import KpImage from '@components/common/KpImage.vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { getApiClient } from '@utils/api-client';
import Profile, { PROFILE_TYPE, STATE_REG } from '@components/Profile.vue';
import {
	addUserGroup,
	FindUserInterface,
	getEmergencyCandidateList,
	getGroupEmergencyInfo,
	getGroupInfo,
	getGroupRequestInfo,
	getUserInfoById,
	sendPushNoticeAlone,
	updateEmergencyTargetUser,
} from '@utils/api-utils';
import KpLink from '@components/common/KpLink.vue';
import { SET_POPUP } from '@src/store/actions';
import { CreatorDtoInterface, PopupType, UserDtoInterface } from '@src/types/types';
import FindUserPopup from '@components/popup/FindUserPopup.vue';
import GroupEmergencyChangePopup from '@components/popup/GroupEmergencyChangePopup.vue';
import { getUserData, parsedImgSrc } from '@utils/common-utils';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import { createGroupManager, getGroupManager } from '@utils/group/group-instance';
import { GroupUserManager } from '@utils/group/group-user-manager';
import AppConfig from '@src/constants';
import { getGroupList } from '../../utils/group/api/group-api';

export interface ProfileInterface {
	userIdx: string;
	imgSrc: string | undefined;
	username: string | undefined;
	ext: string | undefined;
	groupIdx: string;
	messageChannelIdx: string;
	stateReg?: STATE_REG;
	state?: string | boolean;
	isSlave?: boolean;
}

export interface GroupJoinRequestInterface {
	creatorIdx: string;
	creatorId: string;
	creatorName: string;
	creatorProfile: string | undefined;
	groupIdx: string;
	messageChannelIdx: string;
}

export const testParam = {
	groupIdx: getUserData() ? getUserData().groupIdx : '',
	userIdx: getUserData() ? getUserData().userIdx : '',
	messageChannelIdx: getUserData() ? getUserData().messageChannelIdx : '',
};

export default defineComponent({
	name: 'SettingGroup',
	components: { GroupEmergencyChangePopup, FindUserPopup, KpLink, Profile, KpInput, KpButton, KpImage, LayoutHeader },
	setup: function () {
		const store = useStore();
		const route = useRoute();
		const router = useRouter();
		const searchID = ref<string | undefined>();
		const emergencyTargetUser = ref<ProfileInterface>();
		const otherGroupUserList = ref<ProfileInterface[]>([]);
		const myGroupUserList = ref<ProfileInterface[]>([]);
		const searchUserInfo = ref<FindUserInterface | undefined>();
		const emergencyCandidateList = ref<ProfileInterface[] | undefined>();
		const groupJoinRequestList = ref<ProfileInterface[]>();
		const isDeviceUser = ref<boolean>(false);
		const isManager = ref<boolean>(false);
		const headerTitle = '돌봄 그룹 설정';

		const doSearchUser = (id: any) => {
			if (!validateId(id as string)) return;
			if (id === getUserData().userId) {
				window.alert('내 아이디입니다.');
				return;
			}

			getUserInfoById(getApiClient(), {
				userId: id,
				userIdx: getUserData().userIdx,
			})
				.then(res => {
					const findUser = res.data;
					if (findUser) {
						searchUserInfo.value = res.data as FindUserInterface;
						store.dispatch(SET_POPUP, PopupType.GROUP_FIND_USER);
						const keyInput = document.querySelector('input') as HTMLInputElement;
						if (keyInput) keyInput.blur();
					}
				})
				.catch(e => {
					if (e === 'msg.STATE_PENDING') {
						window.alert('연결 신청이 완료된 사용자입니다.');
					} else if (e === 'msg.STATE_RESOLVE') {
						window.alert('돌봄 그룹에 추가된 사용자입니다.');
					} else if (e === 'msg.RESULT_USER_NOT_FOUND') {
						window.alert('등록되지 않거나 탈퇴한 계정입니다.');
					} else {
						console.log('e', e);
					}
				});
		};

		const validateId = (id: string) => {
			return id && id.trim() !== '';
		};

		const doInviteUser = () => {
			let target = searchUserInfo.value?.userIdx;
			if (!target) return;

			addUserGroup(getApiClient(), { userIdx: target })
				.then(res => {
					myGroupUserList.value = [];
					otherGroupUserList.value = [];
					addGroupCreatorList(res.data.creatorList);
					addMyGroupUserList(res.data.userList);

					if (target) {
						sendPushNoticeAlone(getApiClient(), { targetUserIdx: target });
					}

					searchID.value = undefined;
					doClearUser();
					store.dispatch(SET_POPUP, PopupType.NONE);
				})
				.catch(e => {
					window.alert(e);
					store.dispatch(SET_POPUP, PopupType.NONE);
				});
		};

		const doClearUser = () => {
			searchUserInfo.value = undefined;
			store.dispatch(SET_POPUP, PopupType.NONE);
		};

		const groupUserListHandler = () => {
			getEmergencyCandidateList(getApiClient(), {})
				.then(res => {
					emergencyCandidateList.value = [];

					if (res.data.userList.length > 0) {
						for (const user of res.data.userList) {
							emergencyCandidateList.value.push({
								userIdx: user.userIdx,
								username: user.username,
								ext: user.userId,
								imgSrc: parsedImgSrc(user.userProfile) ?? 'images/common/base-profile.svg',
								stateReg: user.stateReg as STATE_REG,
								groupIdx: user.groupIdx,
								messageChannelIdx: user.messageChannelIdx,
							} as ProfileInterface);
						}
						store.dispatch(SET_POPUP, PopupType.GROUP_EMERGENCY_CHANGE);
					} else {
						window.alert('긴급통화 연결 대상이 없습니다.');
					}
				})
				.catch(e => console.log(e));
		};

		const initData = () => {
			initEmergencyUser();
			initGroupList();
			initJoinGroupRequest();
		};

		const initEmergencyUser = () => {
			getGroupEmergencyInfo(getApiClient(), {})
				.then(res => {
					const emergencyUserInfo = res.data.emergencyUserInfo;
					if (emergencyUserInfo && emergencyUserInfo.length > 0) {
						const user = emergencyUserInfo[0];
						const userProfileData = user.userProfile;
						let src;
						if (userProfileData) {
							const parsed = JSON.parse(userProfileData);
							src = AppConfig.FILE_SERVER + parsed[0].savedName;
						}
						emergencyTargetUser.value = {
							userIdx: user.userIdx,
							username: user.userName,
							ext: user.userId,
							imgSrc: src ?? 'images/common/base-profile.svg',
						} as ProfileInterface;
					} else {
						emergencyTargetUser.value = undefined;
					}
				})
				.catch(e => {
					if (e === 'msg.RESULT_NOT_FOUND_GROUP') {
						isDeviceUser.value = false;
					} else {
						console.log(e);
					}
				});
		};

		const initGroupList = () => {
			getGroupInfo(getApiClient(), {})
				.then(res => {
					myGroupUserList.value = [];
					otherGroupUserList.value = [];
					addMyGroupUserList(res.data.userList);
					addGroupCreatorList(res.data.creatorList);

					getGroupList(getApiClient(), { stateReg: STATE_REG.RESOLVE, noCache: true })
						.then(async res => {
							const dataList = res.data as any;
							await getGroupManager().updateGroupList(dataList);
						})
						.catch(e => {
							throw e;
						});
					// try {
					// 	createGroupManager().launchChat();
					// } catch (e) {
					// 	console.error(e);
					// }
				})
				.catch(e => console.log(e));
		};

		const addMyGroupUserList = (groupList: Array<UserDtoInterface>) => {
			for (const user of groupList) {
				if (user.userIdx !== getUserData().userIdx) {
					if (user.stateReg !== STATE_REG.REJECT) {
						myGroupUserList.value.push({
							userIdx: user.userIdx,
							username: user.username,
							ext: user.userId,
							imgSrc: parsedImgSrc(user.userProfile) ?? 'images/common/base-profile.svg',
							stateReg: user.stateReg as STATE_REG,
							groupIdx: user.groupIdx,
							messageChannelIdx: user.messageChannelIdx,
							isSlave: true,
						} as ProfileInterface);
					}
				}
			}
		};

		const addGroupCreatorList = (groupCreatorList: Array<CreatorDtoInterface>) => {
			for (const creator of groupCreatorList) {
				if (creator.creatorIdx !== getUserData().userIdx) {
					if (creator.stateReg === STATE_REG.RESOLVE) {
						otherGroupUserList.value.push({
							userIdx: creator.creatorIdx,
							username: creator.creatorName,
							ext: creator.creatorId,
							imgSrc: parsedImgSrc(creator.creatorProfile) ?? 'images/common/base-profile.svg',
							stateReg: creator.stateReg as STATE_REG,
							groupIdx: creator.groupIdx,
							messageChannelIdx: creator.messageChannelIdx,
						} as ProfileInterface);
					}
				}
			}
		};

		const initJoinGroupRequest = () => {
			getGroupRequestInfo(getApiClient(), {
				stateReg: STATE_REG.PENDING,
			})
				.then(res => {
					addJoinGroupRequestList(res.data.requestList as GroupJoinRequestInterface[]);
				})
				.catch(e => console.log(e));
		};

		const addJoinGroupRequestList = (list: GroupJoinRequestInterface[]) => {
			groupJoinRequestList.value = [];
			for (const req of list) {
				if (req.creatorIdx !== getUserData().userIdx) {
					groupJoinRequestList.value.push({
						userIdx: req.creatorIdx,
						imgSrc: parsedImgSrc(req.creatorProfile) ?? 'images/common/base-profile.svg',
						username: req.creatorName,
						ext: req.creatorId,
						groupIdx: req.groupIdx,
						messageChannelIdx: req.messageChannelIdx,
					} as ProfileInterface);
				}
			}
		};

		const handleAcceptJoinRequest = (list: GroupJoinRequestInterface[]) => {
			console.warn('handleAcceptJoinRequest');
			addJoinGroupRequestList(list);
			initGroupList();
			// ENTER_CHANNEL
		};

		const handleRemoveGroup = () => {
			initGroupList();
			initEmergencyUser();
		};

		const changeEmergencyHandler = (userIdx: string, groupIdx: string) => {
			if (emergencyTargetUser.value?.userIdx === userIdx) return;

			const param = {
				emergencyTargetUserIdx: userIdx,
				groupIdx,
			};

			updateEmergencyTargetUser(getApiClient(), param)
				.then(res => {
					changeEmergencyTargetUser(res.data.emergencyTargetUserIdx);
					store.dispatch(SET_POPUP, PopupType.NONE);
				})
				.catch(e => {
					console.log(e);
					store.dispatch(SET_POPUP, PopupType.NONE);
				});
		};

		const changeEmergencyTargetUser = (userIdx: string) => {
			const findUser = myGroupUserList.value.find(v => v.userIdx === userIdx);
			if (findUser) {
				emergencyTargetUser.value = {
					userIdx: findUser.userIdx,
					username: findUser.username,
					ext: findUser.ext,
					imgSrc: findUser.imgSrc,
				} as ProfileInterface;
			}
			const myGroup = (getGroupManager() as GroupUserManager).getMyGroup();
			if (myGroup) {
				if (findUser) myGroup.emergencyTargetUserIdx = findUser.userIdx;
				else myGroup.emergencyTargetUserIdx = null;
			}
		};

		const goBack = () => {
			const hasHistory = () => {
				return window.history.length > 2;
			};
			if (hasHistory()) {
				router.back();
			} else {
				router.push({ path: '/' });
			}
		};

		onMounted(() => {
			isDeviceUser.value = getUserData() && getUserData().userType === 'USER_DEVICE';
			isManager.value = getUserData() && getUserData().userType === 'MANAGER';
			initData();
		});

		onUnmounted(() => {});

		return {
			store,
			route,
			router,
			searchID,
			emergencyTargetUser,
			myGroupUserList,
			otherGroupUserList,
			searchUserInfo,
			emergencyCandidateList,
			isDeviceUser,
			groupJoinRequestList,
			headerTitle,
			isManager,
			PROFILE_TYPE,
			doSearchUser,
			handleRemoveGroup,
			doInviteUser,
			doClearUser,
			groupUserListHandler,
			handleAcceptJoinRequest,
			addJoinGroupRequestList,
			changeEmergencyHandler,
			closeEmergencyHandler: () => {
				store.dispatch(SET_POPUP, PopupType.NONE);
			},
			goBack,
		};
	},
	methods: {
		handleKeyup(e: any): void {
			if (e.key === 'Enter') {
				this.doSearchUser(this.searchID);
			}
		},
	},
});
</script>

<template>
	<layout-header :title="headerTitle" :direct-redirection="goBack" />
	<div class="group-wrapper box-wrapper flex flex-col w-full px-[20px] gap-[20px] pt-[30px] pb-[90px]">
		<div v-if="isDeviceUser" class="search-user-wrapper flex flex-col px-[20px] rounded-[10px]">
			<div class="notice flex flex-col justify-center items-center py-[20px]">
				<span>사용자 ID를 검색해 돌봄 그룹에</span> <span>보호자를 추가할 수 있습니다.</span>
			</div>
			<div class="search_bar relative h-[50px] rounded-[25px] mb-[30px]">
				<div class="absolute left-0 top-0 h-[48px] ml-[1px] my-[1px] rounded-l-[25px] flex justify-center items-center">
					<kp-image class="h-[20px] w-[20px]" src="images/icon/ico-search.svg"></kp-image>
				</div>
				<kpInput
					class="kp-input w-full h-full pl-[65px] pr-[30px] py-2 mr-[10px] rounded-[25px]"
					placeholder="아이디 검색"
					:model-value="searchID"
					@keyup="handleKeyup"
					@update:modelValue="searchID = $event" />
			</div>
		</div>

		<div v-if="isDeviceUser" class="emergency-wrapper box-wrapper flex flex-col rounded-[10px]">
			<div class="px-[20px]">
				<div class="title-wrapper py-[20px] flex">
					<kp-image class="w-[20px] h-[20px] mr-[10px] ml-[5px]" src="images/common/phone-icon.svg"></kp-image>
					<span class="title">긴급통화 연결 대상</span>
				</div>
				<Profile
					v-if="emergencyTargetUser"
					:user-info="emergencyTargetUser"
					:callback-handler="groupUserListHandler"
					:profile-type="PROFILE_TYPE.CHANGE_EMERGENCY_TARGET"
					:key="emergencyTargetUser.userIdx"
					class="mb-[20px]"></Profile>
				<div v-else class="empty flex justify-between items-center mb-[20px]">
					<span>긴급통화 대상자를 지정해주세요.</span>
					<kpLink class="change-btn w-[70px] h-[40px] flex items-center text-center rounded-[25px]" link="#" @click="groupUserListHandler">
						<span class="w-full">등록</span>
					</kpLink>
				</div>
			</div>
		</div>

		<div v-if="isDeviceUser" class="group-list-wrapper box-wrapper px-[20px] rounded-[10px]">
			<div class="title-wrapper py-[20px] flex">
				<kp-image class="w-[20px] h-[20px] mr-[10px] ml-[5px]" src="images/icon/ico-people.svg"></kp-image>
				<span class="title">내 돌봄 그룹원</span>
			</div>
			<div v-if="myGroupUserList.length > 0">
				<div v-for="user in myGroupUserList" :key="`${user.userIdx}_${user.groupIdx}_${user.stateReg}`">
					<profile v-if="user" :profile-type="PROFILE_TYPE.MY_GROUP_LIST" :user-info="user" :callback-handler="handleRemoveGroup"></profile>
				</div>
			</div>
			<div v-else class="empty mb-[20px]">
				<span>연결된 돌봄 그룹원이 없습니다.</span><br />
				<span>아이디를 검색해 돌봄 그룹을 연결해주세요.</span>
			</div>
		</div>

		<div class="join-request-wrapper box-wrapper flex flex-col rounded-[10px]">
			<div class="px-[20px]">
				<div class="title-wrapper py-[20px] flex">
					<kp-image class="w-[25px] h-[20px] mr-[10px] ml-[5px]" src="images/icon/ico-link.svg"></kp-image>
					<span class="title">연결 신청 수신함</span>
				</div>
				<div v-if="groupJoinRequestList && groupJoinRequestList.length > 0">
					<div v-for="joinRequestUser in groupJoinRequestList" :key="`${joinRequestUser.userIdx}_${new Date().getTime()}`">
						<Profile
							:user-info="joinRequestUser"
							:callback-handler="handleAcceptJoinRequest"
							:profile-type="PROFILE_TYPE.GROUP_JOIN_REQUEST"
							:key="joinRequestUser.userIdx"></Profile>
					</div>
				</div>
				<div v-else class="empty flex justify-between mb-[20px]">
					<span>승인 대기중인 연결 신청이 없습니다.</span>
				</div>
			</div>
		</div>

		<div class="group-list-wrapper box-wrapper px-[20px] rounded-[10px]">
			<div class="title-wrapper py-[20px] flex">
				<kp-image class="w-[20px] h-[20px] mr-[10px] ml-[5px]" src="images/icon/ico-people.svg"></kp-image>
				<span class="title">{{ isManager ? '돌봄 그룹' : '연결된 돌봄 그룹' }}</span>
			</div>
			<div v-if="otherGroupUserList.length > 0">
				<div v-for="user in otherGroupUserList" :key="`${user.userIdx}_${user.groupIdx}_${user.stateReg}`">
					<profile v-if="user" :profile-type="PROFILE_TYPE.MY_GROUP_LIST" :user-info="user" :callback-handler="handleRemoveGroup"></profile>
				</div>
			</div>
			<div v-else class="empty mb-[20px]">
				<span>연결된 돌봄 그룹이 없습니다.</span><br />
				<span>기기 사용자에게 그룹 연결을 요청해주세요.</span><br />
				<span class="desc">* 기기 사용자 > 설정 > 돌봄그룹설정 > 아이디 검색 > 연결신청</span>
			</div>
		</div>

		<!-- 유저 검색 팝업-->
		<find-user-popup v-if="searchUserInfo" :user-info="searchUserInfo" :do-invite-user="doInviteUser" :do-cancel-user="doClearUser">
		</find-user-popup>

		<!--//TODO 그룹 원 없을 시 처리-->
		<group-emergency-change-popup
			v-if="emergencyCandidateList"
			:user-list="emergencyCandidateList"
			:current-target-idx="emergencyTargetUser ? emergencyTargetUser.userIdx : ''"
			:change-emergency-handler="changeEmergencyHandler"
			:cancel-handler="closeEmergencyHandler" />
	</div>
</template>

<style scoped></style>
