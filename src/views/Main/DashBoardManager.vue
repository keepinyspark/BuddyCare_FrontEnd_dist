<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import KpImage from '@components/common/KpImage.vue';
import { createGroupManager, getGroupManager } from '@utils/group/group-instance';
import { Group, GroupCreatorInterface } from '@utils/group/dto/group';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import { useStore } from 'vuex';
import RefreshButton from '@components/layout/RefreshButton.vue';
import { SET_FOOTER_TYPE, SET_POPUP, SET_SYNC_UPDATE_TIME } from '@src/store/actions';
import { PopupType, UserType } from '@src/types/types';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import { getUserData, parsedImgSrc } from '@utils/common-utils';
import { useRouter } from 'vue-router';
import KpInput from '@components/common/KpInput.vue';
import moment from 'moment/moment';
import { Moment } from 'moment';
import UserDashboard from '@components/manager/UserDashboard.vue';
import { releaseSocket } from '../../utils/group/chat-utils';

export default defineComponent({
	name: 'DashBoardManager',
	components: { UserDashboard, KpInput, LayoutHeader, RefreshButton, KpImage },
	setup() {
		const store = useStore();
		const router = useRouter();
		const groupList = ref<Group[]>();
		const battery = ref<number>(0);
		const healthInfoUpdateTime = ref<string | Moment>(store.state.syncUpdateTime ? moment(store.state.syncUpdateTime) : '');
		const isOpenGroups = ref<boolean>(false);
		const searchUsername = ref<string>();
		const currentUserInfo = ref<GroupCreatorInterface>();
		const isUpdateData = ref(false);
		// .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ','),

		const getUpdateData = () => {
			isUpdateData.value = !isUpdateData.value;
		};

		const setUpdateTime = (time: string | Moment) => {
			healthInfoUpdateTime.value = time;
			store.commit(SET_SYNC_UPDATE_TIME, time instanceof moment ? (time as Moment).toDate() : new Date(time as string));
		};

		const updateChannelList = (e?: Event, channelIdx?: string) => {
			console.log(getGroupManager().getGroupList());
			groupList.value = getGroupManager()
				.getGroupList()
				.sort((a, b) => {
					if (b.messageList[b.messageList.length - 1]) {
						return (
							moment(b.messageList[b.messageList.length - 1].dateMod).valueOf() - moment(a.messageList[a.messageList.length - 1].dateMod).valueOf()
						);
					} else {
						return 0;
					}
				});
		};

		const handleChatLoadComplete = (e: Event) => {
			setUserInfo();
			updateChannelList(e);
		};

		const setUserInfo = () => {
			const curGroup = getGroupManager().getCurrentGroup();
			if (curGroup) currentUserInfo.value = curGroup.creatorInfo;
			else {
				const groupList = getGroupManager().getGroupList();
				if (groupList && groupList.length > 0) currentUserInfo.value = groupList[0].creatorInfo;
			}
		};

		const handleMessageReceived = (e: Event) => {
			const channelIdx = (e as CustomEvent).detail;
			updateChannelList(e, channelIdx);
		};

		const showMyGroupList = () => {
			isOpenGroups.value = true;
			store.dispatch(SET_POPUP, PopupType.GROUP_USERS);
		};

		const addChatEvent = () => {
			getGroupManager().addEventListener(GroupManagerEvent.LOAD_START, updateChannelList);
			getGroupManager().addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleChatLoadComplete);
			getGroupManager().addEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleMessageReceived);
		};

		const removeChatEvent = () => {
			getGroupManager().removeEventListener(GroupManagerEvent.LOAD_START, updateChannelList);
			getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleChatLoadComplete);
			getGroupManager().removeEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleMessageReceived);
		};

		const goToHealthPage = (path: string) => {
			router.push(`/health/${path}`);
		};

		const doSearchUser = () => {
			const searchName = searchUsername.value;
			if (searchName && searchName.trim() !== '') {
				groupList.value = getGroupManager()
					.groupList.filter(v => v.creatorInfo?.username.toUpperCase().includes(searchName.toUpperCase()))
					.sort((a, b) => {
						if (moment(a.dateMod).isBefore(moment(b.dateMod))) {
							return 1;
						} else if (moment(a.dateMod).isAfter(moment(b.dateMod))) {
							return -1;
						}
						return 0;
					});
			} else if (!searchName || searchName.trim() === '') {
				groupList.value = getGroupManager()
					.getGroupList()
					.sort((a, b) => {
						if (moment(a.dateMod).isBefore(moment(b.dateMod))) {
							return 1;
						} else if (moment(a.dateMod).isAfter(moment(b.dateMod))) {
							return -1;
						}
						return 0;
					});
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			const key = e.key;
			if (key === 'Enter') doSearchUser();
		};

		const creatorProfileResolver = (group: Group): string | undefined => {
			try {
				const userProfile = group.creatorInfo?.userProfile;
				return parsedImgSrc(userProfile);
			} catch (e) {
				console.log(e);
				return undefined;
			}
		};

		const initGroupList = () => {
			addChatEvent();
			setUserInfo();
			updateChannelList();
		};

		onMounted(() => {
			const userData = getUserData();
			if (userData) {
				if (userData.userType !== UserType.MANAGER) router.push({ path: '/' });
			}
			store.commit(SET_FOOTER_TYPE, UserType.MANAGER);
			try {
				createGroupManager().launchChat();
				initGroupList();
			} catch (e) {
				// if (e instanceof NotChatReadyException) {
				// 	createGroupManager().launchChat();
				// 	addChatEvent();
				// } else {
				// 	throw e;
				// }
				console.error(e);
			}
		});

		onUnmounted(() => {
			removeChatEvent();
			releaseSocket();
		});

		return {
			battery,
			groupList,
			isOpenGroups,
			searchUsername,
			currentUserInfo,
			showMyGroupList,
			getUpdateData,
			doSearchUser,
			handleKeyUp,
			creatorProfileResolver,
			isUpdateData,
			setUpdateTime,
			updateTime: computed(() => {
				return healthInfoUpdateTime.value === '' ? '' : (healthInfoUpdateTime.value as Moment).format('MM.DD a HH:mm');
			}),
		};
	},
});
</script>

<template>
	<layout-header />
	<section class="dash-board-manager pb-[70px]">
		<article class="board">
			<div class="header-area">
				<div class="input-wrapper relative w-[calc(100%_-_120px)] h-[50px] my-[20px] mx-[auto]">
					<kp-image class="absolute left-[20px] top-[15px] w-[20px] h-[20px]" src="images/icon/ico-search.svg"></kp-image>
					<kp-input
						class="kp-input board-input w-full h-full rounded-[25px] px-[50px]"
						placeholder="사용자 이름 검색"
						:model-value="searchUsername"
						@update:modelValue="searchUsername = $event"
						@keyup="handleKeyUp"
						@blur="doSearchUser">
					</kp-input>
				</div>
				<div class="text-wrapper w-[calc(100%_-_120px)] mx-[auto]">
					<div class="title-wrapper flex justify-between items-center mb-[10px]">
						<h2 class="title">사용자 목록</h2>
						<div class="flex flex-row items-center">
							<span class="time-refresh">{{ updateTime }}</span>
							<refresh-button @click="getUpdateData" />
						</div>
					</div>
				</div>
			</div>
			<div
				v-for="(group, index) in groupList"
				:key="`${group.groupIdx}_${group.emergencyState}`"
				class="content-wrapper w-[calc(100%_-_100px)] mx-[auto] px-[40px]"
				:class="[{ emergency: group.emergencyState }, { 'first-content': index === 0 && !group.emergencyState }]">
				<div class="content-detail-wrapper" :class="[{ 'last-content': groupList && index === groupList.length - 1 }]">
					<user-dashboard :current-group="group" :is-update-data="isUpdateData" :set-dashboard-update-time="setUpdateTime" />
				</div>
			</div>
		</article>
	</section>
</template>

<style scoped></style>
