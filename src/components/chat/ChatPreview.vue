<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { ChatMessageInterface, Group } from '@utils/group/dto/group';
import { useStore } from 'vuex';
import KpImage from '@components/common/KpImage.vue';
import KpLink from '@components/common/KpLink.vue';
import { getGroupManager } from '@utils/group/group-instance';
import { useRouter } from 'vue-router';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import { MessageType } from '@src/types/types';
import moment from 'moment';
import AppConfig from '@src/constants';

export default defineComponent({
	name: 'ChatPreview',
	components: { KpImage, KpLink },
	setup() {
		const store = useStore();
		const router = useRouter();
		const lastMessage = ref<ChatMessageInterface | undefined>();
		const isUpdated = ref<boolean>(false);
		const compSelectedGroupIdx = computed(() => store.state.selectedGroup);
		const selectedGroup = ref<Group>();
		const msgViewDate = ref<string>();
		const msgViewBody = ref<string>();
		const userProfileView = ref<string>();

		const updateLastMessage = () => {
			if (selectedGroup.value) {
				const lastOne = selectedGroup.value.getLastMessage();
				if (lastOne) {
					lastMessage.value = lastOne;
					nextTick(() => {
						messageBodyResolver();
						userProfileResolver();
					});
				}
			}
		};

		const updateChangeFlag = () => {
			if (selectedGroup.value && selectedGroup.value?.isUpdated()) isUpdated.value = true;
		};

		const openChannelRoom = () => {
			if (selectedGroup.value) {
				getGroupManager().joinChannel(selectedGroup.value.channelIdx);
				router.push({ path: `/chat-room/${selectedGroup.value.groupIdx}` });
			}
		};

		const handleMessageReceived = (e: Event) => {
			const updateChannelIdx = (e as CustomEvent).detail;
			if (selectedGroup.value?.channelIdx !== updateChannelIdx) return;

			doMessageUpdate();
		};

		const init = () => {
			selectedGroup.value = getGroupManager().getCurrentGroup();
			nextTick(() => {
				doMessageUpdate();
			});
		};

		const doMessageUpdate = () => {
			updateLastMessage();
			updateChangeFlag();
			translateDateReg();
			messageBodyResolver();
			userProfileResolver();
		};

		const handleChangeGroup = () => {
			selectedGroup.value = getGroupManager().getCurrentGroup();
			updateLastMessage();
		};

		const translateDateReg = () => {
			if (moment().diff(moment(lastMessage.value?.dateReg), 'years') >= 1) {
				msgViewDate.value = moment(lastMessage.value?.dateReg).format('YY년 MM월 DD일');
			} else if (moment().diff(moment(lastMessage.value?.dateReg), 'days') >= 1) {
				msgViewDate.value = moment(lastMessage.value?.dateReg).format('MM월 DD일');
			} else {
				msgViewDate.value = moment(lastMessage.value?.dateReg).format('a h:mm');
			}
		};

		const messageBodyResolver = () => {
			if (lastMessage.value?.messageType) {
				switch (lastMessage.value.messageType) {
					case MessageType.TEXT:
					case MessageType.EMERGENCY:
					case MessageType.EMERGENCY_ALARM:
						msgViewBody.value = lastMessage.value?.messageBody;
						break;
					case MessageType.IMAGE:
					case MessageType.EMERGENCY_IMAGE:
						msgViewBody.value = '사진이 전송되었습니다.';
						break;
					case MessageType.VIDEO:
					case MessageType.EMERGENCY_VIDEO:
						msgViewBody.value = '동영상이 전송되었습니다.';
						break;
					case MessageType.ENTER:
						msgViewBody.value = `${lastMessage.value?.username}님이 참가하셨습니다.`;
						break;
					case MessageType.LEAVE:
						msgViewBody.value = `${lastMessage.value?.username}님이 퇴장하셨습니다.`;
						break;
					default:
						msgViewBody.value = lastMessage.value?.messageBody;
						break;
				}
			}
		};

		const userProfileResolver = (): void => {
			try {
				if (lastMessage.value) {
					if (
						[
							MessageType.EMERGENCY,
							MessageType.EMERGENCY_ALARM,
							MessageType.EMERGENCY_VIDEO,
							MessageType.EMERGENCY_IMAGE,
							MessageType.TEXT,
							MessageType.VIDEO,
							MessageType.IMAGE,
						].indexOf(lastMessage.value?.messageType) > -1
					) {
						const userProfile = lastMessage.value?.userProfile;
						if (userProfile) {
							const parsed = JSON.parse(userProfile);
							userProfileView.value = AppConfig.FILE_SERVER + parsed[0].savedName;
						} else {
							userProfileView.value = undefined;
						}
					} else {
						userProfileView.value = undefined;
					}
				}
			} catch (e) {
				console.log(e);
			}
		};

		watch(
			() => compSelectedGroupIdx.value,
			() => {
				handleChangeGroup();
			},
		);

		onMounted(() => {
			init();
			getGroupManager().addEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleMessageReceived);
		});

		onUnmounted(() => {
			getGroupManager().removeEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleMessageReceived);
		});

		return {
			lastMessage,
			isUpdated,
			isEmergency: computed(
				() =>
					lastMessage.value &&
					[MessageType.EMERGENCY, MessageType.EMERGENCY_ALARM, MessageType.EMERGENCY_IMAGE, MessageType.EMERGENCY_VIDEO].includes(
						lastMessage.value?.messageType,
					),
			),
			msgViewDate,
			msgViewBody,
			userProfileView,
			openChannelRoom,
			userProfileResolver,
			selectedGroup,
		};
	},
});
</script>

<template>
	<kpLink link="#" :on-click="openChannelRoom" class="preview w-full h-[180px]">
		<div class="preview-body flex justify-start items-center w-full h-[80px] rounded-[15px]" :class="{ emergency: isEmergency }">
			<div class="user-wrapper w-[80px] flex justify-center items-center relative">
				<kpImage v-if="userProfileView" class="w-[50px] h-[50px] object-cover rounded-[50%]" :src="userProfileView"></kpImage>
				<div v-else class="profile-wrapper w-[50px] h-[50px] rounded-[50%] flex items-center justify-center">
					<kpImage class="w-[20px] h-[25px]" src="images/common/base-profile.svg"></kpImage>
				</div>

				<div v-if="isUpdated" class="w-[15px] h-[15px] absolute top-0 right-[15px]">
					<div class="w-full h-full rounded-[100%] bg-[#FFF] flex items-center justify-center">
						<div class="w-[calc(100%_-_2px)] h-[calc(100%_-_2px)] rounded-[100%] bg-[#466FFF]"></div>
					</div>
				</div>
			</div>
			<div v-if="lastMessage" class="message-body flex flex-1 flex-col items-center pr-[15px] max-w-[calc(100%_-_75px)]">
				<div class="message-info w-full justify-between flex items-center mb-[5px]">
					<span class="user-id">{{ lastMessage.username }}</span>
					<span v-if="msgViewDate" class="date">{{ msgViewDate }}</span>
				</div>
				<div class="message-content w-full relative">
					<p class="message text-ellipsis overflow-hidden whitespace-nowrap">
						{{ msgViewBody }}
					</p>
				</div>
			</div>
			<div v-else></div>
		</div>
	</kpLink>
</template>

<style scoped></style>
