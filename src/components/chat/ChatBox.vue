<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ChatMessageInterface } from '@utils/group/dto/group';
import { getUserData } from '@utils/common-utils';
import KpImage from '@components/common/KpImage.vue';
import { MessageType } from '@src/types/types';
import moment from 'moment';
import KpLink from '@components/common/KpLink.vue';
import AppConfig from '@src/constants';
import { ChatUtilEvent, getChatUtils } from '@utils/group/chat-utils';

export default defineComponent({
	name: 'ChatBox',
	components: { KpLink, KpImage },
	props: {
		message: {
			type: Object as PropType<ChatMessageInterface>,
			default: {} as ChatMessageInterface,
		},
		setImagePreview: {
			type: Function as PropType<(src: string | undefined) => void>,
			default: (src: string | undefined) => {
				return;
			},
		},
		setVideoPreview: {
			type: Function as PropType<(src: string | undefined) => void>,
			default: (src: string | undefined) => {
				return;
			},
		},
		onLoad: {
			type: Function as PropType<(e: Event) => void>,
			required: false,
		},
	},

	setup(props) {
		const router = useRouter();
		const compMessage = computed(() => props.message);
		const isLeaveOrEnter = ref<boolean>(false);
		const isMyMessage = ref<boolean>(false);
		const hasDayDecoration = ref<boolean>();
		const msgViewDate = ref<string>();
		const dayPartition = ref<string>();
		const hasParent = ref<boolean>();
		const fileView = ref<string>();
		const userProfileView = ref<string>();
		const failSendMessage = ref<boolean>(false);

		const setLeaveOrEnterFlag = () => {
			isLeaveOrEnter.value = compMessage.value?.messageType === MessageType.ENTER || compMessage.value?.messageType === MessageType.LEAVE;
		};

		const setMyMessageFlag = () => {
			isMyMessage.value = !isLeaveOrEnter.value && compMessage.value?.userIdx === getUserData().userIdx;
		};

		const myChatBoxCSS = () => {
			let css = '';
			return css;
		};

		const messageTypeStyleCSS = (): string => {
			let css = ``;
			switch (compMessage.value?.messageType) {
				case MessageType.TEXT:
					break;
				case MessageType.VIDEO:
					break;
				case MessageType.IMAGE:
					break;
				case MessageType.EMERGENCY:
				case MessageType.EMERGENCY_VIDEO:
				case MessageType.EMERGENCY_IMAGE:
				case MessageType.EMERGENCY_ALARM:
					css += ` emergency`;
					break;
				case MessageType.ERROR:
					break;
			}
			return css;
		};

		const setDayPartition = () => {
			if (compMessage.value) {
				const day = compMessage.value.dateReg.getDate();
				const month = compMessage.value.dateReg.getMonth() + 1;
				const year = compMessage.value.dateReg.getFullYear();

				dayPartition.value = `${year}년 ${Number(month) < 10 ? '0' + month : month}월 ${Number(day) < 10 ? '0' + day : day}일`;
			}
		};

		const translateDateReg = () => {
			msgViewDate.value = moment(compMessage.value?.dateReg).format('LT');
		};

		const setParameterForDecoration = () => {
			hasDayDecoration.value = compMessage.value?.isDayFirstMsg;
			hasParent.value = !!compMessage.value?.parentSeq;
		};

		const handleOpenFile = () => {
			if (compMessage.value?.messageType === MessageType.IMAGE || compMessage.value?.messageType === MessageType.EMERGENCY_IMAGE) {
				props.setImagePreview(compMessage.value?.messageBody);
			} else if (compMessage.value?.messageType === MessageType.VIDEO || compMessage.value?.messageType === MessageType.EMERGENCY_VIDEO) {
				props.setVideoPreview(compMessage.value?.messageBody);
			}
		};

		const fileViewResolver = (): void => {
			try {
				if (
					compMessage.value?.messageType === MessageType.IMAGE ||
					compMessage.value?.messageType === MessageType.VIDEO ||
					compMessage.value?.messageType === MessageType.EMERGENCY_VIDEO ||
					compMessage.value?.messageType === MessageType.EMERGENCY_IMAGE
				) {
					const fileInfo = compMessage.value?.fileInfo;
					if (fileInfo) {
						const parsed = JSON.parse(fileInfo);
						fileView.value = parsed[0].fileOriginName;
					}
				}
			} catch (e) {
				console.log(e);
			}
		};

		const userProfileResolver = (): void => {
			try {
				if (
					compMessage.value &&
					compMessage.value?.messageType !== MessageType.ENTER &&
					compMessage.value?.messageType !== MessageType.LEAVE &&
					compMessage.value?.messageType !== MessageType.ERROR
				) {
					const userProfile = compMessage.value?.userProfile;
					if (userProfile) {
						const parsed = JSON.parse(userProfile);
						userProfileView.value = AppConfig.FILE_SERVER + parsed[0].savedName;
					}
				}
			} catch (e) {
				console.log(e);
			}
		};

		const getFailEvent = (e: Event) => {
			if (props.message.tempUuid === ((e as CustomEvent).detail as string)) {
				failSendMessage.value = true;
			}
		};

		const handleImageLoaded = (e: Event) => {
			if (props.onLoad) props.onLoad(e);
		};

		watch(
			() => compMessage.value,
			() => {
				// console.log(compMessage);
			},
		);

		onMounted(() => {
			setLeaveOrEnterFlag();
			setMyMessageFlag();
			setParameterForDecoration();
			translateDateReg();
			setDayPartition();
			fileViewResolver();
			userProfileResolver();

			getChatUtils().addEventListener(ChatUtilEvent.FAIL_SEND_MESSAGE, getFailEvent);
		});

		onUnmounted(() => {});

		return {
			hasDayDecoration,
			isMyMessage,
			isLeaveOrEnter,
			msgViewDate,
			dayPartition,
			hasParent,
			MessageType,
			fileView,
			userProfileView,
			isFileMessage: computed(() => {
				return (
					compMessage.value?.messageType === MessageType.IMAGE ||
					compMessage.value?.messageType === MessageType.VIDEO ||
					compMessage.value?.messageType === MessageType.EMERGENCY_IMAGE ||
					compMessage.value?.messageType === MessageType.EMERGENCY_VIDEO
				);
			}),
			isSingle: computed(() => {
				return compMessage.value?.isLastChild && !hasParent.value;
			}),
			handleOpenFile,
			myChatBoxCSS,
			messageTypeStyleCSS,
			failSendMessage,
			compMessage,
			handleImageLoaded,
		};
	},
});
</script>

<template>
	<div class="chat-box-wrapper w-full" :class="hasParent ? 'py-[0px] pl-[65px] pr-[20px]' : 'px-[20px]'">
		<div v-if="hasDayDecoration" class="day-deco-wrapper w-full flex justify-center my-[20px]">
			<div class="day-deco min-w-[145px] h-[30px] flex items-center px-[10px] justify-between rounded-[20px]">
				<kp-image src="images/icon/ico-chat-calendar.svg" class="w-[15px] h-[15px] mr-[10px]" />
				<span>{{ dayPartition }}</span>
			</div>
		</div>

		<div v-if="isLeaveOrEnter" class="day-deco-wrapper w-full flex justify-center my-[20px]">
			<div class="day-deco h-[30px] inline-flex items-center px-[10px] justify-center rounded-[20px]">
				<span>
					<label class="font-bold">{{ compMessage?.username ?? '알수 없음' }}</label>
					{{ compMessage?.messageType === MessageType.ENTER ? ' 님이 참가하셨습니다.' : ' 님이 퇴장하셨습니다.' }}
				</span>
			</div>
		</div>

		<div v-else-if="isMyMessage" class="my-message">
			<div class="flex items-end item-end flex-row-reverse" :class="message.changeSender ? 'mt-[15px]' : 'mt-[10px]'">
				<div class="message-wrapper px-[15px] py-[10px] max-w-[270px] rounded-[20px] break-all" :class="messageTypeStyleCSS()">
					<kp-link v-if="isFileMessage" class="message file w-full h-full" link="#" :on-click="handleOpenFile">
						<div v-if="message.tempUuid" class="flex justify-center items-center w-[100px] h-[100px]">
							<kp-image v-if="!failSendMessage" class="w-[80px] h-[80px]" src="images/icon/chat-load-icon.gif"></kp-image>
							<kp-image v-else class="w-[80px] h-[80px]" src="images/icon/file_error.svg"></kp-image>
						</div>
						<div v-else class="w-[100px] h-[100px]">
							<video class="w-full h-full" v-if="message.messageType === MessageType.VIDEO" :src="message.messageBody" />
							<img class="w-full h-full" v-else :src="message.messageBody" />
						</div>
					</kp-link>
					<div v-else class="message whitespace-pre-line">
						{{ message.messageBody }}
					</div>
				</div>
				<div class="message-deco-wrapper flex flex-col justify-evenly w-[70px] mr-[5px]">
					<div v-if="message.readCount > 0" class="read-count text-right">
						{{ message.readCount }}
					</div>
					<div v-if="message.isLastChild" class="date text-right min-w-[60px]">{{ msgViewDate }}</div>
				</div>
			</div>
		</div>

		<div v-else class="other-message">
			<div class="flex items-start flex-row" :class="message.changeSender || isSingle ? 'mt-[15px]' : 'mt-[10px]'">
				<div v-if="!hasParent" class="mr-[10px] min-w-[35px] w-[35px]">
					<kp-image v-if="userProfileView" class="w-[35px] h-[35px] object-cover rounded-[50%]" :src="userProfileView"></kp-image>
					<!-- default image -->
					<div v-else class="w-[35px] h-[35px] object-cover profile-background">
						<kp-image class="w-[15px] h-[20px]" src="images/common/base-profile.svg"></kp-image>
					</div>
				</div>
				<div class="message-contents flex items-end">
					<div class="message-info-wrapper flex flex-col mr-[5px]">
						<div v-if="!hasParent" class="user-id m-h-[17px] w-[270px]">{{ message.username ?? '알수 없음' }}</div>
						<div
							class="message-wrapper flex m-h-[20px] w-[270px] break-all"
							:class="[message.messageType.indexOf(MessageType.EMERGENCY) > -1 ? 'emergency' : '', hasParent ? 'mt-[0px]' : 'mt-[10px]']">
							<kp-link
								v-if="isFileMessage"
								class="message file px-[15px] py-[10px] rounded-[20px]"
								link="#"
								:on-click="handleOpenFile"
								:class="message.messageType.indexOf(MessageType.EMERGENCY) > -1 ? 'emergency' : ''">
								<video class="w-[100px] h-[100px]" v-if="message.messageType === MessageType.VIDEO" :src="message.messageBody" />
								<img class="w-[100px] h-[100px]" v-else :src="message.messageBody" @load="handleImageLoaded" />
							</kp-link>
							<div
								v-else
								class="message whitespace-pre-line px-[15px] py-[10px] rounded-[20px]"
								:class="message.messageType.indexOf(MessageType.EMERGENCY) > -1 ? 'emergency' : ''">
								{{ message.messageBody }}
							</div>
							<div class="message-deco-wrapper flex flex-col justify-end items-start w-full max-w-[70px] pl-[5px]">
								<div v-if="message.readCount > 0" class="read-count text-left">
									{{ message.readCount }}
								</div>
								<div v-if="message.isLastChild" class="date text-right">{{ msgViewDate }}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped></style>
