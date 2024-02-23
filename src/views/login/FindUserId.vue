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
import { SET_FIND_USER_ID } from '@src/store/actions';

export default defineComponent({
	name: 'FindUserId',
	components: { LayoutHeader, KpInput, KpButton, KpImage },
	setup() {
		const store = useStore();
		const route = useRoute();
		const apiClient = getApiClient(AppConfig.API_URL, store);
		const router = useRouter();
		const userName = ref<string>('');
		const email = ref<string>('');
		const phone = ref<string>('');
		const phoneMaxLength = ref<number>(13);
		const isEmailValidCheck = ref<boolean | null>(null);
		const isPhoneValidCheck = ref<boolean | null>(null);
		const idNotFindState = ref<boolean>(false);

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
			apiClient.post('/api/1/users/findId', { userName: userName.value.trim(), email: email.value.trim(), tel: phone.value }).then(res => {
				if (res.data.resultCode !== 0) {
					idNotFindState.value = true;
					// openModal();
				} else {
					store.commit(SET_FIND_USER_ID, res.data.data[0].userId);
					router.replace({ path: '/login/success/user' });
				}
			});
		};

		return {
			router,
			route,
			userName,
			email,
			phone,
			phoneMaxLength,
			isPhoneValidCheck,
			isEmailValidCheck,
			idNotFindState,
			phoneValidCheck,
			phoneNumberCheck,
			clickNextBtn,
			emailCheck,
		};
	},
});
</script>

<template>
	<layout-header title="아이디 찾기" />
	<section class="find flex flex-col items-center px-[20px] pt-[30px] h-[calc(100%_-_56px)]">
		<article class="relative find-info justify-evenly flex flex-col flex-1 w-full text-center">
			<div class="w-full bg-white absolute top-0 rounded-[10px]" :class="idNotFindState ? 'h-[247px]' : 'h-[220px]'"></div>
			<div class="user-input-form flex-1 rounded-[10px] p-[20px]">
				<div class="content-wrapper flex flex-col">
					<div class="relative input-form">
						<kp-input
							class="kp-input w-full pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[15px]"
							:placeholder="'이름 입력'"
							:model-value="userName"
							@update:modelValue="userName = $event" />
						<kpImage class="absolute left-5 top-[15px]" :src="`images/common/user-icon.svg`" />
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
						<kpImage class="absolute left-5 top-[15px]" :src="`images/common/phone-icon.svg`" />
					</div>
					<div class="relative input-form">
						<kp-input
							class="kp-input w-full bg-[#F4F5F7] text-[16px] text-[#4E4B66] font-normal pl-[55px] pr-[30px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
							:placeholder="'이메일 입력'"
							:model-value="email"
							@update:modelValue="email = $event"
							@input="emailCheck"
							@change="emailCheck"
							@blur="emailCheck" />
						<kpImage class="absolute left-5 top-[15px]" :src="`images/common/mail-icon.svg`" />
					</div>
					<div v-if="idNotFindState" class="pl-[20px] mt-[10px] not-matching z-10">일치하는 사용자 정보를 확인할 수 없습니다.</div>
				</div>
			</div>
			<div>
				<kp-button
					class="w-[calc(100%_-_40px)] btn-wrapper border-0 outline-0 pt-[16px] py-[15px] rounded-[25px] mb-[60px]"
					:is-disabled="userName === '' || !isEmailValidCheck || !isPhoneValidCheck"
					@click="clickNextBtn"
					>완료</kp-button
				>
			</div>
			<!-- :class="userName === '' || !isEmailValidCheck || !isPhoneValidCheck ? 'activate' : 'deactivate'" -->
		</article>
	</section>
</template>

<style scoped></style>
