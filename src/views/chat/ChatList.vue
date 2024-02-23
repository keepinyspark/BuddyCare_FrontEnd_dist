<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { Group } from '@utils/group/dto/group';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import { createGroupManager, getGroupManager } from '@utils/group/group-instance';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import ChatPreviewManager from '@components/chat/ChatPreviewManager.vue';
import moment from 'moment';
import { useRouter } from 'vue-router';

export default defineComponent({
	name: 'ChatList',
	components: { ChatPreviewManager, LayoutHeader },

	setup() {
		const router = useRouter();
		const groupList = ref<Group[]>();

		const handleChatDataLoaded = () => {
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

		const goToDashboard = () => {
			router.replace({ path: '/' });
		};

		onMounted(() => {
			getGroupManager().launchChat();
			getGroupManager().addEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleChatDataLoaded);
			getGroupManager().addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleChatDataLoaded);
			handleChatDataLoaded();
		});

		onUnmounted(() => {
			getGroupManager().removeEventListener(GroupManagerEvent.MESSAGE_RECEIVED, handleChatDataLoaded);
			getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleChatDataLoaded);
		});

		return { groupList, goToDashboard };
	},
});
</script>

<template>
	<layout-header title="그룹 채팅" />
	<div class="chat-list-wrapper px-[20px] mt-[20px]">
		<div v-for="group of groupList" :key="`${group.channelIdx}_${new Date().getTime()}`">
			<chat-preview-manager :selected-group="group"></chat-preview-manager>
		</div>
	</div>
</template>

<style scoped></style>
