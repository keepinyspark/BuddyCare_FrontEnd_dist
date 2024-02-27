<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router/dist/vue-router';
import { useStore } from 'vuex';
import KpInput from '@components/common/KpInput.vue';
import KpButton from '@components/common/KpButton.vue';
import KpImage from '@components/common/KpImage.vue';
import validator from 'validator';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import { getApiClient } from '../../utils/api-client';
import AppConfig from '../../constants';
import { SET_USER_IDX } from '@src/store/actions';

export default defineComponent({
	name: 'FindUserPassword',
	components: { LayoutHeader, KpInput, KpButton, KpImage },
	setup() {
		const store = useStore();
		const route = useRoute();
		const apiClient = getApiClient(AppConfig.API_URL, store);
		const router = useRouter();
		const userName = ref<string>('');
		const userId = ref<string>('');
		const email = ref<string>('');
		const phone = ref<string>('');
		const phoneMaxLength = ref<number>(13);
		const newPwd = ref<string>('');
		const newPwdCheck = ref<string>('');

		const isPwdValidCheck = ref<boolean | null>(null);
		const isPwdEqualsCheck = ref<boolean | null>(null);
		const isEmailValidCheck = ref<boolean | null>(null);
		const isPhoneValidCheck = ref<boolean | null>(null);

		const pwdNotFindState = ref<boolean>(false);
		const resetPwdVisible = ref<boolean>(false);

		const phoneValidCheck = () => {
			const phoneNumber = phone.value.replace(/-/g, '');
			// const rule = /^(01[0235]{1})[0-9]{3,4}[0-9]{4}$/;
			// isPhoneValidCheck.value = rule.test(phoneNumber);
			isPhoneValidCheck.value = validator.isMobilePhone(phoneNumber, 'ko-KR');
		};

		const phoneNumberCheck = (v: string) => {
			let value = '';
			if (v.substring(0, 2) === '02') {
				phoneMaxLength.value = 12;
				value = v
					.replace(/[^0-9]/g, '')
					.replace(/^(\d{2})(\d{3,4})(\d{4})$/g, '$1-$2-$3')
					.replace(/(-{1,2})$/g, '');
			} else if (v.substring(0, 3) === '010') {
				phoneMaxLength.value = 13;
				value = v
					.replace(/[^0-9]/g, '')
					.replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, '$1-$2-$3')
					.replace(/(-{1,2})$/g, '');
			} else {
				phoneMaxLength.value = 12;
				value = v
					.replace(/[^0-9]/g, '')
					.replace(/^(\d{0,3})(\d{0,3})(\d{0,4})$/g, '$1-$2-$3')
					.replace(/(-{1,2})$/g, '');
			}
			return value;
		};

		const emailCheck = () => {
			if (email.value === '') isEmailValidCheck.value = null;
			else isEmailValidCheck.value = !!validator.isEmail(email.value.trim());
		};

		const clickNextBtn = () => {
			apiClient
				.post('/api/1/users/findPassword', {
					userName: userName.value.trim(),
					userId: userId.value.trim(),
					email: email.value.trim(),
					tel: phone.value,
				})
				.then(res => {
					if (res.data.resultCode !== 0) {
						pwdNotFindState.value = true;
						// openModal();
					} else {
						// headerTitle.value = '비밀번호 재설정';
						store.commit(SET_USER_IDX, res.data.data[0].userIdx);
						resetPwdVisible.value = true;
					}
				});
		};

		const typingPassword = () => {
			const regExp = new RegExp('^(?=.*[A-Za-z])(?=.*\\d)(?=.*[$@$!%*#?&])[A-Za-z\\d$@$!%*#?&]{8,}$');
			isPwdValidCheck.value = regExp.test(newPwd.value.trim());
			isPwdEqualsCheck.value = null;
			newPwdCheck.value = '';
		};

		const pwdEqualsCheck = () => {
			if (newPwd.value === '') isPwdEqualsCheck.value = null;
			else isPwdEqualsCheck.value = isPwdValidCheck.value && validator.equals(newPwd.value.trim(), newPwdCheck.value.trim());
		};

		const validateCheck = () => {
			const regExp = new RegExp('^(?=.*[A-Za-z])(?=.*\\d)(?=.*[$@$!%*#?&])[A-Za-z\\d$@$!%*#?&]{8,}$');
			isPwdValidCheck.value = regExp.test(newPwd.value.trim());

			if (newPwd.value === '') isPwdEqualsCheck.value = null;
			else isPwdEqualsCheck.value = isPwdValidCheck.value && validator.equals(newPwd.value.trim(), newPwdCheck.value.trim());

			if (isPwdValidCheck.value && isPwdEqualsCheck.value) clickResetPwdBtn();
		};

		const clickResetPwdBtn = () => {
			apiClient.post('/api/1/users/changePassword', { userIdx: store.state.userIdx, pwd: newPwd.value.trim() }).then(res => {
				if (res.data.resultCode !== 0) {
					// openModal();
				} else {
					store.commit(SET_USER_IDX, '');
					window.alert('비밀번호가 재설정 되었습니다.');
					router.replace({ path: '/login' });
				}
			});
		};

		return {
			store,
			route,
			router,
			userName,
			userId,
			email,
			phone,
			newPwd,
			newPwdCheck,
			phoneMaxLength,
			isPwdValidCheck,
			isPwdEqualsCheck,
			isEmailValidCheck,
			isPhoneValidCheck,
			pwdNotFindState,
			resetPwdVisible,
			// headerTitle,
			emailCheck,
			phoneValidCheck,
			phoneNumberCheck,
			clickNextBtn,
			clickResetPwdBtn,
			typingPassword,
			pwdEqualsCheck,
			validateCheck,
		};
	},
});
</script>

<template>
	<layout-header title="비밀번호 찾기" />
	<section class="find flex flex-col items-center px-[20px] pt-[30px] h-[calc(100%_-_56px)]">
		<article v-if="!resetPwdVisible" class="relative find-info justify-evenly flex flex-col flex-1 w-full text-center">
			<div class="w-full bg-white absolute top-0 rounded-[10px]" :class="pwdNotFindState ? 'h-[314px]' : 'h-[285px]'"></div>
			<div class="user-input-form flex-1 rounded-[10px] p-[20px]">
				<div class="content-wrapper flex flex-col">
					<div class="relative input-form">
						<kp-input
							class="kp-input w-full bg-[#F4F5F7] text-[16px] text-[#4E4B66] font-normal border-0 pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
							:placeholder="'이름 입력'"
							:model-value="userName"
							@update:modelValue="userName = $event" />
						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/user-icon.svg`" />
					</div>
					<div class="relative input-form">
						<kp-input
							class="kp-input w-full pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
							:placeholder="'아이디 입력'"
							:model-value="userId"
							@update:modelValue="userId = $event" />

						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/id-icon.svg`" />
					</div>
					<div class="relative input-form">
						<kp-input
							class="kp-input w-full pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
							:placeholder="'전화번호'"
							:model-value="phone"
							@update:modelValue="phone = $event"
							:length="phoneMaxLength"
							:handle-key-up="phoneNumberCheck"
							@input="phoneValidCheck"
							@change="phoneValidCheck"
							@blur="phoneValidCheck" />
						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/phone-icon.svg`" />
					</div>
					<div class="relative input-form">
						<kp-input
							class="kp-input w-full pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
							:placeholder="'이메일 입력'"
							:model-value="email"
							@update:modelValue="email = $event"
							@input="emailCheck"
							@change="emailCheck"
							@blur="emailCheck" />
						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/mail-icon.svg`" />
					</div>
					<div v-if="pwdNotFindState" class="pl-[20px] not-matching z-10">일치하는 사용자 정보를 확인할 수 없습니다.</div>
				</div>
			</div>
			<div>
				<kp-button
					class="w-full btn-wrapper border-0 outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[60px]"
					:is-disabled="userName === '' || userId === '' || !isEmailValidCheck || !isPhoneValidCheck"
					@click="clickNextBtn"
					>완료</kp-button
				>
			</div>
		</article>
		<article v-else class="reset-info w-full mt-[10px] justify-evenly flex flex-col flex-1">
			<div class="h-full">
				<div class="main-title pl-[10px] mb-[5px]">비밀번호 재설정</div>
				<div class="sub-title pl-[10px] mb-[30px]">사용하실 비밀번호를 다시 설정해주세요.</div>
				<form class="pwd-reset-form flex flex-col p-[20px] justify-evenly flex flex-col bg-white rounded-[10px]">
					<div class="relative input-form">
						<kp-input
							type="password"
							class="kp-input w-full pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[10px]"
							:placeholder="'비밀번호 입력'"
							:model-value="newPwd"
							@update:modelValue="newPwd = $event" />
						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/lock-icon.svg`" />
						<p v-if="isPwdValidCheck !== null && !isPwdValidCheck" class="not-matching pl-[20px] mb-[15px] text-[14px]">
							소문자, 숫자, 기호를 조합한 8자리 이상의 비밀번호를 사용해주세요.
						</p>
						<p v-else class="guide-info pl-[20px] mb-[15px] text-[14px] text-[#646464]">
							소문자, 숫자, 기호를 조합한 8자리 이상의 비밀번호를 사용해주세요.
						</p>
					</div>
					<div class="relative input-form">
						<kp-input
							type="password"
							class="kp-input w-full pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
							:placeholder="'비밀번호 재입력'"
							:model-value="newPwdCheck"
							@update:modelValue="newPwdCheck = $event"
							@input="isPwdEqualsCheck = null" />
						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/lock-icon.svg`" />
						<p v-if="isPwdEqualsCheck !== null && !isPwdEqualsCheck" class="mt-[10px] pl-[20px] not-matching">비밀번호가 일치하지 않습니다.</p>
					</div>
				</form>
			</div>
			<div>
				<kp-button
					class="w-full confirm-btn border-0 outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[60px]"
					:is-disabled="!(newPwd.length > 0 && newPwdCheck.length > 0)"
					@click="validateCheck"
					>완료</kp-button
				>
			</div>
		</article>
	</section>
</template>

<style scoped></style>
