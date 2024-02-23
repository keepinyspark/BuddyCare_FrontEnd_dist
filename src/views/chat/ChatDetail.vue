<script lang="ts">
import { defineComponent, nextTick, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue';
import { ChatMessageInterface, Group } from '@utils/group/dto/group';
import KpLink from '@components/common/KpLink.vue';
import { useRoute, useRouter } from 'vue-router';
import { createGroupManager, getGroupManager, NotChatReadyException } from '@utils/group/group-instance';
import { MessageType, PopupType, UserType } from '@src/types/types';
import ChatBoxList from '@components/chat/ChatBoxList.vue';
import { useStore } from 'vuex';
import { RESET_SCROLL, SET_POPUP } from '@src/store/actions';
import { getMessageList } from '@utils/group/api/group-api';
import { getApiClient } from '@utils/api-client';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import KpImage from '@components/common/KpImage.vue';
import ChatUsersPopup from '@components/popup/ChatUsersPopup.vue';
import ChatBottom from '@components/chat/ChatBottom.vue';
import { getUserData, getUuid } from '@utils/common-utils';
import KpButton from '@components/common/KpButton.vue';
import { releaseSocket } from '../../utils/group/chat-utils';

export default defineComponent({
	name: 'ChatDetail',
	components: { KpButton, ChatBottom, ChatBoxList, ChatUsersPopup, KpLink, KpImage },
	props: {},
	setup(props) {
		const store = useStore();
		const router = useRouter();
		const route = useRoute();
		const currentChannel = ref<Group>();
		const curMessageList = ref<ChatMessageInterface[]>([]);
		const isWritingFlag = ref<boolean>(false);
		const messageArea = ref<HTMLDivElement>();
		const isOpenPopup = ref<boolean>();
		const imagePreviewSrc = ref<string>();
		const videoPreviewSrc = ref<string>();
		const scrollHeight = ref<number>(0);
		const previewWrapper = ref<HTMLDivElement | null>(null);
		const isDebug = false;

		const handleSendEmergencyAlarm = (e: Event) => {
			if (!currentChannel.value) return;
			const textParam = (e as CustomEvent).detail;

			if (textParam.senderIdx === getUserData().userIdx) {
				delete textParam.senderIdx;
				currentChannel.value?.addUnloadMessage(textParam);
				curMessageList.value = currentChannel.value?.messageList;
			}
		};
		const doSendMessage = (msgType: MessageType, value?: string | File) => {
			if (!currentChannel.value) {
				currentChannel.value = getGroupManager().getCurrentGroup();
			}
			if (!value) {
				return;
			}

			if (currentChannel.value) {
				switch (msgType) {
					case MessageType.TEXT:
					case MessageType.EMERGENCY:
					case MessageType.EMERGENCY_ALARM:
						const textParam = {
							messageBody: value as string,
							messageType: msgType,
							tempUuid: getUuid(),
						};

						currentChannel.value.addUnloadMessage(textParam);
						curMessageList.value = currentChannel.value.messageList;

						getGroupManager().sendChatMessage(textParam);

						store.dispatch(RESET_SCROLL);
						break;
					case MessageType.IMAGE:
					case MessageType.VIDEO:
					case MessageType.EMERGENCY_IMAGE:
					case MessageType.EMERGENCY_VIDEO:
						const fileParam = {
							messageBody: value,
							messageType: msgType,
							tempUuid: getUuid(),
						};

						currentChannel.value.addUnloadMessage(fileParam);
						curMessageList.value = currentChannel.value.messageList;

						getGroupManager().sendChatMessage(fileParam);

						store.dispatch(RESET_SCROLL);
						break;
					case MessageType.ERROR:
						break;
				}
			}
		};

		const hasMoreMessage = (): boolean => {
			return (currentChannel.value && curMessageList.value.length < currentChannel.value?.totalCount) ?? false;
		};

		const doLoadMoreMessage = (): void => {
			const param = {
				messageChannelIdx: currentChannel.value?.channelIdx,
				pagingKey: currentChannel.value?.pagingKey,
			};
			getMessageList(getApiClient(), param)
				.then(res => {
					if (currentChannel.value) {
						const msgList = res.data;
						const newMessageList = [];

						for (let i = msgList.length - 1; i >= 0; i--) {
							newMessageList.push(currentChannel.value.toMessageDto(msgList[i]));
						}
						currentChannel.value.messageList = newMessageList;
						curMessageList.value = currentChannel.value.messageList;
						nextTick(() => {
							if (currentChannel.value) {
								currentChannel.value.calculateReadCount();
								currentChannel.value.makeDayPartition();
								currentChannel.value.makeDecorationMarker();
								currentChannel.value.increasePagingKey();
								currentChannel.value.totalCount = res.totalCount;
							}
						});
					}
				})
				.catch(e => {
					throw e;
				});
		};

		const quitRoom = () => getGroupManager().quitChannel(currentChannel.value?.channelIdx);

		const updateMessageList = (channelIdx: string) => {
			if (currentChannel.value?.channelIdx === channelIdx) {
				const curChannel = getGroupManager().getGroupByChannelIdx(channelIdx);
				if (curChannel) {
					const messageDiv = (messageArea.value as any).messageArea as HTMLDivElement;
					const isBottom = messageDiv.clientHeight + messageDiv.scrollTop === messageDiv.scrollHeight;
					curMessageList.value = curChannel.messageList;

					nextTick(() => {
						if (isBottom) messageDiv.scrollTop = messageDiv.scrollHeight;
					});
				}
			}
		};

		const handleChannelUpdate = (e: Event) => {
			const updateChannelIdx = (e as CustomEvent).detail;
			updateMessageList(updateChannelIdx);
		};

		const handleUserJoin = (e: Event) => {
			const channelIdx = (e as CustomEvent).detail;
			if (currentChannel.value) {
				if (currentChannel.value.channelIdx === channelIdx) {
					currentChannel.value.calculateReadCount();
					updateMessageList(channelIdx);
				}
			}
		};

		const handleUserEnter = (e: Event) => {
			const channelIdx = (e as CustomEvent).detail;
			if (currentChannel.value) {
				if (currentChannel.value.channelIdx === channelIdx) {
					updateMessageList(channelIdx);
					currentChannel.value.calculateReadCount();
				}
			}
		};

		const handleLeaveChannel = (e: Event) => {
			const channelIdx = (e as CustomEvent).detail;
			if (currentChannel.value) {
				if (currentChannel.value.channelIdx === channelIdx) router.push({ path: `/` });
			}
		};

		const handleRemoveUser = (e: Event) => {
			const data = (e as CustomEvent).detail;
			const channelIdx = data.channelIdx;
			const leaveUserIdx = data.userIdx;

			if (currentChannel.value && currentChannel.value?.channelIdx === channelIdx) {
				curMessageList.value = getGroupManager().getGroupByChannelIdx(channelIdx)!.messageList;
				currentChannel.value?.calculateReadCount();
			}
		};

		const handleLoadedComplete = () => {
			initCurrentChannel();
			nextTick(() => {
				const groupIdx = route.params.id;
				const curGroup = getGroupManager().getGroup(groupIdx as string);
				if (curGroup) {
					getGroupManager().setCurrentChannel(curGroup.channelIdx);
					currentChannel.value = getGroupManager().getCurrentGroup();
					if (currentChannel.value?.messageList) curMessageList.value = currentChannel.value.messageList;
				}
			});
		};

		const handleKicked = (e: Event) => {
			const dt = (e as CustomEvent).detail;
			const channelIdx = dt.channelIdx;
			const userIdx = dt.userIdx;

			if (userIdx) window.alert('돌봄 그룹에서 제외 되었습니다.');
			else window.alert('연결된 기기 사용자의 계정이 삭제되었습니다. 새로운 기기 사용자의 연결이 필요합니다.');
			if (currentChannel.value && currentChannel.value.channelIdx === channelIdx) router.push({ path: `/` });
		};

		const onClickBack = () => {
			if (getUserData().userType !== UserType.MANAGER) {
				router.replace({ path: '/' });
			} else {
				if (route.query.redirect && route.query.redirect === 'chat-list') {
					router.replace('/chat-list');
				} else {
					router.replace({ path: '/' });
				}
			}
		};

		const handleClickHeaderIcon = () => {
			isOpenPopup.value = true;
			store.dispatch(SET_POPUP, PopupType.CHAT_USERS);
		};

		const handleClosePopup = () => {
			isOpenPopup.value = false;
			initCurrentChannel();
		};

		const initCurrentChannel = () => {
			currentChannel.value = getGroupManager().getCurrentGroup();
		};

		const handleSendMessage = (obj: { value: string | File; type: MessageType }) => {
			doSendMessage(obj.type, obj.value);
		};

		const setImagePreview = (src: string | undefined): void => {
			if (src) videoPreviewSrc.value = undefined;
			imagePreviewSrc.value = src;
		};

		const setVideoPreview = (src: string | undefined): void => {
			if (src) imagePreviewSrc.value = undefined;
			videoPreviewSrc.value = src;
		};

		const handleCloseFilePreview = () => {
			imagePreviewSrc.value = undefined;
			videoPreviewSrc.value = undefined;
		};

		initCurrentChannel();

		watch(
			() => getGroupManager().currentGroupIdx,
			(prev, next) => {
				if (!next || prev !== next) {
					if (!getGroupManager().currentChannelIdx) router.push({ path: `/` });
				}
			},
		);

		watch(
			() => imagePreviewSrc.value,
			() => {
				if (previewWrapper.value) {
					scrollHeight.value = previewWrapper.value?.scrollHeight + 160;
				}
			},
		);

		onMounted(() => {
			getGroupManager().addEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleChannelUpdate);
			getGroupManager().addEventListener(GroupManagerEvent.USER_JOIN, handleUserJoin);
			getGroupManager().addEventListener(GroupManagerEvent.USER_ENTER, handleUserEnter);
			getGroupManager().addEventListener(GroupManagerEvent.LEAVE_CHANNEL, handleLeaveChannel);
			getGroupManager().addEventListener(GroupManagerEvent.KICKED, handleKicked);
			getGroupManager().addEventListener(GroupManagerEvent.REMOVE_USER, handleRemoveUser);
			getGroupManager().addEventListener(GroupManagerEvent.UPDATE, handleChannelUpdate);
			getGroupManager().addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleLoadedComplete);
			getGroupManager().addEventListener(GroupManagerEvent.SEND_EMERGENCY_ALARM, handleSendEmergencyAlarm);
			currentChannel.value?.calculateReadCount();
			currentChannel.value?.makeDayPartition();
			currentChannel.value?.makeDecorationMarker();
			if (currentChannel.value) {
				curMessageList.value = currentChannel.value?.messageList;
				nextTick(() => {
					updateMessageList(currentChannel.value?.channelIdx ?? '');
				});
			}
			try {
				initCurrentChannel();
				createGroupManager().launchChat();
			} catch (e) {
				// if (e instanceof NotChatReadyException) {
				// 	createGroupManager().launchChat();
				// } else {
				// 	throw e;
				// }
				throw e;
			}
		});

		onUnmounted(() => {
			getGroupManager().removeEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleChannelUpdate);
			getGroupManager().removeEventListener(GroupManagerEvent.REMOVE_USER, handleRemoveUser);
			getGroupManager().removeEventListener(GroupManagerEvent.USER_ENTER, handleUserEnter);
			getGroupManager().removeEventListener(GroupManagerEvent.LEAVE_CHANNEL, handleRemoveUser);
			getGroupManager().removeEventListener(GroupManagerEvent.KICKED, handleKicked);
			getGroupManager().removeEventListener(GroupManagerEvent.USER_JOIN, handleUserJoin);
			getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleLoadedComplete);
			getGroupManager().removeEventListener(GroupManagerEvent.UPDATE, handleChannelUpdate);
			getGroupManager().removeEventListener(GroupManagerEvent.SEND_EMERGENCY_ALARM, handleSendEmergencyAlarm);

			quitRoom();
			getGroupManager().changeCurrentChannelIdx(undefined);

			releaseSocket();
		});

		return {
			previewWrapper,
			scrollHeight,
			currentChannel,
			curMessageList,
			messageArea,
			isWritingFlag,
			isOpenPopup,
			imagePreviewSrc,
			videoPreviewSrc,
			doLoadMoreMessage,
			hasMoreMessage,
			onClickBack,
			handleClickHeaderIcon,
			handleSendMessage,
			handleClosePopup,
			setImagePreview,
			setVideoPreview,
			handleCloseFilePreview,
			openMedia: () => {
				let url = imagePreviewSrc.value || videoPreviewSrc.value;
				if (url) {
					window.appInterface.openImageToBrowser(url);
				}
			},
			buttonStr: () => {
				let url = imagePreviewSrc.value || videoPreviewSrc.value;
				if (url && url.slice(url.length - 4, url.length) === '.avi') {
					return '다운로드';
				} else {
					return '크게 보기';
				}
			},
		};
	},
});
</script>

<template>
	<div class="chat-detail-wrapper relative">
		<!-- header-->
		<div
			v-if="!imagePreviewSrc && !videoPreviewSrc"
			class="chat-header-wrapper fixed flex left-0 top-0 w-full h-[65px] items-center z-[100] px-[20px]">
			<div class="chat-header w-full flex flex-row content-center items-center">
				<div class="flex flex-row content-center">
					<kpLink class="w-[13px] min-w-[13px] h-[20px] min-h-[20px]" link="#" @click="onClickBack">
						<kpImage class="w-full h-full" :src="`images/common/icon-back.svg`" />
					</kpLink>
				</div>
				<div class="chat-header-title w-full flex text-center items-center justify-center">그룹 채팅</div>
				<div class="flex max-w-full flex-row content-center">
					<kp-link class="w-[25px]" link="#" :on-click="handleClickHeaderIcon">
						<kp-image class="h-[25px]" src="images/icon/ico-people.svg" />
					</kp-link>
				</div>
			</div>
		</div>
		<!-- body-->
		<div class="chat-message-area-wrapper w-full pt-[65px]">
			<div v-if="currentChannel">
				<ChatBoxList
					ref="messageArea"
					:message-list="curMessageList"
					:do-load-more="doLoadMoreMessage"
					:has-more-message="hasMoreMessage"
					:set-image-preview="setImagePreview"
					:set-video-preview="setVideoPreview"
					:key="currentChannel.channelIdx"></ChatBoxList>
			</div>
		</div>
		<!-- footer-->
		<chat-bottom :send-message-handler="handleSendMessage"></chat-bottom>
		<chat-users-popup v-if="isOpenPopup" :close-popup-handler="handleClosePopup"></chat-users-popup>
		<!-- file preview-->
		<div v-if="imagePreviewSrc || videoPreviewSrc" class="src-wrapper w-screen h-screen absolute top-0 left-0 flex items-center flex-col z-[101]">
			<div class="w-full h-[80px] min-h-[80px] flex items-center justify-end px-[25px] z-[101]">
				<kp-link link="#" :on-click="handleCloseFilePreview">
					<kp-image class="w-[40px] h-[40px]" src="images/common/plus-icon-white.svg" />
				</kp-link>
			</div>

			<div
				style="
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					display: flex;
					flex-direction: column;
					justify-content: center;
				">
				<div ref="previewWrapper" class="inline-flex justify-center flex-col">
					<kp-image
						v-if="imagePreviewSrc"
						:src="imagePreviewSrc"
						class="max-w-[calc(100vw_-_40px)] max-h-[calc(100vh_-_300px)] object-contain mb-[30px]"></kp-image>
					<video
						v-if="videoPreviewSrc"
						:src="videoPreviewSrc"
						autoplay="true"
						controls="true"
						class="max-w-[calc(100vw_-_40px)] max-h-[40%] w-auto h-auto object-contain"></video>
				</div>

				<kp-button class="w-[80%] mt-[30px] m-auto" :on-click="openMedia">{{ buttonStr() }}</kp-button>
			</div>
		</div>
	</div>
</template>

<style scoped></style>
