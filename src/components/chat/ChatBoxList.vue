<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, onUnmounted, onUpdated, PropType, ref, watch } from 'vue';
import { ChatMessageInterface } from '@utils/group/dto/group';
import ChatBox from '@components/chat/ChatBox.vue';
import { useInfiniteScroll } from '@vueuse/core';
import { useStore } from 'vuex';
import { getGroupManager } from '@utils/group/group-instance';
import { GroupManagerEvent } from '@utils/group/group-base-manager';

export default defineComponent({
	name: 'ChatBoxList',
	components: { ChatBox },
	props: {
		messageList: {
			type: Array as PropType<Array<ChatMessageInterface>>,
			required: false,
			default: [] as Array<ChatMessageInterface>,
		},
		doLoadMore: {
			type: Function as PropType<() => void>,
			default: () => {},
		},
		hasMoreMessage: {
			type: Function as PropType<() => boolean>,
			default: () => {
				return false;
			},
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
	},

	setup(props) {
		const store = useStore();
		const messageArea = ref<HTMLElement>();
		const compMessageList = computed(() => props.messageList);
		const compResetScroll = computed(() => store.state.resetScroll);
		const areaHeightFromBottom = ref<number>(0);
		const isNeedHold = ref<boolean>(false);

		useInfiniteScroll(
			messageArea,
			() => {
				// load more
				if (props.doLoadMore) {
					if (props.hasMoreMessage()) {
						try {
							props.doLoadMore();
							isNeedHold.value = true;
						} catch (e) {
							console.error(e);
						}
					}
				}
			},
			{ distance: 10, direction: 'top' },
		);

		const scrollToBottom = () => {
			nextTick(() => {
				if (messageArea.value) messageArea.value.scrollTop = messageArea.value?.scrollHeight;
			});
		};

		const holdScrollY = () => {
			if (messageArea.value) messageArea.value.scrollTop = Number(messageArea.value?.scrollHeight - areaHeightFromBottom.value) ?? 0;
		};

		const calculateAreaHeightFromBottom = () => {
			const scrollHeight = messageArea.value?.scrollHeight;
			if (scrollHeight) areaHeightFromBottom.value = scrollHeight;
		};

		const handleMessageUpdate = () => {
			nextTick(() => {
				scrollToBottom();
			});
		};

		const handleResize = () => {
			scrollToBottom();
		};

		const handleChatOnLoad = (e: Event) => {
			nextTick(() => {
				scrollToBottom();
			});
		};

		watch(compResetScroll, () => {
			nextTick(() => {
				scrollToBottom();
			});
		});

		onMounted(() => {
			window.addEventListener('resize', handleResize);
			getGroupManager().addEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleMessageUpdate);
			nextTick(() => {
				scrollToBottom();
				calculateAreaHeightFromBottom();
			});
		});

		onUpdated(() => {
			nextTick(() => {
				if (isNeedHold.value) {
					holdScrollY();
					calculateAreaHeightFromBottom();
					isNeedHold.value = false;
				}
			});
		});

		onUnmounted(() => {
			window.removeEventListener('resize', handleResize);
			getGroupManager().addEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleMessageUpdate);
		});

		return {
			messageArea,
			compMessageList,
			handleChatOnLoad,
		};
	},
});
</script>

<template>
	<div ref="messageArea" id="message-area" class="chat-message-list-wrapper overflow-x-hidden overflow-y-auto h-[calc(100vh_-_135px)] pb-[10px]">
		<div v-for="message in compMessageList" :key="`${message.messageSeq}_${message.readCount}`">
			<chat-box :message="message" :set-image-preview="setImagePreview" :set-video-preview="setVideoPreview" :on-load="handleChatOnLoad"></chat-box>
		</div>
	</div>
</template>

<style scoped></style>
