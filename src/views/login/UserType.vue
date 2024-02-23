<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import KpImage from '@components/common/KpImage.vue';
import KpButton from '@components/common/KpButton.vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { getApiClient } from '@utils/api-client';
import AppConfig from '../../constants';
import { SET_AUTH_TOKEN, SET_FOOTER_TYPE } from '@src/store/actions';
import { doLogout, getUserData, removeLocalData, saveLocalData } from '@utils/common-utils';
import { KEY_LIST } from '../../constants-keys';
import { removeCookie } from 'typescript-cookie';
import router from '@src/router';
import { UserType } from '@src/types/types';
import { removeGroupManager } from '@utils/group/group-instance';

export default defineComponent({
	name: 'UserType.vue',
	components: { LayoutHeader, KpImage, KpButton },
	setup() {
		const store = useStore();
		const route = useRoute();
		const router = useRouter();
		const apiClient = getApiClient(AppConfig.API_URL, store);
		const userType = ref<string>('');
		const session = ref<string>('DEFAULT');

		const clickType = (type: string): void => {
			if (type) userType.value = type;
		};

		const updateUserType = (): void => {
			apiClient.post('/api/1/users/updateUser', { userType: userType.value }).then(res => {
				if (res.data.resultCode !== 0) {
					window.alert('세션이 만료되었습니다.');
					router.replace('/login');
				} else {
					session.value = 'ACCESS';
					store.commit(SET_FOOTER_TYPE, userType.value);
					saveLocalData(KEY_LIST.CONST.LOGIN_USER, JSON.stringify(Object.assign({}, getUserData(), { userType: userType.value })));
					if (userType.value === 'USER_DEVICE') router.replace({ path: '/device-connect' });
					else if (userType.value === 'USER') router.replace({ path: '/' });
				}
			});
		};

		const goToLogin = () => {
			store.commit(SET_AUTH_TOKEN, '');
			store.commit(SET_FOOTER_TYPE, UserType.USER);
			removeGroupManager();
			doLogout(store);
			router.replace('/login');
		};

		onMounted(() => {});

		onUnmounted(() => {
			if (session.value === 'DEFAULT') {
				store.commit(SET_AUTH_TOKEN, '');
				doLogout(store);
			}
		});

		return {
			store,
			userType,
			clickType,
			updateUserType,
			goToLogin,
		};
	},
});
</script>

<template>
	<layout-header title="사용자 유형" :direct-redirection="goToLogin" />
	<section class="user-type flex flex-col h-[calc(100%_-_56px)] px-[20px] pt-[40px] pb-[60px] h-screen">
		<article class="user-type-wrapper justify-evenly flex flex-col flex-1 h-full">
			<div class="h-full">
				<div class="type-main-header pl-[10px]">버디케어 이용 유형 선택</div>
				<div class="type-sub-header pl-[10px] mb-[40px]">해당하는 유형을 선택해주세요.</div>
				<button
					class="type-form-wrapper cursor-pointer flex relative items-center pl-[40px] pr-[30px] mb-[20px] w-full h-[120px] rounded-[25px] shadow-[0_3px_4px_1px_rgba(123,159,252,0.1)]"
					:class="userType === 'USER_DEVICE' ? 'bg-[#466FFF]' : 'bg-[#FFFFFF]'"
					@click="clickType('USER_DEVICE')">
					<kp-image class="mr-[35px]" :src="userType === 'USER_DEVICE' ? `images/icon/ico-user-check.png` : `images/icon/ico-user.png`" />
					<div class="contents-wrapper flex flex-col items-start">
						<div class="contents-header mb-[10px]" :class="userType === 'USER_DEVICE' ? 'text-[#FFFFFF]' : 'text-[#4E4B66]'">사용자</div>
						<div class="contents-sub text-start" :class="userType === 'USER_DEVICE' ? 'text-[#FFFFFF]' : 'text-[#4E4B66]'">
							기기 사용자로서 기기 등록 후 버디케어 이용이 가능합니다.
						</div>
					</div>
				</button>
				<button
					class="type-form-wrapper cursor-pointer flex relative items-center px-[30px] mb-[112px] w-full h-[120px] rounded-[25px] shadow-[0_3px_4px_1px_rgba(123,159,252,0.1)]"
					:class="userType === 'USER' ? 'bg-[#466FFF]' : 'bg-[#FFFFFF]'"
					@click="clickType('USER')">
					<kp-image class="mr-[30px]" :src="userType === 'USER' ? `images/icon/ico-protector-check.png` : `images/icon/ico-protector.png`" />
					<div class="contents-wrapper flex flex-col items-start">
						<div class="contents-header mb-[10px]" :class="userType === 'USER' ? 'text-[#FFFFFF]' : 'text-[#4E4B66]'">보호자</div>
						<div class="contents-sub text-start" :class="userType === 'USER' ? 'text-[#FFFFFF]' : 'text-[#4E4B66]'">
							사용자의 돌봄 그룹 연결 후 버디케어 이용이 가능합니다.
						</div>
					</div>
				</button>
			</div>
			<kp-button
				class="w-full confirm-btn bottom-0 pt-[16px] pb-[15px] rounded-[25px]"
				:class="{ 'is-disabled': userType === '' }"
				@click="updateUserType()">
				확인
			</kp-button>
		</article>
	</section>
</template>

<style scoped></style>
