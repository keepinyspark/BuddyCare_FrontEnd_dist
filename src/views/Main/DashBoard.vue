<script lang="ts">
import { defineComponent, onBeforeMount, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { SET_AUTH_TOKEN } from '@src/store/actions';
import { LoginUserInfoInterface, UserType } from '@src/types/types';
import { getUserData, loadLocalData } from '@utils/common-utils';
import { KEY_LIST } from '@src/constants-keys';
import { useRouter } from 'vue-router';
import AppConfig from '@src/constants';
import { getGroupManager } from '@utils/group/group-instance';
import { ChatUtilEvent, getChatUtils } from '@utils/group/chat-utils';

export default defineComponent({
	name: 'DashBoard',
	setup() {
		const store = useStore();
		const router = useRouter();
		const userInfo = ref<LoginUserInfoInterface | null>(null);

		const getLoginUserInfo = (): void => {
			const userData = loadLocalData(KEY_LIST.CONST.LOGIN_USER);
			if (userData) {
				userInfo.value = JSON.parse(userData);
			}
		};
		const handleChatConnect = () => {
			window.appInterface.getMessageType();
		};

		onBeforeMount(() => {
			getLoginUserInfo();
		});

		onMounted(() => {
			const userData = getUserData();
			if (store.state.authToken === '' && !!loadLocalData(AppConfig.KEY_LIST.CONST.LOGIN_TOKEN)) {
				store.commit(SET_AUTH_TOKEN, loadLocalData(AppConfig.KEY_LIST.CONST.LOGIN_TOKEN));
			}

			if (userData) {
				window.appInterface.setUserName(userData.userName);

				try {
					getChatUtils().addEventListener(ChatUtilEvent.CONNECT, handleChatConnect);
				} catch (e) {
					console.error(e);
				}

				if (userData.userType === UserType.MANAGER) {
					router.replace({ path: '/main-manager' });
				} else if (userData.userType === UserType.USER_DEVICE) {
					try {
						if (
							getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx !== undefined &&
							getUserData().userIdx !== getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx
						) {
							router.replace({ path: '/main-user' });
						} else {
							router.replace({ path: '/main-device' });
						}
					} catch (e) {
						console.error(e);
						router.replace({ path: '/main-device' });
					}
				} else if (userData.userType === UserType.USER) {
					router.replace({ path: '/main-user' });
				}
			}
		});

		return {};
	},
});
</script>

<template></template>

<style scoped></style>
