<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, onUpdated, PropType, ref, watch } from 'vue';
import KpImage from '@components/common/KpImage.vue';
import KpLink from '@components/common/KpLink.vue';
import { ProfileInterface } from '@views/settings/SettingGroup.vue';
import { Portal } from 'portal-vue';
import { parsedImgSrc } from '@utils/common-utils';
import { SET_POPUP } from '@src/store/actions';
import { PopupType } from '@src/types/types';
import { useStore } from 'vuex';
import KpButton from '@components/common/KpButton.vue';

export default defineComponent({
	name: 'GroupEmergencyChangePopup',
	components: { KpButton, KpLink, KpImage, Portal },
	props: {
		userList: {
			type: Array as PropType<Array<ProfileInterface>>,
			required: false,
		},
		currentTargetIdx: {
			type: String as PropType<string>,
			default: '',
		},
		changeEmergencyHandler: {
			type: Function as PropType<(userIdx: string, groupIdx: string) => void>,
			required: false,
		},
		cancelHandler: {
			type: Function as PropType<() => void>,
			required: false,
		},
	},
	setup(props) {
		const store = useStore();
		const groupUserList = ref<ProfileInterface[]>();
		const isOpen = ref<boolean>(false);
		const compTargetIdx = computed(() => props.currentTargetIdx);
		const selectUser = ref<string>('');
		const selectGroup = ref<string>('');

		const init = () => {
			if (props.userList) {
				groupUserList.value = props.userList;
				setSelect();
			}
		};

		const handleChangeEmergencyUser = (userIdx: string, groupIdx: string) => {
			selectUser.value = userIdx;
			selectGroup.value = groupIdx;
		};

		const profileResolver = (v?: string): string | undefined => {
			return parsedImgSrc(v);
		};

		const setSelect = () => {
			if (compTargetIdx.value !== '') {
				selectUser.value = groupUserList.value?.filter(f => f.userIdx === compTargetIdx.value)[0].userIdx ?? '';
				selectGroup.value = groupUserList.value?.filter(f => f.userIdx === compTargetIdx.value)[0].groupIdx ?? '';
			}
		};

		watch(
			() => compTargetIdx.value,
			() => {
				setSelect();
			},
		);

		onMounted(() => {
			init();
		});

		onUnmounted(() => {
			store.dispatch(SET_POPUP, PopupType.NONE);
		});

		return {
			isOpen,
			groupUserList,
			selectUser,
			handleChangeEmergencyUser,
			disabledSubmit: computed(() => selectUser.value === '' || selectGroup.value === ''),
			handleChangeEmergency: () => {
				if (selectUser.value !== '' && selectGroup.value !== '') {
					if (props.changeEmergencyHandler) props.changeEmergencyHandler(selectUser.value, selectGroup.value);
				}
			},
		};
	},
});
</script>

<template>
	<portal to="group-users-emergency">
		<div
			class="group-users-emergency-wrapper absolute bg-white max-w-[315px] w-[315px] h-[340px] left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] p-[20px] rounded-[10px] flex flex-col justify-between">
			<div class="h-full overflow-y-scroll">
				<div v-for="user in groupUserList" :key="`${user.userIdx}_${new Date().getTime()}`" class="user-info-wrapper flex flex-col justify-evenly">
					<kp-link
						link="#"
						:on-click="() => handleChangeEmergencyUser(user.userIdx, user.groupIdx)"
						class="mb-[15px] h-[50px] flex items-center justify-between">
						<div class="flex items-center justify-start w-[55px] min-w-[55px] h-[50px]">
							<div v-if="user.imgSrc === 'images/common/base-profile.svg'" class="profile-background w-[40px] h-[40px]">
								<kp-image class="w-[20px] h-[25px] object-contain" src="images/common/base-profile.svg"></kp-image>
							</div>
							<kp-image v-else-if="user.imgSrc" class="w-[40px] h-[40px] rounded-[50%] object-cover" :src="user.imgSrc"></kp-image>
						</div>
						<div class="text-wrapper flex-1">
							<span class="user-name mr-[10px]">{{ user.username }}</span>
							<span class="user-id text-[#999999]">{{ user.ext }}</span>
						</div>
						<div class="flex items-center justify-end w-[60px] h-[50px]">
							<kpImage v-if="user.userIdx === selectUser" :src="`images/common/check-icon.png`" class="w-[20px] h-[15px]" />
						</div>
					</kp-link>
				</div>
			</div>

			<div class="btn-wrapper flex justify-between items-center w-full">
				<kp-button is-secondary :on-click="cancelHandler">취소</kp-button>
				<kp-button :is-disabled="disabledSubmit" :on-click="handleChangeEmergency">변경</kp-button>
			</div>
		</div>
	</portal>
</template>

<style scoped></style>
