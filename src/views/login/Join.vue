<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import KpInput from '@components/common/KpInput.vue';
import KpButton from '@components/common/KpButton.vue';
import KpImage from '@components/common/KpImage.vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { UserInfoInterface } from '@src/types/types';
import validator from 'validator';
import { getApiClient } from '@src/utils/api-client';
import { SET_HEADER_TITLE } from '@src/store/actions';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import AppConfig from '../../constants';

export default defineComponent({
	name: 'Join',
	components: { LayoutHeader, KpInput, KpButton, KpImage },
	setup() {
		const router = useRouter();
		const store = useStore();
		const apiClient = getApiClient(AppConfig.API_URL, store);
		const userForm = ref<UserInfoInterface>({ userName: '', userId: '', pwd: '', validatePwd: '', phone: '', email: '' });
		const typingCheck = ref<boolean>(false);
		const isNameValidCheck = ref<boolean | null>(null);
		const isIdDuplicateCheck = ref<boolean | null>(null);
		const isIdValidCheck = ref<boolean | null>(null);
		const isPwdValidCheck = ref<boolean | null>(null);
		const isPwdEqualsCheck = ref<boolean | null>(null);
		const isEmailValidCheck = ref<boolean | null>(null);
		const isPhoneValidCheck = ref<boolean | null>(null);
		const isAuthStatus = ref<boolean>(false);
		const isAuthContent = ref<string>('인증하기');
		const mailSendContent = ref<string>('인증코드가 메일로 발송되었습니다.');
		const isCertValidCheck = ref<boolean | null>(null);
		const nameMaxLength = ref<number>(20);
		const phoneMaxLength = ref<number>(13);
		const certNum = ref<string>('');

		const typingId = (): void => {
			isIdValidCheck.value = null;
			isIdDuplicateCheck.value = null;
		};

		const typingEmail = (): void => {
			isEmailValidCheck.value = null;
			isAuthStatus.value = false;
			isAuthContent.value = '인증하기';
		};

		const emailCheck = (): void => {
			if (userForm.value.email === '') isEmailValidCheck.value = null;
			else isEmailValidCheck.value = !!validator.isEmail(userForm.value.email.trim());
		};

		const nameCheck = (): void => {
			isNameValidCheck.value = userForm.value.userName !== '';
		};

		const phoneNumberCheck = (v: string) => {
			let value = '';
			if (v.substring(0, 2) === '02') {
				phoneMaxLength.value = 12;
				value = v
					.replace(/[^0-9]/g, '')
					.replace(/^(\d{2})(\d{3,4})(\d{4})$/g, '$1-$2-$3')
					.replace(/(-{1,2})$/g, '');
			} else {
				phoneMaxLength.value = 13;
				value = v
					.replace(/[^0-9]/g, '')
					.replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, '$1-$2-$3')
					.replace(/(-{1,2})$/g, '');
			}
			return value;
		};

		const userNameCheck = (v: string) => {
			let value = '';
			if (v.length > nameMaxLength.value) value = v.slice(0, nameMaxLength.value);
			else value = v;
			return value;
		};

		const userIdCheck = (v: string) => {
			let value = '';
			const idReg = /[^a-zA-Z0-9_-]/gi;
			value = v.replace(idReg, '');
			return value;
		};

		const userPwdCheck = (v: string) => {
			let value = '';
			const pwdReg = /[^a-zA-Z0-9!@#$%^&*()_+{}\[\]:;\"\'<>,\.\?\|`~-]+$/gi;
			value = v.replace(pwdReg, '');
			return value;
		};

		const phoneValidCheck = (): void => {
			const phoneNumber = userForm.value.phone.replace(/-/g, '');
			isPhoneValidCheck.value = validator.isMobilePhone(phoneNumber, 'ko-KR');
		};

		const onDuplicateIdCheck = (): void => {
			apiClient.post('/api/1/users/getCheckId', { userId: userForm.value.userId }).then(res => {
				if (res.data.resultCode !== 0) {
					// window.alert(t('msg.' + res.data.resultMsg));
				} else {
					if (res.data.data.length > 0) {
						//중복 아이디 있는 경우
						// alert('이미 존재하는 아이디입니다.');
						isIdValidCheck.value = false;
					} else {
						//없는 경우
						isIdDuplicateCheck.value = true;
						isIdValidCheck.value = true;
					}
				}
			});
		};

		const sendAuthMail = (): void => {
			isEmailValidCheck.value = !!validator.isEmail(userForm.value.email.trim());
			if (isEmailValidCheck.value) {
				const randomNum = Math.floor(Math.random() * 899999) + 100000;
				apiClient
					.post('/api/1/users/insertAuthCode', {
						userName: userForm.value.userName.trim() || undefined,
						email: userForm.value.email.trim(),
						certCode: randomNum,
					})
					.then(res => {
						if (res.data.resultCode !== 0) {
							isAuthStatus.value = false;
						} else {
							if (isAuthContent.value === '다시인증') mailSendContent.value = '인증코드가 메일로 다시 발송되었습니다.';
							else mailSendContent.value = '인증코드가 메일로 발송되었습니다.';
							window.alert('인증코드가 메일로 발송되었습니다.');
							isAuthStatus.value = true;
							isCertValidCheck.value = null;
						}
					});
			}
		};

		const requestJoin = (): void => {
			apiClient
				.post('/api/1/users/join', {
					userId: userForm.value.userId,
					userName: userForm.value.userName,
					pwd: userForm.value.pwd.trim(),
					tel: userForm.value.phone,
					email: userForm.value.email.trim(),
					certCode: certNum.value,
					termsList: store.state.savedTermsList,
				})
				.then(res => {
					if (res.data.resultCode !== 0) {
						isCertValidCheck.value = false;
					} else {
						isCertValidCheck.value = true;
						store.commit(SET_HEADER_TITLE, '가입 완료');
						router.replace({ path: `/login/success/join` });
					}
				});
		};

		const userFormCheck = () => {
			// id check
			// onDuplicateIdCheck();

			// password check
			const regExp = new RegExp('^(?=.*[A-Za-z])(?=.*\\d)(?=.*[$@$!%*#?&])[A-Za-z\\d$@$!%*#?&]{8,}$');
			isPwdValidCheck.value = regExp.test(userForm.value.pwd.trim());

			// password equals check
			isPwdEqualsCheck.value = validator.equals(userForm.value.pwd.trim(), userForm.value.validatePwd.trim());

			// phone check
			isPhoneValidCheck.value = validator.isMobilePhone(userForm.value.phone.replace(/-/g, ''), 'ko-KR');

			// email check
			isEmailValidCheck.value = !!validator.isEmail(userForm.value.email.trim());

			if (isIdValidCheck.value === null) {
				isIdValidCheck.value = false;
				isIdDuplicateCheck.value = false;
			}

			if (isIdValidCheck.value && isPwdValidCheck.value && isPwdEqualsCheck.value && isPhoneValidCheck.value && isEmailValidCheck.value)
				requestJoin();
		};

		const doLogin = (): void => {
			router.replace({ path: `/login` });
		};

		const certInputClick = (): void => {
			setTimeout(() => {}, 2000);
		};
		const certInputBlur = (): void => {};

		watch(
			() => userForm.value.userId,
			() => {
				const regExp = /[a-zA-Z0-9]/gi;
				typingCheck.value = regExp.test(userForm.value.userId);
			},
		);

		onMounted(() => {});

		return {
			router,
			store,
			userForm,
			certNum,
			phoneMaxLength,
			nameMaxLength,
			isNameValidCheck,
			isIdValidCheck,
			isPwdValidCheck,
			isPwdEqualsCheck,
			isEmailValidCheck,
			isPhoneValidCheck,
			isIdDuplicateCheck,
			isAuthStatus,
			isAuthContent,
			isCertValidCheck,
			mailSendContent,
			typingCheck,
			doLogin,
			requestJoin,
			typingId,
			typingEmail,
			sendAuthMail,
			userNameCheck,
			nameCheck,
			emailCheck,
			userIdCheck,
			userPwdCheck,
			phoneNumberCheck,
			phoneValidCheck,
			onDuplicateIdCheck,
			userFormCheck,
			certInputClick,
			certInputBlur,
		};
	},
});
</script>

<template>
	<layout-header title="회원가입" />
	<section class="join flex flex-col min-h-screen px-[20px] pt-[30px] pb-[60px]">
		<article class="join-info bg-[#FFFFFF] p-[20px] mb-[40px] rounded-[10px]">
			<form>
				<!-- 자동완성 방지용  -->
				<input type="text" style="width: 0px; height: 0px; position: absolute" />
				<input type="password" style="width: 0px; height: 0px; position: absolute" />
				<!-- 자동완성 방지용  -->
				<div class="relative input-form">
					<kpInput
						class="kp-input w-full pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[10px]"
						:length="nameMaxLength"
						placeholder="이름 입력"
						:model-value="userForm.userName"
						:handle-key-up="userNameCheck"
						@update:modelValue="userForm.userName = $event"
						@input="isNameValidCheck = false"
						@change="nameCheck"
						@blur="nameCheck" />
					<kpImage class="absolute left-5 top-[15px]" :src="`images/common/user-icon.svg`" />
					<p class="pl-[20px] mb-[15px] standard-text">최대 20글자 이름을 설정해주세요.</p>
				</div>
				<div class="relative input-form">
					<kpInput
						class="kp-input w-[calc(100%_-_95px)] pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mr-[10px]"
						:class="!isIdValidCheck && isIdValidCheck !== null ? 'mb-[10px]' : 'mb-[15px]'"
						placeholder="ID"
						:model-value="userForm.userId"
						:handle-key-up="userIdCheck"
						@update:modelValue="userForm.userId = $event"
						@input="typingId" />
					<kp-button
						class="min-w-[85px] w-[85px] small-btn pl-[14px] pr-[15px] pt-[16px] py-[15px] rounded-[25px]"
						@click="onDuplicateIdCheck"
						:is-disabled="!typingCheck"
						>중복확인</kp-button
					>
					<kpImage class="absolute left-5 top-[15px]" :src="`images/common/id-icon.svg`" />
					<p v-if="isIdDuplicateCheck !== null && !isIdDuplicateCheck" class="pl-[20px] mb-[15px] not-matching-text">아이디 중복체크를 해주세요.</p>
					<p v-else-if="isIdValidCheck !== null && isIdValidCheck" class="pl-[20px] mb-[15px] available-text">사용 가능한 아이디입니다.</p>
					<p v-else-if="isIdValidCheck !== null && !isIdValidCheck" class="pl-[20px] mb-[15px] not-matching-text">사용 불가능한 아이디입니다.</p>
				</div>
				<div class="relative input-form">
					<kpInput
						class="kp-input w-full pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
						:class="!isPwdValidCheck ? 'mb-[10px]' : 'mb-[10px]'"
						type="password"
						placeholder="비밀번호 입력"
						:model-value="userForm.pwd"
						@update:modelValue="userForm.pwd = $event"
						@input="isPwdValidCheck = null" />
					<!-- @input="typingPassword"  -->
					<kpImage class="absolute left-5 top-[15px]" :src="`images/common/lock-icon.svg`" />
					<!--				<p v-if="!isPwdValidCheck" class="pl-[20px] mb-[15px] font-normal text-[14px] text-[#646464]">-->
					<p v-if="isPwdValidCheck !== null && !isPwdValidCheck" class="pl-[20px] pb-[10px] font-normal leading-[17px] text-[14px] text-[#FF3131]">
						소문자, 숫자, 기호를 조합한 8자리 이상의<br />비밀번호를 사용해주세요.
					</p>
					<p v-else class="pl-[20px] mb-[15px] standard-text">소문자, 숫자, 기호를 조합한 8자리 이상의<br />비밀번호를 사용해주세요.</p>
				</div>
				<div class="relative input-form">
					<kpInput
						class="kp-input w-full pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
						type="password"
						placeholder="비밀번호 재입력"
						:model-value="userForm.validatePwd"
						@update:modelValue="userForm.validatePwd = $event"
						@input="isPwdEqualsCheck = null" />
					<!-- @blur="pwdEqualsCheck" -->
					<kpImage class="absolute left-5 top-[15px]" :src="`images/common/lock-icon.svg`" />
					<p v-if="isPwdEqualsCheck" class="pl-[20px] mb-[15px] available-text">비밀번호가 일치합니다.</p>
					<p v-else-if="isPwdEqualsCheck !== null && !isPwdEqualsCheck" class="pl-[20px] mb-[15px] not-matching-text">
						비밀번호가 일치하지 않습니다.
					</p>
				</div>
				<div class="relative input-form">
					<kpInput
						class="kp-input w-full pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
						:class="!isPhoneValidCheck && isPhoneValidCheck !== null ? 'mb-[10px]' : 'mb-[15px]'"
						placeholder="전화번호"
						:model-value="userForm.phone"
						@update:modelValue="userForm.phone = $event"
						:handle-key-up="phoneNumberCheck"
						:length="phoneMaxLength"
						@input="isPhoneValidCheck = null" />
					<!--@blur="phoneValidCheck"-->
					<kpImage class="absolute left-5 top-[15px]" :src="`images/common/phone-icon.svg`" />
					<p v-if="isPhoneValidCheck !== null && !isPhoneValidCheck" class="pl-[20px] pb-[10px] font-normal text-[14px] text-[#FF3131]">
						올바른 양식이 아닙니다.
					</p>
				</div>
				<div class="relative input-form">
					<kpInput
						class="kp-input w-full pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mr-[10px]"
						:class="!isEmailValidCheck && isEmailValidCheck !== null ? 'mb-[10px]' : 'mb-[15px]'"
						placeholder="이메일"
						:model-value="userForm.email"
						@update:modelValue="userForm.email = $event"
						@input="typingEmail"
						@change="emailCheck"
						@blur="emailCheck" />
					<kpImage class="absolute left-5 top-[15px]" :src="`images/common/mail-icon.svg`" />
					<p v-if="isEmailValidCheck !== null && !isEmailValidCheck" class="pl-[20px] pb-[10px] font-normal text-[14px] text-[#FF3131]">
						올바른 양식이 아닙니다.
					</p>
				</div>
				<div class="relative input-form">
					<kp-button
						class="w-full border-[1px] border-[#466FFF] bg-[#FFFFFF] radius-[25px] outline-0 pt-[15px] py-[16px] rounded-[25px] text-[16px] text-[#466FFF] font-bold"
						:class="!isAuthStatus && isAuthStatus !== null ? 'mb-[15px]' : 'mb-[10px]'"
						@click="sendAuthMail">
						인증번호 발송
					</kp-button>
					<p v-if="isAuthStatus && isCertValidCheck === null" class="pl-[20px] mb-[10px] font-normal text-[14px] text-[#466FFF]">
						{{ mailSendContent }}
					</p>
				</div>
				<div class="relative input-form">
					<kpInput
						class="kp-input w-full pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mr-[10px]"
						placeholder="인증코드"
						type="'number'"
						maxlength="6"
						:model-value="certNum"
						@click="certInputClick"
						@blur="certInputBlur"
						@update:modelValue="certNum = $event" />
					<kpImage class="absolute left-5 top-[15px]" :src="`images/common/cert-icon.svg`" />
					<p v-if="isCertValidCheck !== null && !isCertValidCheck" class="pt-[10px] pl-[20px] font-normal text-[14px] text-[#FF3131]">
						인증코드가 일치하지 않습니다.
					</p>
					<!--				<kp-button-->
					<!--					class="min-w-[85px] w-[85px] small-btn pl-[14px] pr-[15px] pt-[15px] pb-[16px] rounded-[25px]"-->
					<!--					:is-disabled="!isEmailValidCheck"-->
					<!--					@click="sendAuthMail"-->
					<!--					>{{ isAuthContent }}</kp-button-->
					<!--				>-->
				</div>
			</form>
		</article>
		<p v-if="isIdDuplicateCheck !== null && !isIdDuplicateCheck" class="id-duplicate-check text-center mb-[15px]">아이디 중복체크를 해주세요.</p>
		<kp-button
			class="w-full confirm-btn border-0 outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[20px]"
			:class="
				userForm.userName.length > 0 &&
				userForm.userId.length > 0 &&
				userForm.pwd.length > 0 &&
				userForm.validatePwd.length > 0 &&
				userForm.phone.length > 0 &&
				userForm.email.length > 0 &&
				certNum.length === 6
					? 'activate'
					: 'deactivate'
			"
			:is-disabled="
				!(
					userForm.userName.length > 0 &&
					userForm.userId.length > 0 &&
					userForm.pwd.length > 0 &&
					userForm.validatePwd.length > 0 &&
					userForm.phone.length > 0 &&
					userForm.email.length > 0 &&
					certNum.length === 6
				)
			"
			@click="userFormCheck"
			>완료</kp-button
		>
		<p class="guide-text">이미 회원이시라면? <span class="guid-text-bold cursor-pointer" @click="doLogin">로그인 하기</span></p>
	</section>
</template>

<style scoped></style>
