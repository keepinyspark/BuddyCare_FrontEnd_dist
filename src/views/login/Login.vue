<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import KpInput from '@components/common/KpInput.vue';
import KpButton from '@components/common/KpButton.vue';
import KpImage from '@components/common/KpImage.vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { AndroidEventType, UserLoginInputInterface, UserType } from '@src/types/types';
import { getApiClient } from '@utils/api-client';
import { KEY_LIST } from '../../constants-keys';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import AppConfig from '../../constants';
import { doLogout, getUserData, loadLocalData, removeLocalData, saveLocalData } from '@utils/common-utils';
import { words } from 'lodash';
import { SET_AUTH_TOKEN, SET_FOOTER_TYPE, SET_LOADING } from '@src/store/actions';
import { removeCookie, setCookie } from 'typescript-cookie';
import { createGroupManager, removeGroupManager } from '@utils/group/group-instance';

export enum userFindType {
	USER = 'user',
	PASSWORD = 'password',
}

export default defineComponent({
	name: 'Login',
	components: { LayoutHeader, KpInput, KpButton, KpImage },
	setup: function () {
		const store = useStore();
		const route = useRoute();
		const router = useRouter();
		const apiClient = computed(() => getApiClient(AppConfig.API_URL, store));
		const userForm = ref<UserLoginInputInterface>({ userId: '', pwd: '', maintain: false });
		const androidToken = ref('');

		const onClickLoginBtn = () => {
			apiClient.value
				.post('/api/1/users/login', {
					userId: userForm.value.userId.trim(),
					pwd: userForm.value.pwd,
					maintain: userForm.value.maintain,
					appToken: androidToken.value,
				})
				.then(res => {
					if (res.data.resultCode !== 0) {
						window.alert('회원 정보를 확인해주세요.');
					} else {
						saveLocalData(KEY_LIST.CONST.LOGIN_USER, JSON.stringify(res.data.data));
						saveLocalData(KEY_LIST.CONST.LOGIN_TOKEN, res.data.data.token);
						setCookie(KEY_LIST.CONST.LOGIN_TOKEN, res.data.data.token);
						window.appInterface.setUserName(res.data.data.userName);
						store.commit(SET_AUTH_TOKEN, res.data.data.token);

						if (userForm.value.maintain) saveLocalData(KEY_LIST.CONST.LOGIN_KEEP, 'KEEP');

						if (res.data.data.userType) {
							if ([UserType.USER, UserType.USER_DEVICE, UserType.MANAGER].indexOf(res.data.data.userType) > -1) {
								store.commit(SET_FOOTER_TYPE, res.data.data.userType);
								if (res.data.data.userType === UserType.USER_DEVICE) {
									if (res.data.data.deviceIdx) {
										// router.replace({ path: '/' });
										window.location.href = '/';
									} else {
										// router.replace({ path: '/device-connect' });
										window.location.href = '/#/device-connect';
									}
								} else {
									// router.replace({ path: '/' });
									window.location.href = '/';
								}
							} else {
								window.alert('회원 정보를 확인해주세요.');
							}
						} else {
							// router.replace({ path: '/user-type' });
							window.location.href = '/#/user-type';
						}
					}
				});
		};

		const onClickJoinBtn = () => {
			router.push({ path: '/login/terms' });
		};

		const onClickFindId = () => {
			router.push({ path: '/id-find' });
		};

		const onClickFindPassword = () => {
			router.push({ path: '/password-find' });
		};

		// const onClickFindBtn = (v: string) => {
		// 	store.commit(SET_FIND_USER_INFO_TYPE, v);
		// 	router.push({ path: '/find' });
		// };

		const getToken = (e: Event) => {
			androidToken.value = (e as CustomEvent).detail;
		};

		onMounted(() => {
			if (window.history.length > 1) {
				store.commit(SET_AUTH_TOKEN, '');
				store.commit(SET_FOOTER_TYPE, UserType.USER);
				removeGroupManager();
				doLogout(store);
			}
			window.appInterface.addEventListener(AndroidEventType.GET_TOKEN, getToken);
			if (loadLocalData(KEY_LIST.CONST.LOGIN_USER)) {
				router.push({ path: '/' });
			}
			window.appInterface.getAppToken();
			store.commit(SET_LOADING, false);
		});

		onUnmounted(() => {
			window.appInterface.removeEventListener(AndroidEventType.GET_TOKEN, getToken);
		});

		return {
			store,
			route,
			router,
			userForm,
			userFindType,
			onClickLoginBtn,
			onClickJoinBtn,
			onClickFindId,
			onClickFindPassword,
		};
	},
});
</script>

<template>
	<layout-header title="로그인" :is-disabled-back="true" />
	<section class="login flex flex-col items-center px-[20px] pt-[40px]">
		<article class="login-info flex-1 w-full text-center">
			<!--			<div class="pb-[77px]">이미지 로고</div>-->
			<div class="px-2.5 pb-[5px] main-title">환영합니다! :)</div>
			<div class="px-2.5 pb-[30px] sub-title">로그인 정보를 입력해주세요.</div>
			<div class="login-form bg-white mb-[30px] p-[20px] rounded-[10px]">
				<form>
					<div class="relative login-input">
						<kp-input
							class="kp-input w-full pl-[60px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
							:placeholder="'아이디'"
							:model-value="userForm.userId"
							@update:modelValue="userForm.userId = $event"
							@keyup.enter="onClickLoginBtn" />
						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/id-icon.svg`" />
					</div>
					<div class="relative login-input">
						<kp-input
							type="password"
							class="kp-input w-full pl-[60px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
							:placeholder="'비밀번호'"
							:model-value="userForm.pwd"
							@update:modelValue="userForm.pwd = $event"
							@keyup.enter="onClickLoginBtn" />
						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/lock-icon.svg`" />
					</div>
					<div class="flex flex-row h-[25px] pl-[10px] items-center text-left mb-[20px]">
						<input type="checkbox" id="maintain" class="mr-[10px]" :class="{ isActive: userForm.maintain }" v-model="userForm.maintain" />
						<label class="text-[16px] text-[#4E4B66] leading-[19px] font-normal mr-auto" for="maintain">자동로그인</label>
					</div>
					<kp-button
						class="w-full login-btn bottom-0 pt-[16px] pb-[15px] rounded-[25px]"
						:class="userForm.userId !== '' && userForm.pwd !== '' ? 'bg-[#466FFF]' : 'bg-[#AAB1BB]'"
						:is-disabled="!(userForm.userId !== '' && userForm.pwd !== '')"
						@click="onClickLoginBtn"
						>로그인</kp-button
					>
				</form>
			</div>
			<div class="sub-form flex flex-row justify-center text-center">
				<div class="sub-content flex flex-row items-center">
					<p class="cursor-pointer" @click="onClickJoinBtn">회원가입</p>
					<p class="mx-[15px] w-px h-2.5 bg-[#999999]"></p>
					<p class="cursor-pointer" @click="onClickFindId">아이디찾기</p>
					<p class="mx-[15px] w-px h-2.5 bg-[#999999]"></p>
					<p class="cursor-pointer" @click="onClickFindPassword">비밀번호찾기</p>
				</div>
			</div>
		</article>
		<!--		<div>-->
		<!--			<p>아직 회원이 아니시라면? <span class="font-bold cursor-pointer" @click="onClickJoinBtn">로그인 하기</span></p>-->
		<!--		</div>-->
	</section>
</template>

<style scoped></style>
