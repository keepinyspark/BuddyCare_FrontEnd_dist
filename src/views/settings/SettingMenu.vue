<script lang="ts">
import { defineComponent, onBeforeMount, onMounted, onUnmounted, ref } from 'vue';
import KpImage from '@components/common/KpImage.vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { PROFILE_TYPE } from '@components/Profile.vue';
import KpLink from '@components/common/KpLink.vue';
import KpButton from '@components/common/KpButton.vue';
import { SET_AUTH_TOKEN, SET_FOOTER_TYPE, SET_HEADER_TITLE } from '@src/store/actions';
import { doLogout, getUserData, loadLocalData, parsedImgSrc, removeLocalData, saveLocalData } from '@utils/common-utils';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import { KEY_LIST } from '../../constants-keys';
import { removeCookie } from 'typescript-cookie';
import { AndroidEventType, LoginUserInfoInterface, UserType } from '@src/types/types';
import { removeGroupManager } from '@utils/group/group-instance';
import { remove } from 'lodash';
import { getApiClient } from '@utils/api-client';
import AppConfig from '@src/constants';
import { clearGroupListCache } from '../../utils/group/api/group-api';

export enum SETTING_TYPE {
	GROUP = 'group',
	TARGET = 'target',
	ALARM = 'alarm',
	APPALARM = 'app-alarm',
	BRIEF = 'brief',
	AIHELP = 'ai-help',
	LOGOUT = 'logout',
}

export default defineComponent({
	name: 'SettingMenu',
	components: { KpLink, KpImage, KpButton, LayoutHeader },
	setup: function () {
		const headerTitle = '설정';
		const store = useStore();
		const route = useRoute();
		const apiClient = getApiClient(AppConfig.API_URL, store);
		const router = useRouter();
		const userInfo = ref<LoginUserInfoInterface | null>(null);
		const username = ref<string>();
		const userId = ref<string>();
		const userProfile = ref<string>();
		const isManager = ref<boolean>();
		const settingListPrototype = ref<{ type: SETTING_TYPE; name: string; hasArrow: boolean }[]>([
			{ type: SETTING_TYPE.GROUP, name: '돌봄 그룹 설정', hasArrow: true },
			{ type: SETTING_TYPE.LOGOUT, name: '로그아웃', hasArrow: false },
		]);

		const handleClickSetting = (type: SETTING_TYPE) => {
			switch (type) {
				case SETTING_TYPE.GROUP:
					router.push({ path: '/setting/group' });
					break;
				case SETTING_TYPE.TARGET:
					window.appInterface.getConnectedStatus();
					router.push({ path: '/setting/target' });
					break;
				case SETTING_TYPE.ALARM:
					window.appInterface.getConnectedStatus();
					router.push({ path: '/setting/alarm' });
					break;
				case SETTING_TYPE.APPALARM:
					window.appInterface.openAppNotifications();
					break;
				case SETTING_TYPE.BRIEF:
					window.appInterface.openMorningBriefSettings();
					break;
				case SETTING_TYPE.AIHELP:
					window.appInterface.openAISettings();
					break;
				case SETTING_TYPE.LOGOUT:
					if (window.confirm('로그아웃 하시겠습니까?')) onClickLogout();
					break;
			}
		};

		const onClickLogout = () => {
			store.commit(SET_AUTH_TOKEN, '');
			store.commit(SET_FOOTER_TYPE, UserType.USER);
			try {
				window.appInterface.disconnectDevice();
			} catch (e) {
				console.error(e);
			}
			clearGroupListCache();
			removeGroupManager();
			doLogout(store);
			router.replace('/login');
		};

		const onClickUserDelete = () => {
			apiClient.post('/api/1/users/delUser', {}).then(res => {
				if (res.data.resultCode !== 0) {
					router.replace('/login');
				} else {
					store.commit(SET_AUTH_TOKEN, '');
					store.commit(SET_FOOTER_TYPE, UserType.USER);
					removeGroupManager();
					doLogout(store);
					alert('회원탈퇴가 완료되었습니다.');
					router.replace('/login');
				}
			});
		};

		const handleClickUserInfo = () => {
			router.push({ path: '/private' });
		};

		const getLoginUserInfo = (): void => {
			const userData = loadLocalData(KEY_LIST.CONST.LOGIN_USER);
			if (userData) {
				userInfo.value = JSON.parse(userData);
			}
		};

		const getUserInfo = () => {
			if (userInfo.value) {
				apiClient.post('/api/1/users/me', { userIdx: userInfo.value.userIdx }).then(res => {
					if (res.data.resultCode !== 0) {
						window.alert(res.data.resultMsg);
					} else {
						username.value = res.data.data.userName;
						userId.value = res.data.data.userId;
						userProfile.value = parsedImgSrc(res.data.data.userProfile);
						if (userInfo.value)
							saveLocalData(KEY_LIST.CONST.LOGIN_USER, JSON.stringify(Object.assign(res.data.data, { token: userInfo.value.token })));

						const userData = getUserData();
						if (userData) {
							username.value = userData.userName;
							userId.value = userData.userId;
							isManager.value = userData.userType === UserType.MANAGER;
							if (userData.userProfile) userProfile.value = parsedImgSrc(userData.userProfile);
							if (userData.userType === UserType.USER) {
								settingListPrototype.value = [
									{ type: SETTING_TYPE.GROUP, name: '돌봄 그룹 설정', hasArrow: true },
									{ type: SETTING_TYPE.LOGOUT, name: '로그아웃', hasArrow: false },
								];
							} else if (userData.userType === UserType.USER_DEVICE) {
								settingListPrototype.value = [
									{ type: SETTING_TYPE.GROUP, name: '돌봄 그룹 설정', hasArrow: true },
									{ type: SETTING_TYPE.TARGET, name: '목표 설정', hasArrow: true },
									{ type: SETTING_TYPE.ALARM, name: '경고 알림 설정', hasArrow: true },
									{ type: SETTING_TYPE.APPALARM, name: '앱 알림 설정', hasArrow: true },
									{ type: SETTING_TYPE.BRIEF, name: '모닝 브리핑 설정', hasArrow: true },
									{ type: SETTING_TYPE.AIHELP, name: 'AI 어시스턴트 설정', hasArrow: true },
									{ type: SETTING_TYPE.LOGOUT, name: '로그아웃', hasArrow: false },
								];
							}
						}
					}
				});
			}
		};

		onBeforeMount(() => {
			getLoginUserInfo();
			getUserInfo();
		});

		return {
			store,
			route,
			router,
			headerTitle,
			isManager,
			username,
			userId,
			settingListPrototype,
			PROFILE_TYPE,
			SETTING_TYPE,
			userProfile,
			handleClickUserInfo,
			handleClickSetting,
		};
	},
});
</script>

<template>
	<layout-header :title="headerTitle" :is-disabled-back="true" />
	<div class="setting-menu-wrapper scroll-body w-full inline-flex flex-col">
		<div class="user-wrapper w-full h-[100px] mx-auto mt-[30px]">
			<kp-link
				class="user-area mx-[20px] h-[100px] px-[20px] flex flex-nowrap justify-between items-center rounded-[10px]"
				:class="{ '!mx-[60px]': isManager }"
				link="#"
				:on-click="handleClickUserInfo">
				<div class="h-full flex items-center mr-[20px] w-[60px]">
					<div v-if="!userProfile" class="w-[60px] h-[60px] rounded-[50%] profile-background">
						<kp-image class="w-[25px] h-[30px]" src="images/common/base-profile.svg"></kp-image>
					</div>
					<kp-image v-else class="w-[60px] h-[60px] object-cover rounded-[50%]" :src="userProfile"></kp-image>
				</div>
				<div class="flex flex-col w-[calc(100%_-_100px)]">
					<span class="user-name mb-[5px] truncate">{{ username }}</span>
					<span class="user-id">{{ userId }}</span>
				</div>
				<div class="flex items-center justify-end w-[20px]">
					<kpImage class="rotate-180 w-[10px] h-[15px]" :src="`images/common/icon-back.svg`" />
				</div>
			</kp-link>
		</div>
		<div class="setting-wrapper flex flex-col items-center w-full" v-if="userId">
			<kp-link
				link="#"
				:on-click="() => handleClickSetting(setting.type)"
				v-for="(setting, index) of settingListPrototype"
				:key="index"
				class="setting-link-area w-full h-[60px] mt-[15px] mx-[20px] px-[20px]"
				:class="{ 'px-[60px]': isManager }">
				<div class="setting-area w-full h-full flex justify-between items-center rounded-[10px] px-[20px]">
					<kp-image class="w-[25px] h-[25px] mr-[10px]" :src="`images/icon/ico-setting-${setting.type}.svg`"></kp-image>
					<span class="flex-1">{{ setting.name }}</span>
					<kpImage v-if="setting.hasArrow" class="rotate-180 w-[10px] h-[15px]" :src="`images/common/icon-back.svg`" />
				</div>
			</kp-link>
		</div>
		<!-- <kp-button
			v-if="isManager"
			class="w-full h-[50px] mt-[40px] mx-[60px] rounded-[25px] w-[calc(100%_-_120px)] kp-btn primary text-center"
			@click="handleClickSetting(SETTING_TYPE.LOGOUT)"
			>로그아웃</kp-button
		> -->
	</div>
</template>

<style scoped></style>
