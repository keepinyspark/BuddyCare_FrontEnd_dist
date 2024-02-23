<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref, watch } from 'vue';
import { ChatMessageInterface, Group } from '@utils/group/dto/group';
import { useStore } from 'vuex';
import KpImage from '@components/common/KpImage.vue';
import KpLink from '@components/common/KpLink.vue';
import { getGroupManager } from '@utils/group/group-instance';
import { useRouter } from 'vue-router';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import moment from 'moment';
import { MessageType } from '@src/types/types';
import { parsedImgSrc } from '@utils/common-utils';

export interface MessageViewDto {
	messageBody: string;
	messageSeq: number;
	messageType: MessageType;
	fileInfo: string | undefined;
	dateReg: Date;
	viewDate: string;
	userId: string;
	username: string;
	userProfile: string | undefined;
}

export default defineComponent({
	name: 'ChatPreviewManager',
	components: { KpImage, KpLink },
	props: {
		selectedGroup: {
			type: Object as PropType<Group>,
			required: false,
		},
	},
	setup(props) {
		const store = useStore();
		const router = useRouter();
		const lastMessage = ref<ChatMessageInterface | undefined>();
		const isUpdated = ref<boolean>(false);
		const compGroup = computed(() => props.selectedGroup);
		const viewDate = ref<string>();
		const recentMessageList = ref<Array<MessageViewDto>>([]);

		const updateRecentMessage = () => {
			recentMessageList.value = [];
			if (compGroup.value) {
				const findGroup = getGroupManager().getGroup(compGroup.value?.groupIdx);
				const messageList = findGroup?.messageList;
				const messageTypeList = [
					MessageType.EMERGENCY,
					MessageType.TEXT,
					MessageType.IMAGE,
					MessageType.VIDEO,
					MessageType.EMERGENCY_VIDEO,
					MessageType.EMERGENCY_IMAGE,
					MessageType.EMERGENCY_ALARM,
				];
				if (messageList) {
					let msgCount = messageList.length;
					let stackCount = 2;
					const newRecentMessageList = [];
					for (let i = msgCount - 1; i >= 0; i--) {
						if (stackCount > 0) {
							if (messageTypeList.includes(messageList[i].messageType)) {
								newRecentMessageList.push({
									messageBody: messageList[i].messageBody,
									messageSeq: messageList[i].messageSeq,
									messageType: messageList[i].messageType,
									fileInfo: messageList[i].fileInfo,
									dateReg: messageList[i].dateReg,
									userId: messageList[i].userId,
									username: messageList[i].username,
									userProfile: messageList[i].userProfile,
								} as MessageViewDto);
								--stackCount;
							}
						}
					}
					recentMessageList.value = newRecentMessageList;
				}
			}
		};

		const updateChangeFlag = () => {
			if (compGroup.value) isUpdated.value = compGroup.value?.isUpdated();
		};

		const messageBodyResolver = () => {
			for (const msg of recentMessageList.value) {
				if ([MessageType.VIDEO, MessageType.IMAGE, MessageType.EMERGENCY_VIDEO, MessageType.EMERGENCY_IMAGE].indexOf(msg.messageType) > -1) {
					try {
						if (msg.fileInfo) {
							const parsed = JSON.parse(msg.fileInfo);
							const fileName = parsed[0].fileOriginName;
							if (fileName) msg.messageBody = fileName;
						}
					} catch (e) {
						//
					}
				}
			}
		};

		const openChannelRoom = () => {
			if (compGroup.value) {
				getGroupManager().joinChannel(compGroup.value.channelIdx);
				router.push({ path: `/chat-room/${compGroup.value.groupIdx}` });
			}
		};

		const handleMessageReceived = (e: Event) => {
			const updateChannelIdx = (e as CustomEvent).detail;
			if (compGroup.value?.channelIdx !== updateChannelIdx) return;

			updateRecentMessage();
			updateChangeFlag();
			dateResolver();
			messageBodyResolver();
		};

		const init = () => {
			updateRecentMessage();
			updateChangeFlag();
			dateResolver();
			messageBodyResolver();
		};

		const dateResolver = () => {
			for (const m of recentMessageList.value) {
				// const msgDate = m.dateReg;
				const curTime = new Date();

				const curDay = moment(curTime).format('LL');
				const messageDay = moment(m.dateReg).format('LL');
				const curYear = curTime.getFullYear();
				const msgYear = m.dateReg.getFullYear();

				if (curDay === messageDay) {
					m.viewDate = moment(m.dateReg).format('LT');
				} else if (curYear === msgYear) {
					m.viewDate = moment(m.dateReg).format('MMM Do').toString();
				} else {
					const day = m.dateReg.getDate();
					const month = m.dateReg.getMonth() + 1;
					const year = m.dateReg.getFullYear();
					m.viewDate = `${year}년 ${Number(month) < 10 ? '0' + month : month}월 ${Number(day) < 10 ? '0' + day : day}일`;
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
			MessageType,
			lastMessage,
			isUpdated,
			viewDate,
			recentMessageList,
			parsedImgSrc,
			openChannelRoom,
			isEmergency: computed(() => {
				return (
					recentMessageList.value.filter(f => f.messageType === MessageType.EMERGENCY || f.messageType === MessageType.EMERGENCY_ALARM).length > 0
				);
			}),
		};
	},
});
</script>

<template>
	<div class="chat-manager-dashboard-wrapper h-full">
		<div class="message-wrapper mb-[20px]">
			<kp-link
				link="#"
				class="message-area flex flex-col items-center px-[15px] mb-[10px] rounded-[15px] py-[5px]"
				:class="{ emergency: isEmergency }"
				:on-click="openChannelRoom">
				<div class="w-full" v-for="message in recentMessageList" :key="`${message.messageSeq}`">
					<div class="message-info flex justify-start justify-between items-center">
						<div class="flex flex-row w-[calc(100%_-_100px)]">
							<p class="overflow-hidden text-ellipsis w-[100%] whitespace-nowrap">
								<span class="class=&quot;userId font-bold">{{ message.username }}</span> :
								<span class="message-body truncate">{{ message.messageBody }}</span>
							</p>
						</div>
						<span class="date">{{ message.viewDate }}</span>
					</div>
				</div>
			</kp-link>
		</div>
	</div>
</template>

<style scoped></style>
