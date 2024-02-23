<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router/dist/vue-router';
import { useStore } from 'vuex';
import KpInput from '@components/common/KpInput.vue';
import KpButton from '@components/common/KpButton.vue';
import KpImage from '@components/common/KpImage.vue';
import validator from 'validator';
import { SET_FIND_USER_ID, SET_USER_IDX } from '@src/store/actions';
import { getApiClient } from '@utils/api-client';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import AppConfig from '../../constants';

export enum userFindType {
	USER = 'user',
	PASSWORD = 'password',
}

export default defineComponent({
	name: 'FindUserInfo',
	components: { LayoutHeader, KpInput, KpButton, KpImage },
	setup() {
		const store = useStore();
		const route = useRoute();
		const apiClient = getApiClient(AppConfig.API_URL, store);
		const router = useRouter();
		const type = ref<string | null>('user');
		const userName = ref<string>('');
		const userId = ref<string>('');
		const email = ref<string>('');
		const phone = ref<string>('');
		const phoneMaxLength = ref<number>(13);
		const modalVisible = ref<boolean>(false);
		const resetPwdVisible = ref<boolean>(false);

		const isEmailValidCheck = ref<boolean | null>(null);
		const isPhoneValidCheck = ref<boolean | null>(null);

		const newPwd = ref<string>('');
		const newPwdCheck = ref<string>('');
		const isPwdValidCheck = ref<boolean>(false);
		const isPwdEqualsCheck = ref<boolean | null>(null);

		const idNotFindState = ref<boolean>(false);
		const pwdNotFindState = ref<boolean>(false);
		const headerTitle = ref<string>('아이디 찾기');

		const onClickChangeType = (v: string) => {
			if (type.value !== v) {
				userName.value = '';
				userId.value = '';
				email.value = '';
				phone.value = '';
			}
			type.value = v;
			idNotFindState.value = false;
			pwdNotFindState.value = false;
			resetPwdVisible.value = false;
			if (v === 'user') headerTitle.value = '아이디 찾기';
			else headerTitle.value = '비밀번호 찾기';
		};

		const emailCheck = () => {
			if (email.value === '') isEmailValidCheck.value = null;
			else isEmailValidCheck.value = !!validator.isEmail(email.value);
		};

		const phoneValidCheck = () => {
			const phoneNumber = phone.value.replace(/-/g, '');
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
			} else {
				phoneMaxLength.value = 13;
				value = v
					.replace(/[^0-9]/g, '')
					.replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, '$1-$2-$3')
					.replace(/(-{1,2})$/g, '');
			}
			return value;
		};

		const typingPassword = () => {
			const regExp = new RegExp('^(?=.*[A-Za-z])(?=.*\\d)(?=.*[$@$!%*#?&])[A-Za-z\\d$@$!%*#?&]{8,}$');
			isPwdValidCheck.value = regExp.test(newPwd.value);
			isPwdEqualsCheck.value = null;
			newPwdCheck.value = '';
		};

		const pwdEqualsCheck = () => {
			if (newPwd.value === '') isPwdEqualsCheck.value = null;
			else isPwdEqualsCheck.value = isPwdValidCheck.value && validator.equals(newPwd.value, newPwdCheck.value);
		};

		const clickNextBtn = () => {
			if (type.value === 'user') {
				apiClient.post('/api/1/users/findId', { userName: userName.value, email: email.value, tel: phone.value }).then(res => {
					if (res.data.resultCode !== 0) {
						idNotFindState.value = true;
						// openModal();
					} else {
						store.commit(SET_FIND_USER_ID, res.data.data[0].userId);
						router.replace({ path: '/login/success/user' });
					}
				});
			} else if (type.value === 'password') {
				// TODO 화면 정의서 부분에서는 어떠한 인증 없이 바로 비밀번호 재설정으로 넘어가는데 확인이 필요해보입니다
				apiClient
					.post('/api/1/users/findPassword', { userName: userName.value, userId: userId.value, email: email.value, tel: phone.value })
					.then(res => {
						if (res.data.resultCode !== 0) {
							pwdNotFindState.value = true;
							// openModal();
						} else {
							store.commit(SET_USER_IDX, res.data.data[0].userIdx);
							headerTitle.value = '비밀번호 재설정';
							resetPwdVisible.value = true;
						}
					});
			}
		};

		const clickResetPwdBtn = () => {
			apiClient.post('/api/1/users/changePassword', { userIdx: store.state.userIdx, pwd: newPwd.value }).then(res => {
				if (res.data.resultCode !== 0) {
					// openModal();
				} else {
					router.replace({ path: '/' });
				}
			});
		};

		// const openModal = () => {
		// 	document.body.style.overflow = 'hidden';
		// 	document.body.style.position = 'fixed';
		// 	document.body.style.height = '100%';
		// 	document.body.style.width = '100%';
		// 	modalVisible.value = true;
		// };
		//
		// const closeModal = () => {
		// 	document.body.style.overflow = 'auto';
		// 	document.body.style.position = 'relative';
		// 	document.body.style.height = 'unset';
		// 	document.body.style.width = 'unset';
		// 	modalVisible.value = false;
		// };

		onMounted(() => {
			type.value = store.state.findUserInfoType;
		});

		onBeforeUnmount(() => {
			document.body.style.overflow = 'auto';
			document.body.style.position = 'relative';
			document.body.style.height = 'unset';
			document.body.style.width = 'unset';
		});

		return {
			store,
			route,
			router,
			type,
			userName,
			userId,
			email,
			phone,
			newPwd,
			newPwdCheck,
			isEmailValidCheck,
			isPhoneValidCheck,
			isPwdValidCheck,
			isPwdEqualsCheck,
			phoneMaxLength,
			modalVisible,
			resetPwdVisible,
			idNotFindState,
			pwdNotFindState,
			headerTitle,
			typingPassword,
			emailCheck,
			phoneValidCheck,
			pwdEqualsCheck,
			phoneNumberCheck,
			onClickChangeType,
			clickNextBtn,
			clickResetPwdBtn,
			// openModal,
			// closeModal,
			userFindType,
		};
	},
});
</script>

<template>
	<!--	<div-->
	<!--		v-if="modalVisible"-->
	<!--		class="fixed h-screen w-full top-0 left-0 right-0 z-50 w-full p-4 bg-black bg-opacity-70 overflow-x-hidden overflow-y-auto">-->
	<!--		<div class="flex flex-col justify-center h-full">-->
	<!--			<div class="bg-white rounded-lg shadow">-->
	<!--				<div class="p-6 text-center">-->
	<!--					<svg-->
	<!--						aria-hidden="true"-->
	<!--						class="mx-auto mb-4 text-black-400 w-14 h-14"-->
	<!--						fill="none"-->
	<!--						stroke="currentColor"-->
	<!--						viewBox="0 0 24 24"-->
	<!--						xmlns="http://www.w3.org/2000/svg">-->
	<!--						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>-->
	<!--					</svg>-->
	<!--					<h3 class="mb-5 text-lg font-normal text-black-500">정보가 일치하지 않습니다!<br />다시 입력해주세요.</h3>-->
	<!--					<kp-button @click="closeModal" class="text-white bg-black rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 focus:z-10">-->
	<!--						확인-->
	<!--					</kp-button>-->
	<!--				</div>-->
	<!--			</div>-->
	<!--		</div>-->
	<!--	</div>-->
	<layout-header :title="headerTitle" />
	<section class="find flex flex-col items-center px-[20px] pt-[30px]">
		<article class="find-info flex-1 w-full text-center" :class="resetPwdVisible ? 'hidden' : ''">
			<div class="user-input-form flex-1 bg-white rounded-[10px] p-[20px] mb-[190px]" :class="type === userFindType.PASSWORD ? 'mb-[106px]' : ''">
				<div class="header-wrapper flex flex-row w-full">
					<button
						class="w-full bottom-0 pb-[10px]"
						:class="type === userFindType.USER ? 'activate' : 'deactivate'"
						@click="onClickChangeType(userFindType.USER)">
						아이디 찾기
					</button>
					<button
						class="w-full text-[24px]bottom-0 pb-[10px]"
						:class="type === userFindType.PASSWORD ? 'activate' : 'deactivate'"
						@click="onClickChangeType(userFindType.PASSWORD)">
						비밀번호 찾기
					</button>
				</div>
				<div class="line-wrapper flex flex-row w-full mb-[20px]">
					<div class="w-1/2 mx-[20px] h-[2px] rounded-[20px]" :class="type === userFindType.USER ? 'enabled' : 'disabled'"></div>
					<div class="w-1/2 mx-[20px] h-[2px] bg-[#466FFF] rounded-[20px]" :class="type === userFindType.PASSWORD ? 'enabled' : 'disabled'"></div>
				</div>
				<div v-if="type === 'user'" :class="resetPwdVisible ? 'hidden' : ''" class="content-wrapper flex flex-col">
					<div class="relative input-form">
						<kp-input
							class="kp-input w-full pl-[55px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
							:placeholder="'이름 입력'"
							:model-value="userName"
							@update:modelValue="userName = $event" />
						<kpImage class="absolute left-5 top-[15px]" :src="`images/common/user-icon.svg`" />
					</div>
					<div class="relative input-form">
						<kp-input
							class="kp-input w-full pl-[55px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
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
							class="kp-input w-full bg-[#F4F5F7] text-[16px] text-[#4E4B66] font-normal border-0 pl-[55px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
							:placeholder="'이메일 입력'"
							:model-value="email"
							@update:modelValue="email = $event"
							@input="emailCheck"
							@change="emailCheck"
							@blur="emailCheck" />
						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/mail-icon.svg`" />
					</div>
					<div v-if="idNotFindState" class="pl-[20px] mt-[10px] not-matching">일치하는 사용자 정보를 확인할 수 없습니다.</div>
				</div>
				<div v-else-if="type === 'password'" :class="resetPwdVisible ? 'hidden' : ''" class="content-wrapper flex flex-col">
					<div class="relative input-form">
						<kp-input
							class="kp-input w-full bg-[#F4F5F7] text-[16px] text-[#4E4B66] font-normal border-0 pl-[55px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
							:placeholder="'이름 입력'"
							:model-value="userName"
							@update:modelValue="userName = $event" />
						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/user-icon.svg`" />
					</div>
					<div class="relative input-form">
						<kp-input
							class="kp-input w-full pl-[55px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
							:placeholder="'아이디 입력'"
							:model-value="userId"
							@update:modelValue="userId = $event" />

						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/id-icon.svg`" />
					</div>
					<div class="relative input-form">
						<kp-input
							class="kp-input w-full pl-[55px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
							:placeholder="'전화번호'"
							:model-value="phone"
							@update:modelValue="phone = $event"
							:length="phoneMaxLength"
							:handle-key-up="phoneNumberCheck"
							@input="isPhoneValidCheck = null"
							@change="phoneValidCheck"
							@blur="phoneValidCheck" />
						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/phone-icon.svg`" />
					</div>
					<div class="relative input-form">
						<kp-input
							class="kp-input w-full pl-[55px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
							:placeholder="'이메일 입력'"
							:model-value="email"
							@update:modelValue="email = $event"
							@input="isEmailValidCheck = null"
							@change="emailCheck"
							@blur="emailCheck" />
						<kp-image class="absolute left-5 top-[15px]" :src="`images/common/mail-icon.svg`" />
					</div>
					<div v-if="pwdNotFindState" class="pl-[20px] not-matching">일치하는 사용자 정보를 확인할 수 없습니다.</div>
				</div>
			</div>
			<kp-button
				v-if="!resetPwdVisible"
				class="w-[calc(100%_-_40px)] btn-wrapper border-0 outline-0 pt-[16px] py-[15px] rounded-[25px]"
				:class="
					(type === 'user' && (userName === '' || !isEmailValidCheck || !isPhoneValidCheck)) ||
					(type === 'password' && (userName === '' || userId === '' || !isEmailValidCheck || !isPhoneValidCheck))
						? 'activate'
						: 'deactivate'
				"
				:is-disabled="
					(type === 'user' && (userName === '' || !isEmailValidCheck || !isPhoneValidCheck)) ||
					(type === 'password' && (userName === '' || userId === '' || !isEmailValidCheck || !isPhoneValidCheck))
				"
				@click="clickNextBtn"
				>완료</kp-button
			>
		</article>
		<article class="reset-info w-full mt-[10px]" v-if="resetPwdVisible">
			<div class="main-title pl-[10px] mb-[5px]">비밀번호 재설정</div>
			<div class="sub-title pl-[10px] mb-[30px]">사용하실 비밀번호를 다시 설정해주세요.</div>
			<div class="pwd-reset-form flex flex-col p-[20px] bg-white rounded-[10px] mb-[152px]">
				<div class="relative input-form">
					<kp-input
						type="password"
						class="kp-input w-full pl-[55px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[10px]"
						:placeholder="'비밀번호 입력'"
						:model-value="newPwd"
						@update:modelValue="newPwd = $event"
						@input="typingPassword" />
					<kp-image class="absolute left-5 top-[15px]" :src="`images/common/lock-icon.svg`" />
					<p class="guide-info pl-[20px] mb-[15px] text-[14px] text-[#646464]">소문자, 숫자, 기호를 조합한 8자리 이상의 비밀번호를 사용해주세요.</p>
				</div>
				<div class="relative input-form">
					<kp-input
						type="password"
						class="kp-input w-full pl-[55px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
						:placeholder="'비밀번호 재입력'"
						:model-value="newPwdCheck"
						@update:modelValue="newPwdCheck = $event"
						@change="pwdEqualsCheck"
						@blur="pwdEqualsCheck" />
					<kp-image class="absolute left-5 top-[15px]" :src="`images/common/lock-icon.svg`" />
					<p v-if="!isPwdEqualsCheck" class="pl-[20px] not-matching">비밀번호가 일치하지 않습니다.</p>
				</div>
			</div>
			<kp-button
				class="w-[calc(100%_-_40px)] confirm-btn border-0 outline-0 mx-[20px] pt-[16px] py-[15px] rounded-[25px]"
				:class="isPwdValidCheck && isPwdEqualsCheck ? 'activate' : 'deactivate'"
				:is-disabled="!(isPwdValidCheck && isPwdEqualsCheck)"
				@click="clickResetPwdBtn"
				>완료</kp-button
			>
		</article>
	</section>
</template>

<style scoped></style>
