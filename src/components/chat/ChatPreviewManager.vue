<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, onUpdated, PropType, ref } from 'vue';
import { ChatMessageInterface, Group } from '@utils/group/dto/group';
import KpImage from '@components/common/KpImage.vue';
import KpLink from '@components/common/KpLink.vue';
import { getGroupManager } from '@utils/group/group-instance';
import { useRouter } from 'vue-router';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import moment from 'moment';
import { MessageType } from '@src/types/types';
import AppConfig from '@src/constants';

export default defineComponent({
	name: 'ChatPreviewManager',
	components: { KpImage, KpLink },
	props: {
		selectedGroup: {
			type: Group as PropType<Group>,
			required: true,
		},
	},
	setup(props) {
		const router = useRouter();
		const lastMessage = ref<ChatMessageInterface | undefined>();
		const isUpdated = ref<boolean>(false);
		const compGroup = computed(() => props.selectedGroup);
		const viewDate = ref<string>();
		const userProfileView = ref<string>();

		const updateLastMessage = () => {
			if (compGroup.value) {
				const lastOne = compGroup.value.getLastMessage();
				if (lastOne) {
					lastMessage.value = lastOne;
					dateResolver();
					userProfileResolver();
					bodyResolver();
				}
			}
		};

		const updateChangeFlag = () => {
			if (compGroup.value) isUpdated.value = compGroup.value?.isUpdated();
		};

		const openChannelRoom = () => {
			if (compGroup.value) {
				getGroupManager().joinChannel(compGroup.value.channelIdx);
				router.push({ path: `/chat-room/${compGroup.value.groupIdx}`, query: { redirect: 'chat-list' } });
			}
		};

		const handleMessageReceived = (e: Event) => {
			const updateChannelIdx = (e as CustomEvent).detail;
			if (compGroup.value?.channelIdx !== updateChannelIdx) return;

			updateLastMessage();
			updateChangeFlag();
			dateResolver();
			userProfileResolver();
			bodyResolver();
		};

		const init = () => {
			updateLastMessage();
			updateChangeFlag();
			dateResolver();
			userProfileResolver();
			bodyResolver();
		};

		const dateResolver = () => {
			const lastMessageDate = lastMessage.value?.dateReg;
			const curTime = new Date();

			if (lastMessageDate) {
				const curDay = moment(curTime).format('LL');
				const messageDay = moment(lastMessageDate).format('LL');
				const curYear = curTime.getFullYear();
				const msgYear = lastMessageDate.getFullYear();

				if (curDay === messageDay) viewDate.value = moment(lastMessage.value?.dateReg).format('LT');
				else if (curYear === msgYear) {
					viewDate.value = moment(lastMessage.value?.dateReg).format('MMM Do').toString();
				} else {
					const day = lastMessage.value?.dateReg.getDate();
					const month = lastMessage.value?.dateReg.getMonth() ?? 0 + 1;
					const year = lastMessage.value?.dateReg.getFullYear();
					viewDate.value = `${year}.${Number(month) < 10 ? '0' + month : month}.${Number(day) < 10 ? '0' + day : day}`;
				}
			}
		};

		const userProfileResolver = (): void => {
			const userProfile = compGroup.value.creatorInfo?.userProfile;
			if (userProfile) {
				const parsed = JSON.parse(userProfile);
				userProfileView.value = AppConfig.FILE_SERVER + parsed[0].savedName;
			}
		};

		const bodyResolver = (): void => {
			if (lastMessage.value) {
				if (
					[MessageType.VIDEO, MessageType.IMAGE, MessageType.EMERGENCY_VIDEO, MessageType.EMERGENCY_IMAGE].indexOf(lastMessage.value.messageType) > -1
				) {
					if (lastMessage.value?.fileInfo) {
						try {
							const parsed = JSON.parse(lastMessage.value.fileInfo);
							const fileName = parsed[0].fileOriginName;
							if (fileName) lastMessage.value.messageBody = fileName;
						} catch (e) {
							//
						}
					}
				}
			}
		};

		onMounted(() => {
			init();
			getGroupManager().addEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleMessageReceived);
		});

		onUnmounted(() => {
			getGroupManager().removeEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleMessageReceived);
		});

		return {
			compGroup,
			lastMessage,
			isUpdated,
			viewDate,
			userProfileView,
			openChannelRoom,
			getMessageBody: () => {
				switch (lastMessage.value?.messageType) {
					case MessageType.IMAGE:
					case MessageType.EMERGENCY_IMAGE:
						return '사진이 전송되었습니다.';
					case MessageType.VIDEO:
					case MessageType.EMERGENCY_VIDEO:
						return '동영상이 전송되었습니다.';
					default:
						return lastMessage.value?.messageBody;
				}
			},
		};
	},
});
</script>

<template>
	<kpLink link="#" :on-click="openChannelRoom" class="preview-manager w-full h-[105px] bg-[#ffffff]">
		<div class="preview-body flex justify-start items-center w-full flex-1 h-[90px] rounded-[15px] my-[20px] p-[20px]">
			<div class="min-w-[50px] w-[50px] h-full flex justify-center items-start mr-[15px] relative">
				<kp-image v-if="userProfileView" class="min-w-[50px] w-[50px] h-[50px] object-cover rounded-[50%]" :src="userProfileView"></kp-image>
				<div v-else class="min-w-[50px] w-[50px] h-[50px] profile-background">
					<kp-image class="w-[25px] h-[30px]" src="images/common/base-profile.svg"></kp-image>
				</div>

				<div v-if="isUpdated" class="w-[15px] h-[15px] absolute top-0 right-0">
					<div class="w-full h-full rounded-[100%] bg-[#FFF] flex items-center justify-center">
						<div class="w-[calc(100%_-_2px)] h-[calc(100%_-_2px)] rounded-[100%] bg-[#466FFF]"></div>
					</div>
				</div>
			</div>
			<div v-if="lastMessage" class="message-body flex flex-col flex-1 items-start max-w-[calc(100%_-_65px)] h-full">
				<div class="message-info w-full flex items-center justify-between mb-[5px]">
					<span class="user-id">{{ compGroup.creatorInfo?.username }}</span>
					<span v-if="lastMessage.dateReg" class="date">{{ viewDate }}</span>
				</div>
				<div class="message-content w-full h-[40px]">
					<p class="break-all text-ellipsis overflow-hidden whitespace-normal w-full">
						{{ getMessageBody() }}
					</p>
					<div v-if="isUpdated" class="absolute w-[15px] h-[15px] rounded-[5px] bg-red-600 right-0 top-1"></div>
				</div>
			</div>
		</div>
	</kpLink>
</template>

<style scoped></style>
