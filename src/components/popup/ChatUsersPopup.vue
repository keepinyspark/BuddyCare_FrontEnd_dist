<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue';
import { useStore } from 'vuex';
import KpImage from '@components/common/KpImage.vue';
import KpLink from '@components/common/KpLink.vue';
import { ChatUserInterface, Group, GroupCreatorInterface } from '@utils/group/dto/group';
import { getGroupManager } from '@utils/group/group-instance';
import { SET_EMERGENCY_PHONE, SET_POPUP } from '@src/store/actions';
import { PopupType } from '@src/types/types';
import { getUserData, parsedImgSrc } from '@utils/common-utils';
import { cloneDeep, remove } from 'lodash';
import { getGroupList } from '@utils/group/api/group-api';
import { getApiClient } from '@utils/api-client';
import { STATE_REG } from '@components/Profile.vue';
import { ChatUtilEvent, getChatUtils } from '@utils/group/chat-utils';
import AppConfig from '@src/constants';

export default defineComponent({
	name: 'ChatUsersPopup',
	components: { KpLink, KpImage },
	props: {
		closePopupHandler: {
			type: Function as PropType<() => void>,
			default: () => {
				return;
			},
		},
	},
	setup(props) {
		const store = useStore();
		const chatUserList = ref<ChatUserInterface[]>();
		const creatorInfo = ref<GroupCreatorInterface>();
		const isOpen = ref<boolean>(false);
		const apiClient = computed(() => getApiClient(AppConfig.API_URL, store));

		const init = () => {
			getGroupList(getApiClient(), { stateReg: STATE_REG.RESOLVE })
				.then(res => {
					getGroupManager().groupList = [];
					const dataList = res.data as any;

					for (const dt of dataList) {
						const initGroup = new Group(dt.channelIdx, dt.channelToken, dt.groupIdx, dt.creatorInfo);
						initGroup.emergencyTargetUserIdx = dt.emergencyTargetUserIdx;
						getGroupManager().groupList.push(initGroup);

						initGroup.doLoadData();
					}
				})
				.catch(e => {
					throw e;
				});

			chatUserList.value = getGroupManager().getCurrentGroup()?.userList;
			isOpen.value = true;
			creatorInfo.value = getGroupManager().getCurrentGroup()?.creatorInfo;
			orderByUserList();
		};

		const orderByUserList = () => {
			if (chatUserList.value) {
				const sortedList = [];
				const tempUserList = cloneDeep(chatUserList.value);

				const findMe = tempUserList.find(v => v.userIdx === getUserData().userIdx);
				if (findMe) {
					sortedList.push(findMe);
					remove(tempUserList, v => v.userIdx === findMe.userIdx);
				}

				const findDeviceUser = tempUserList.find(v => v.userIdx === creatorInfo.value?.userIdx);
				if (findDeviceUser) {
					sortedList.push(findDeviceUser);
					remove(tempUserList, v => v.userIdx === findDeviceUser.userIdx);
				}

				const findEmergencyUser = tempUserList.find(v => v.userIdx === getGroupManager().getCurrentGroup()?.emergencyTargetUserIdx);
				if (findEmergencyUser) {
					sortedList.push(findEmergencyUser);
					remove(tempUserList, v => v.userIdx === findEmergencyUser.userIdx);
				}

				sortByABC(tempUserList);
				sortedList.push(...tempUserList);

				chatUserList.value = sortedList as Array<ChatUserInterface>;
			}
		};

		const sortByABC = (list: ChatUserInterface[]): void => {
			if (list) {
				list.sort(function (prev, next) {
					const valuePrev = prev.username.toUpperCase();
					const valueNext = next.username.toUpperCase();
					return valuePrev.localeCompare(valueNext, undefined, {
						numeric: true,
						sensitivity: 'base',
					});
				});
			}
		};

		const closePopup = () => {
			props.closePopupHandler();
			store.dispatch(SET_POPUP, PopupType.NONE);
		};

		const isCreator = (user: ChatUserInterface) => {
			return creatorInfo.value && user.userIdx === creatorInfo.value.userIdx;
		};

		const isEmergencyUser = (user: ChatUserInterface) => {
			return (
				getGroupManager().getCurrentGroup()?.emergencyTargetUserIdx && user.userIdx === getGroupManager().getCurrentGroup()?.emergencyTargetUserIdx
			);
		};

		const profileResolver = (dt: string): string => {
			return parsedImgSrc(dt) || '';
		};

		onMounted(() => {
			getChatUtils().addEventListener(ChatUtilEvent.ENTER_CHANNEL_COMPLETE, init);
			getChatUtils().addEventListener(ChatUtilEvent.REMOVE_USER, init);
			init();
		});

		onUnmounted(() => {
			closePopup();
			getChatUtils().removeEventListener(ChatUtilEvent.ENTER_CHANNEL_COMPLETE, init);
			getChatUtils().removeEventListener(ChatUtilEvent.REMOVE_USER, init);
		});

		return {
			isOpen,
			chatUserList,
			isCreator,
			profileResolver,
			isEmergencyUser,
			closePopup,
			doCall: () => {
				if (store.state.emergencyPhone !== '') {
					if (window.confirm('긴급 통화연결 대상에게 전화하시겠습니까?')) {
						if (getGroupManager().getCurrentGroup()?.emergencyTargetUserIdx) {
							if (getGroupManager().getCurrentGroup()?.emergencyTargetUserIdx) {
								apiClient.value
									.post('/api/1/users/getUserInfoByIdx', { userIdx: getGroupManager().getCurrentGroup()?.emergencyTargetUserIdx })
									.then(res => {
										if (res.data.resultCode !== 0) {
										} else {
											if (res.data.data.tel) {
												const phone = (res.data.data.tel as string).replace(/-/g, '');
												if (store.state.emergencyPhone !== phone) {
													store.commit(SET_EMERGENCY_PHONE, phone);
													window.appInterface.setEmergencyNum(phone);
													window.appInterface.doCall(phone);
												} else {
													window.appInterface.doCall(phone);
												}
											}
										}
									});
							}
						}
					}
				}
			},
		};
	},
});
</script>

<template>
	<portal to="chat-users" v-if="isOpen" class="chat-users-popup relative">
		<div class="chat-users-wrapper w-[300px] h-screen absolute right-0 top-0 flex flex-col px-[20px]">
			<div class="w-full pl-[5px] py-[23px] flex justify-between">
				<span class="title">그룹 정보</span>
				<kp-link link="#" :on-click="closePopup"> <kp-image class="w-[25px] h-[25px]" src="images/common/plus-icon.png" /> </kp-link>
			</div>
			<div v-for="(user, index) in chatUserList" class="user-wrapper flex items-center justify-between w-full mb-[15px]" :key="index">
				<div class="user-profile-wrapper w-[40px] h-[40px] flex justify-center items-center mr-[5px]">
					<div v-if="!user.userProfile" class="profile-background w-[30px] h-[30px] rounded-[50%]">
						<kpImage class="w-[15px] h-[20px]" src="images/common/base-profile.svg"></kpImage>
					</div>
					<kpImage v-else class="w-[30px] h-[30px] object-cover rounded-[50%]" :src="profileResolver(user.userProfile)"></kpImage>
				</div>
				<div class="user-info-wrapper flex flex-col flex-1">
					<span class="user-id mr-[10px] mb-[5px]">{{ user.username }}</span>
					<span class="user-etc">{{ user.userId }}</span>
				</div>
				<div v-if="isCreator(user)" class="creator w-[60px] h-[30px] text-center flex items-center justify-center rounded-[20px]">
					<span>사용자</span>
				</div>
				<div
					v-else-if="isEmergencyUser(user)"
					class="emergency-user w-[80px] h-[30px] flex items-center justify-center rounded-[20px]"
					@click.stop.prevent="doCall">
					<span>긴급통화자</span>
				</div>
			</div>
		</div>
	</portal>
</template>

<style scoped></style>
