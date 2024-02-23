<script lang="ts">
import { defineComponent, onBeforeMount, onMounted, ref } from 'vue';
import KpButton from '@components/common/KpButton.vue';
import KpImage from '@components/common/KpImage.vue';
import { useRoute, useRouter } from 'vue-router/dist/vue-router';
import { useStore } from 'vuex';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';

export default defineComponent({
	name: 'Success',
	components: { LayoutHeader, KpButton, KpImage },
	setup() {
		const store = useStore();
		const route = useRoute();
		const router = useRouter();
		const userId = ref<string>('');
		const headerTitle = ref<string>('');

		const onClickConfirm = () => {
			router.push({ path: '/login' });
		};

		onBeforeMount(() => {
			userId.value = store.state.findUserId;
			switch (route.params.type) {
				case 'join':
					headerTitle.value = '가입 완료';
					break;
				case 'user':
					headerTitle.value = '아이디 찾기';
					break;
				case 'password':
					headerTitle.value = '비밀번호 찾기 완료';
					break;
				default:
					headerTitle.value = '';
					break;
			}
		});

		return {
			store,
			route,
			router,
			userId,
			headerTitle,
			onClickConfirm,
		};
	},
});
</script>

<template>
	<layout-header :title="headerTitle" />
	<section class="success flex flex-col items-center px-[20px]">
		<article class="success-info flex flex-col w-full items-center text-center flex-1">
			<div class="success-form mt-[150px] mb-[208px]" v-if="route.params.type === 'join'">
				<kp-image class="mx-auto mb-[20px]" :src="`images/icon/ico-badge.png`" />
				<div class="join-main-title pb-[10px]">가입 완료!</div>
				<div class="join-sub-title">회원가입이 완료되었습니다.<br />확인을 누르시면 로그인 화면으로 이동합니다.</div>
			</div>
			<div class="success-form mt-[152px] mb-[212px]" v-if="route.params.type === 'user'">
				<kp-image class="mx-auto mb-[23px]" :src="`images/icon/ico-address.png`" />
				<div class="login-main-title pb-[10px] mb-[20px]">
					회원님의 아이디는<br /><span>{{ userId }}</span> 입니다.
				</div>
			</div>
			<div class="success-form mt-[150px] mb-[186px]" v-else-if="route.params.type === 'password'">
				<kp-image class="mx-auto mb-[20px]" :src="`images/icon/ico-user-lock.png`" />
				<div class="main-title pb-[10px] mb-[20px]">새로운 비밀번호가<br />등록되었습니다.</div>
				<div class="sub-title">확인을 누르시면 로그인 화면으로 이동합니다.</div>
			</div>
			<!--			<kp-button class="w-[calc(100%_-_24px)] confirm-btn border-0 outline-0 pt-[16px] py-[15px] rounded-[25px]" @click="onClickConfirm"-->
			<div v-if="route.params.type === 'user'" class="user-sub-title mb-[15px]">확인을 누르시면 로그인 화면으로 이동합니다.</div>
			<kp-button class="w-full confirm-btn border-0 outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[60px]" @click="onClickConfirm">확인</kp-button>
		</article>
	</section>
</template>

<style scoped></style>
