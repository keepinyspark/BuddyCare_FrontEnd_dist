<script lang="ts">
import { defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue';
import KpLink from '@components/common/KpLink.vue';
import { MessageType } from '@src/types/types';
import KpImage from '@components/common/KpImage.vue';
import { getGroupManager } from '@utils/group/group-instance';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import { getUserData } from '@utils/common-utils';

export default defineComponent({
	name: 'ChatBottom',
	components: { KpLink, KpImage },
	props: {
		sendMessageHandler: {
			type: Function as PropType<(obj: { value: string | File; type: MessageType }) => void>,
			required: false,
		},
		clickSubmitBtn: {
			type: Function as PropType<() => void>,
			required: false,
		},
	},

	setup(props) {
		const textValue = ref<string | null>();
		const hasText = ref<boolean>(false);
		const isReRender = ref<boolean>(false);
		const emergencyFlag = ref<boolean>(false);
		const fileInput = ref<HTMLInputElement>();
		const creatorFlag = ref<boolean>();
		const textAreaFocusFlag = ref<boolean>();

		const handleValueUpdate = (e: any) => {
			textValue.value = e;
		};

		const handleMappingType = (value: string | File): MessageType => {
			let messageType = MessageType.TEXT;
			if (value instanceof File) {
				if (value.type.indexOf('image/') > -1) {
					messageType = emergencyFlag.value ? MessageType.EMERGENCY_IMAGE : MessageType.IMAGE;
				} else if (value.type.indexOf('video/') > -1) messageType = emergencyFlag.value ? MessageType.EMERGENCY_VIDEO : MessageType.VIDEO;
			} else {
				messageType = emergencyFlag.value ? MessageType.EMERGENCY : MessageType.TEXT;
			}

			return messageType;
		};

		const doSubmit = (value: string | File) => {
			const type = handleMappingType(value);

			if (props.sendMessageHandler) {
				props.sendMessageHandler({ value: value as string | File, type: type });
				isReRender.value = !isReRender.value;
				hasText.value = false;
			}

			textValue.value = '';
		};

		const handleClickSubmit = () => {
			doSubmit(textValue.value as string);
		};

		const handleClickEmergencyBtn = () => {
			emergencyFlag.value = !emergencyFlag.value;
		};

		const handleClickFile = () => {
			fileInput.value?.click();
		};

		const handleClearFile = (e: Event) => {
			const inputHTML = e.target as HTMLInputElement;
			inputHTML.value = '';
		};

		const handleChangeFile = (e: Event) => {
			const inputHTML = e.target as HTMLInputElement;
			if (!supportsType(inputHTML)) {
				window.alert('지원하지 않는 파일 형식입니다.');
				return;
			}
			if (!supportsSize(inputHTML)) {
				window.alert('제한된 크기(25MB)를 초과하였습니다.');
				return;
			}

			doSubmit(inputHTML.files![0]);
		};

		const supportsType = (el: HTMLInputElement): boolean => {
			let enableType = false;

			const imageWhiteList = ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'tiff'];
			const videoWhiteList = ['mp4', 'mov', 'avi'];

			try {
				if (el.files && el.files.length > 0) {
					const targetFile = el.files[0];
					const fileType = targetFile.type;
					const size = targetFile.size;
					const ext = targetFile.name.split('.').pop();

					if (fileType.indexOf('image/') > -1 && ext) enableType = imageWhiteList.includes(ext);
					else if (fileType.indexOf('video/') > -1 && ext) enableType = videoWhiteList.includes(ext);
				}
			} catch (e) {
				console.log('e', e);
			} finally {
				return enableType;
			}
		};

		const supportsSize = (el: HTMLInputElement): boolean => {
			let enableSize = false;

			const imageMaxSize = 25 * 1024 * 1024;

			try {
				if (el.files && el.files.length > 0) {
					const targetFile = el.files[0];
					const fileType = targetFile.type;
					const size = targetFile.size;
					const ext = targetFile.name.split('.').pop();

					enableSize = size < imageMaxSize;
				}
			} catch (e) {
				console.log('e', e);
			} finally {
				return enableSize;
			}
		};

		const checkCreator = () => {
			const curGroup = getGroupManager().getCurrentGroup();
			if (curGroup && curGroup.creatorInfo && curGroup.creatorInfo.userIdx)
				creatorFlag.value = getUserData().userIdx === curGroup.creatorInfo.userIdx;
		};

		const handleLoadedComplete = () => {
			checkCreator();
		};

		onMounted(() => {
			getGroupManager().addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleLoadedComplete);
			checkCreator();
		});

		onUnmounted(() => {
			getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleLoadedComplete);
		});

		return {
			textValue,
			hasText,
			isReRender,
			emergencyFlag,
			fileInput,
			creatorFlag,
			textAreaFocusFlag,
			doSubmit,
			handleClickSubmit,
			handleValueUpdate,
			handleClearFile,
			handleClickFile,
			handleClickEmergencyBtn,
			handleChangeFile,
		};
	},
	methods: {
		handleKeyup(e: KeyboardEvent): void {
			if (e.code === 'Enter') {
				this.textValue += `\n`;
			}
		},
		handleInput(e: KeyboardEvent): void {
			const value = (e.target as HTMLTextAreaElement).value;
			this.hasText = !!value;
			this.textValue = value;
		},
		handleKeyDown(e: KeyboardEvent): void {
			const MAX_LINE_COUNT = 50;
			const value = (e.target as HTMLTextAreaElement).value;
			const lineSeparator = value.match(/\n/g || []);
			if (lineSeparator) {
				const lines = lineSeparator.length + 1;
				if (lines > MAX_LINE_COUNT) {
					if (e.key !== 'Backspace') {
						e.preventDefault();
						return;
					}
				}
			}
		},
		handleFocus(_: KeyboardEvent): void {
			this.textAreaFocusFlag = true;
		},
		handleBlur(_: KeyboardEvent): void {
			this.textAreaFocusFlag = false;
		},
	},
});
</script>

<template>
	<div>
		<div class="chat-bottom w-screen fixed left-0 bottom-0 py-[15px]">
			<div class="bottom-wrapper flex w-full h-full justify-between items-center px-[15px]">
				<div class="input-wrapper inline-flex flex-1 relative pr-[15px]">
					<div v-if="!hasText" class="icons-wrapper absolute flex items-center left-0 h-[40px]">
						<kp-link link="#" :on-click="handleClickFile" class="icon-wrapper h-full ml-[16px] flex">
							<kp-image v-if="emergencyFlag" class="w-[20px] h-[20px] my-auto" src="images/icon/ico-chat-file-white.svg"></kp-image>
							<kp-image v-else class="w-[20px] h-[20px] my-auto" src="images/icon/ico-chat-file.svg"></kp-image>
						</kp-link>
						<span class="bar disable-text-selection ml-[16px] w-[1px] flex color-[#AAB1BB]">&#124;</span>
					</div>
					<!-- text input-->
					<div
						class="text-area-wrapper w-full rounded-[20px] pr-[35px] py-[4px] min-h-[32px] flex items-center"
						:class="{ isFocus: textAreaFocusFlag, emergency: emergencyFlag }">
						<resize-textarea
							:key="isReRender"
							class="chat-input w-full rounded-[20px]"
							:rows="1"
							:minHeight="32"
							:maxHeight="70"
							maxlength="500"
							:modelValue="textValue"
							@blur="handleBlur"
							@focus="handleFocus"
							@input="handleInput"
							@keyup="handleKeyup"
							@keydown="handleKeyDown"
							:class="{ hasText, emergency: emergencyFlag }"></resize-textarea>
					</div>
					<!-- file input-->
					<input
						type="file"
						ref="fileInput"
						class="w-[0] h-[0]"
						id="messageFile"
						name="messageFile"
						@change="handleChangeFile"
						@click="handleClearFile" />
					<kp-link
						v-if="creatorFlag"
						link="#"
						:on-click="handleClickEmergencyBtn"
						class="emergency-btn h-full px-[20px] absolute right-[10px] top-0 inline-flex items-center">
						<kp-image class="object-cover w-[20px] h-[20px]" v-if="emergencyFlag" src="images/icon/ico-chat-emergency-white.svg" />
						<kp-image class="object-cover w-[20px] h-[20px]" v-else src="images/icon/ico-chat-emergency.svg" />
					</kp-link>
				</div>
				<kp-link link="#" class="flex" :on-click="handleClickSubmit"
					><kp-image class="w-[25px] h-[25px]" src="images/icon/ico-chat-arrow.svg"></kp-image
				></kp-link>
			</div>
		</div>
	</div>
</template>

<style scoped></style>
