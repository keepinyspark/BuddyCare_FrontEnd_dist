<script lang="ts">
import { defineComponent, onBeforeMount, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { getApiClient } from '@utils/api-client';
import KpInput from '@components/common/KpInput.vue';
import KpButton from '@components/common/KpButton.vue';
import KpImage from '@components/common/KpImage.vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import AppConfig from '../../constants';
import { SET_FIND_USER_ID } from '@src/store/actions';
import validator from 'validator';

export default defineComponent({
	name: 'ResetPassword',
	components: { LayoutHeader, KpInput, KpImage, KpButton },
	setup() {
		const store = useStore();
		const route = useRoute();
		const router = useRouter();
		const apiClient = getApiClient(AppConfig.API_URL, store);
		const pwd = ref<string>('');
		const newPwd = ref<string>('');
		const newPwdCheck = ref<string>('');

		const isUserPwdCheck = ref<boolean | null>(null);
		const isPwdValidCheck = ref<boolean | null>(null);
		const isPwdEqualsCheck = ref<boolean | null>(null);

		const updatePwd = (): void => {
			apiClient.post('/api/1/users/resetPassword', { pwd: pwd.value, newPwd: newPwd.value }).then(res => {
				if (res.data.resultCode !== 0) {
					isUserPwdCheck.value = false;
				} else {
					window.alert('비밀번호 재설정이 완료되었습니다.');
					router.replace({ path: '/private' });
				}
			});
		};

		const passwordCheck = (): void => {
			const regExp = new RegExp('^(?=.*[A-Za-z])(?=.*\\d)(?=.*[$@$!%*#?&])[A-Za-z\\d$@$!%*#?&]{8,}$');
			isPwdValidCheck.value = regExp.test(newPwd.value);
			isPwdEqualsCheck.value = validator.equals(newPwd.value, newPwdCheck.value);
			if (pwd.value.length > 0 && isPwdValidCheck.value && isPwdEqualsCheck.value) updatePwd();
		};

		const doPrivate = (): void => {
			router.push({ path: '/private' });
		};

		return {
			updatePwd,
			doPrivate,
			passwordCheck,
			pwd,
			newPwd,
			newPwdCheck,
			isUserPwdCheck,
			isPwdValidCheck,
			isPwdEqualsCheck,
		};
	},
});
</script>

<template>
	<layout-header title="비밀번호 재설정" />
	<section class="reset-password flex flex-col">
		<article class="reset-password-wrapper justify-evenly flex flex-col flex-1 h-full px-[20px] pt-[40px]">
			<div class="h-full">
				<div class="pl-[10px]">
					<div class="reset-main-header mb-[5px]">비밀번호 재설정</div>
					<div class="reset-sub-header mb-[30px]">사용하실 비밀번호를 다시 설정해주세요.</div>
				</div>
				<div class="w-full pwd-form px-[20px] py-[20px] bg-white rounded-[10px]">
					<div class="relative password-input">
						<kpInput
							type="password"
							class="w-full border-0 pl-[50px] pr-[20px] outline-0 pt-[14px] pb-[15px] rounded-[25px]"
							:class="isUserPwdCheck !== null && !isUserPwdCheck ? 'mb-[10px]' : 'mb-[20px]'"
							:placeholder="'기존 비밀번호 입력'"
							:model-value="pwd"
							@update:modelValue="pwd = $event"
							@input="isUserPwdCheck = null" />
						<kpImage class="absolute left-5 top-[14px]" :src="`images/common/lock-icon.svg`" />
						<p v-if="isUserPwdCheck !== null && !isUserPwdCheck" class="note-info not-matching-text pl-[20px] pr-[20px] mb-[10px]">
							기존 비밀번호가 일치하지 않습니다
						</p>
					</div>
					<div class="relative password-input">
						<kpInput
							type="password"
							class="w-full border-0 pl-[50px] pr-[20px] outline-0 pt-[14px] pb-[15px] rounded-[25px] mb-[10px]"
							:placeholder="'비밀번호 입력'"
							:model-value="newPwd"
							@update:modelValue="newPwd = $event"
							@input="isPwdValidCheck = null" />
						<kpImage class="absolute left-5 top-[14px]" :src="`images/common/lock-icon.svg`" />
						<p v-if="isPwdValidCheck === null || isPwdValidCheck" class="note-info pl-[20px] pr-[20px] mb-[15px]">
							소문자, 숫자, 기호를 조합한 8자리 이상의 비밀번호를 사용해주세요.
						</p>
						<p v-else-if="isPwdValidCheck !== null && !isPwdValidCheck" class="note-info not-matching-text pl-[20px] pr-[20px] mb-[15px]">
							소문자, 숫자, 기호를 조합한 8자리 이상의 비밀번호를 사용해주세요.
						</p>
					</div>
					<div class="relative password-input">
						<kpInput
							type="password"
							class="w-full border-0 pl-[50px] pr-[20px] outline-0 pt-[14px] pb-[15px] rounded-[25px]"
							:class="isPwdEqualsCheck === null ? '' : 'mb-[10px]'"
							:placeholder="'비밀번호 재입력'"
							:model-value="newPwdCheck"
							@update:modelValue="newPwdCheck = $event"
							@input="isPwdEqualsCheck = null" />
						<kpImage class="absolute left-5 top-[14px]" :src="`images/common/lock-icon.svg`" />
						<p v-if="newPwd.length > 0 && newPwdCheck.length > 0 && isPwdEqualsCheck" class="pl-[20px] available-text">비밀번호가 일치합니다.</p>
						<p v-else-if="isPwdEqualsCheck !== null && !isPwdEqualsCheck" class="pl-[20px] not-matching-text">비밀번호가 일치하지 않습니다.</p>
					</div>
				</div>
			</div>
			<div class="flex flex-col">
				<kpButton class="save-btn w-full bottom-0 pt-[16px] pb-[15px] mb-[10px] text-white rounded-[25px]" @click="passwordCheck()"> 저장 </kpButton>
				<kpButton class="cancel-btn w-full bottom-0 pt-[16px] pb-[15px] rounded-[25px] mb-[60px]" @click="doPrivate()"> 취소 </kpButton>
			</div>
		</article>
	</section>
</template>

<style scoped></style>
