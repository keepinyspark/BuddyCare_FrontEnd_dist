<script lang="ts">
import { defineComponent, onBeforeMount, onMounted, onUnmounted, ref } from 'vue';
import KpInput from '@components/common/KpInput.vue';
import KpButton from '@components/common/KpButton.vue';
import KpImage from '@components/common/KpImage.vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { getApiClient } from '@utils/api-client';
import { LoginUserInfoInterface, UserType } from '@src/types/types';
import { doLogout, getImgUrl, loadLocalData, saveLocalData } from '@utils/common-utils';
import { KEY_LIST } from '../../constants-keys';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import AppConfig from '../../constants';
import validator from 'validator';
import { SET_AUTH_TOKEN, SET_FOOTER_TYPE } from '@src/store/actions';
import { getGroupManager, removeGroupManager } from '@utils/group/group-instance';
import { getGroupList } from '../../utils/group/api/group-api';
import { STATE_REG } from '../../components/Profile.vue';
import KpSelectBox from '@components/common/KpSelectBox.vue';
import KpToggle from '@components/common/KpToggle.vue';

export default defineComponent({
	name: 'PrivateInfo',
	components: { KpToggle, KpSelectBox, LayoutHeader, KpInput, KpButton, KpImage },
	setup() {
		const store = useStore();
		const route = useRoute();
		const router = useRouter();
		const apiClient = getApiClient(AppConfig.API_URL, store);
		const userInfo = ref<LoginUserInfoInterface | null>(null);
		const profileImg = ref<string | null>(null);
		const imgFile = ref<File | null>(null);
		const isChangeImage = ref<boolean>(false);
		const isEmailValidCheck = ref<boolean | null>(true);
		const isPhoneValidCheck = ref<boolean | null>(true);
		const isSosPhoneValidCheck = ref<boolean | null>(true);
		const nameMaxLength = ref<number>(20);
		const phoneMaxLength = ref<number>(13);
		const userName = ref<string>('');
		const userId = ref<string>('');
		const email = ref<string>('');
		const tel = ref<string>('');
		const height = ref<string>('');
		const age = ref<string>('');
		const weight = ref<string>('');
		const gender = ref<string>('남성');
		const isEnabledEmergency = ref<boolean>(false);
		const isEnabled119 = ref<boolean>(false);
		const emergencyName = ref<string>('');
		const emergencyTel = ref<string>('');
		const emergencyCnt = ref<string>('');
		const bpHigh = ref<string>('');
		const bpLow = ref<string>('');

		const getLoginUserInfo = (): void => {
			const userData = loadLocalData(KEY_LIST.CONST.LOGIN_USER);
			if (userData) {
				userInfo.value = JSON.parse(userData);
			}
		};

		const addFile = (e: Event) => {
			const eventTarget = e.target as HTMLInputElement;
			if (eventTarget.files && eventTarget.files.length > 0) {
				imgFile.value = eventTarget.files[0] as File;
				profileImg.value = URL.createObjectURL(eventTarget.files[0] as Blob);
				isChangeImage.value = true;
			}
		};

		const getUserInfo = (): void => {
			if (userInfo.value) {
				apiClient.post('/api/1/users/me', { userIdx: userInfo.value.userIdx }).then(res => {
					if (res.data.resultCode !== 0) {
						window.alert(res.data.resultMsg);
					} else {
						userName.value = res.data.data.userName;
						userId.value = res.data.data.userId;
						email.value = res.data.data.email;
						tel.value = res.data.data.tel;
						profileImg.value = getImgUrl(res.data.data.userProfile);
						if (userInfo.value) Object.assign(res.data.data, { token: userInfo.value.token });
						saveLocalData(KEY_LIST.CONST.LOGIN_USER, JSON.stringify(res.data.data));
					}
				});
			}
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

		const emailCheck = (): void => {
			isEmailValidCheck.value = null;
		};

		const userFormCheck = () => {
			// phone check
			isPhoneValidCheck.value = validator.isMobilePhone(tel.value.replace(/-/g, ''), 'ko-KR');
			isSosPhoneValidCheck.value = validator.isMobilePhone(tel.value.replace(/-/g, ''), 'ko-KR');

			// email check
			isEmailValidCheck.value = !!validator.isEmail(email.value);
			if (userInfo.value && userInfo.value.userType === UserType.MANAGER) {
				if (tel.value === '') {
					isPhoneValidCheck.value = true;
				}
				if (email.value === '') {
					isEmailValidCheck.value = true;
				}
			}
			if (userInfo.value?.userType === UserType.USER_DEVICE) {
				if (userName.value.length > 0 && isEmailValidCheck.value && isPhoneValidCheck.value) {
					if (isEnabledEmergency.value) {
						if (emergencyTel.value.length > 0 && isSosPhoneValidCheck.value) {
							savePrivate();
						}
					} else {
						savePrivate();
					}
				}
			} else {
				savePrivate();
			}
		};

		const doSetting = (): void => {
			router.push({ path: '/setting' });
		};

		const doReset = (): void => {
			router.push({ path: '/reset-pwd' });
		};

		const savePrivate = (): void => {
			if (userInfo.value) {
				const formData = new FormData();
				formData.append('userName', userName.value);
				formData.append('email', email.value);
				formData.append('tel', tel.value);
				if (userInfo.value?.userType === UserType.USER_DEVICE) {
					if (gender.value.length > 0) {
						formData.append('gender', gender.value);
					}
					if (age.value.length > 0) {
						formData.append('age', age.value);
					}
					if (weight.value.length > 0) {
						formData.append('weight', weight.value);
					}
					if (height.value.length > 0) {
						formData.append('height', height.value);
					}
					formData.append('isSosCallEnabled', isEnabledEmergency.value ? 'Y' : 'N');
					formData.append('isCall119Enabled', isEnabled119.value ? 'Y' : 'N');
					if (emergencyName.value.length > 0) {
						formData.append('emergencyName', emergencyName.value);
					}
					if (emergencyTel.value.length > 0) {
						formData.append('emergencyTel', emergencyTel.value);
					}
					if (emergencyCnt.value.length > 0) {
						formData.append('emergencyCnt', emergencyCnt.value);
					}
					if (bpHigh.value.length > 0) {
						formData.append('normalHighBp', bpHigh.value);
					}
					if (bpLow.value.length > 0) {
						formData.append('normalLowBp', bpLow.value);
					}
				}
				if (isChangeImage.value) formData.append('profileFile', imgFile.value as Blob);
				apiClient.post('/api/1/users/me/update', formData).then(res => {
					if (res.data.resultCode !== 0) {
						window.alert(res.data.resultMsg);
					} else {
						updateUserInfo();
					}
				});
			}
		};

		const updateUserInfo = (): void => {
			apiClient.post('/api/1/users/me', {}).then(res => {
				if (res.data.resultCode !== 0) {
					window.alert(res.data.resultMsg);
				} else {
					apiClient.post('/api/1/users/getAllAppInfo').then(res => {
						const {
							gender,
							age,
							weight,
							height,
							bpAge,
							isUseLocationInfo,
							userPreferences,
							name,
							phoneNumber,
							isSosCallEnabled,
							sosTryCount,
							isCall119Enabled,
							normalHighBp,
							normalLowBp,
							sms,
							kakaotalk,
							line,
							whatsapp,
							telegram,
							instagram,
							youtube,
							gmail,
							snapchat,
							facebook,
							x,
							wechat,
							morningBreifStatus,
							morningBreifTime,
							morningBreifLanguage,
							morningBreifVoice,
							morningBreifSpeed,
							aiAssistantMpreviousMemory,
							aiAssistantMlanguage,
							aiAssistantMresponseType,
							aiAssistantMvoice,
							aiAssistantMspeed,
							aiAssistantHalarmTimes,
							aiAssistantHarithmeticLevel,
							aiAssistantHmemoryLevel,
							aiAssistantHdescriptionLevel,
							aiAssistantHreverseWordLevel,
						} = res.data.data;

						const isNaNCheck = (value: string | null) => {
							return isNaN(Number(value)) ? 0 : Number(value);
						};

						const returnJson = {
							defaultInfo: {
								gender,
								age: isNaNCheck(age),
								weight: isNaNCheck(weight),
								height: isNaNCheck(height),
								bpAge: isNaNCheck(bpAge),
								isUseLocationInfo: isUseLocationInfo === 'Y',
								userPreferences,
							},
							sosCalling: {
								name,
								phoneNumber,
								isSosCallEnabled: isSosCallEnabled === 'Y',
								sosTryCount: isNaNCheck(sosTryCount),
								isCall119Enabled: isCall119Enabled === 'Y',
							},
							bpCalibration: {
								normalHighBp: isNaNCheck(normalHighBp),
								normalLowBp: isNaNCheck(normalLowBp),
							},
							appNotificationSetting: {
								sms: sms === 'Y',
								kakaotalk: kakaotalk === 'Y',
								line: line === 'Y',
								whatsapp: whatsapp === 'Y',
								telegram: telegram === 'Y',
								instagram: instagram === 'Y',
								youtube: youtube === 'Y',
								gmail: gmail === 'Y',
								snapchat: snapchat === 'Y',
								facebook: facebook === 'Y',
								x: x === 'Y',
								wechat: wechat === 'Y',
							},
							morningBreifSetting: {
								morningBreifStatus: morningBreifStatus === 'Y',
								morningBreifTime,
								morningBreifLanguage,
								morningBreifVoice,
								morningBreifSpeed,
							},
							aiAssistantSetting: {
								aiAssistantMpreviousMemory,
								aiAssistantMlanguage,
								aiAssistantMresponseType,
								aiAssistantMvoice,
								aiAssistantMspeed,
								aiAssistantHalarmTimes,
								aiAssistantHarithmeticLevel: isNaNCheck(aiAssistantHarithmeticLevel),
								aiAssistantHmemoryLevel: isNaNCheck(aiAssistantHmemoryLevel),
								aiAssistantHdescriptionLevel: isNaNCheck(aiAssistantHdescriptionLevel),
								aiAssistantHreverseWordLevel: isNaNCheck(aiAssistantHreverseWordLevel),
							},
						};

						window.appInterface.userPersonalInfo(JSON.stringify(returnJson));
					});

					userName.value = res.data.data.userName;
					userId.value = res.data.data.userId;
					email.value = res.data.data.email;
					tel.value = res.data.data.tel;
					if (userInfo.value) Object.assign(res.data.data, { token: userInfo.value.token });
					saveLocalData(KEY_LIST.CONST.LOGIN_USER, JSON.stringify(res.data.data));
					reCreateGroup();
					window.alert('저장되었습니다.');
					router.push({ path: '/setting' });
				}
			});
		};

		const userNameCheck = (v: string) => {
			let value = '';
			if (v.length > nameMaxLength.value) value = v.slice(0, nameMaxLength.value);
			else value = v;
			return value;
		};

		const onClickUserDelete = () => {
			if (window.confirm('회원탈퇴를 진행하시겠습니까?')) {
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
			}
		};

		const reCreateGroup = () => {
			getGroupList(getApiClient(), { stateReg: STATE_REG.RESOLVE, noCache: true })
				.then(async res => {
					const dataList = res.data as any;
					await getGroupManager().updateGroupList(dataList);
				})
				.catch(e => {
					throw e;
				});

			// const handleLoadComplete = () => {
			// 	getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleLoadComplete);
			// };

			// try {
			// 	removeGroupManager();
			// 	createGroupManager().launchChat();
			// 	getGroupManager().addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleLoadComplete);
			// } catch (e) {}
		};

		onBeforeMount(() => {
			getLoginUserInfo();
			getUserInfo();
		});

		onMounted(() => {
			// const userData = loadLocalData(KEY_LIST.CONST.LOGIN_USER);
			// if (userData) userInfo.value = JSON.parse(userData);
			apiClient.post('/api/1/users/getAllAppInfo').then(res => {
				height.value = res.data.data.height || '';
				age.value = res.data.data.age || '';
				weight.value = res.data.data.weight || '';
				gender.value = res.data.data.gender || '';
				isEnabledEmergency.value = res.data.data.isSosCallEnabled === 'Y';
				isEnabled119.value = res.data.data.isCall119Enabled === 'Y';
				emergencyName.value = res.data.data.name || '';
				emergencyTel.value = res.data.data.phoneNumber || '';
				emergencyCnt.value = res.data.data.sosTryCount || '';
				bpHigh.value = res.data.data.normalHighBp || '';
				bpLow.value = res.data.data.normalLowBp || '';
			});
		});

		onUnmounted(() => {
			// releaseSocket();
		});

		return {
			UserType,
			store,
			route,
			router,
			userInfo,
			userName,
			userId,
			email,
			tel,
			profileImg,
			nameMaxLength,
			phoneMaxLength,
			userNameCheck,
			isEmailValidCheck,
			isSosPhoneValidCheck,
			isPhoneValidCheck,
			addFile,
			doSetting,
			doReset,
			savePrivate,
			emailCheck,
			userFormCheck,
			phoneNumberCheck,
			onClickUserDelete,

			height,
			age,
			weight,
			gender,
			setGender: (value: string) => (gender.value = value),
			isEnabledEmergency,
			setEnabledEmergency: () => (isEnabledEmergency.value = !isEnabledEmergency.value),
			isEnabled119,
			setEnabled119: () => (isEnabled119.value = !isEnabled119.value),
			emergencyName,
			emergencyTel,
			emergencyCnt,
			setEmergencyCnt: (value: string) => (emergencyCnt.value = value),
			bpHigh,
			setBpHigh: (value: string) => (bpHigh.value = value),
			bpLow,
			setBpLow: (value: string) => (bpLow.value = value),
		};
	},
});
</script>

<template>
	<layout-header title="개인정보" />
	<section class="private flex flex-col h-[calc(100%_-_56px)] items-center px-[20px] pt-[25px] pb-[130px]">
		<article class="private-info w-full">
			<div class="bg-white pt-[25px] pb-[32px] px-[20px] mb-[20px] rounded-[10px]">
				<div class="image-form relative w-full w-[80px] h-[80px] mx-auto mb-[25px]">
					<div v-if="!profileImg" class="z-20 absolute camera-bg-wrapper w-[80px] h-[80px] rounded-full"></div>
					<KpImage v-if="!profileImg" class="z-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" :src="`images/icon/ico-camera.svg`" />
					<KpImage
						v-if="profileImg"
						:src="profileImg"
						class="z-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover w-[80px] h-[80px]" />
					<label for="profile-img">
						<span class="z-40 cursor-pointer absolute w-[80px] h-[80px]"> </span>
					</label>
					<input id="profile-img" accept="image/*" style="display: none" type="file" @change="(e:Event) => addFile(e)" />
				</div>
				<div class="mb-[20px] input-form">
					<div class="input-title pl-[20px] mb-[5px]">이름</div>
					<kpInput
						class="kp-input private-input w-full px-[20px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
						:model-value="userName"
						:handle-key-up="userNameCheck"
						:length="nameMaxLength"
						@update:modelValue="userName = $event" />
				</div>
				<div class="mb-[20px] input-form">
					<div class="input-title pl-[20px] mb-[5px]">아이디</div>
					<kpInput
						class="read-only-input w-full border-0 px-[20px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
						:model-value="userId"
						:read-only="true" />
				</div>
				<div class="mb-[20px] input-form">
					<div class="input-title pl-[20px] mb-[5px]">비밀번호</div>
					<kp-button
						class="reset-password-btn w-full border-[1px] border-[#466FFF] radius-[25px] outline-0 pt-[15px] py-[16px] rounded-[25px] text-[16px] font-bold"
						@click="doReset">
						비밀번호 재설정
					</kp-button>
				</div>
				<div class="input-form" :class="isEmailValidCheck !== null && !isEmailValidCheck ? '' : 'mb-[20px]'">
					<div class="input-title pl-[20px] mb-[5px]">이메일</div>
					<kpInput
						class="kp-input private-input w-full px-[20px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
						:model-value="email"
						@update:modelValue="email = $event"
						@input="emailCheck" />
					<p v-if="isEmailValidCheck !== null && !isEmailValidCheck" class="pl-[20px] pt-[10px] pb-[10px] font-normal text-[14px] text-[#FF3131]">
						올바른 양식이 아닙니다.
					</p>
				</div>
				<div class="input-form" :class="isPhoneValidCheck !== null && !isPhoneValidCheck ? '' : 'mb-[20px]'">
					<div class="input-title pl-[20px] mb-[5px]">전화번호</div>
					<kpInput
						class="kp-input private-input w-full pl-[20px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
						:model-value="tel"
						:length="phoneMaxLength"
						:handle-key-up="phoneNumberCheck"
						@input="isPhoneValidCheck = null"
						@update:modelValue="tel = $event" />
					<p v-if="isPhoneValidCheck !== null && !isPhoneValidCheck" class="pl-[20px] pt-[10px] pb-[10px] font-normal text-[14px] text-[#FF3131]">
						올바른 양식이 아닙니다.
					</p>
				</div>
				<template v-if="userInfo.userType === UserType.USER_DEVICE">
					<div class="input-form mb-[20px]">
						<div class="input-title pl-[20px] mb-[5px]">키</div>
						<kpInput
							class="kp-input private-input w-[calc(100%_-_50px)] pl-[20px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
							type="number"
							:model-value="height"
							@update:modelValue="height = $event" />
						<span class="input-title ml-[10px]">cm</span>
					</div>
					<div class="input-form mb-[20px]">
						<div class="input-title pl-[20px] mb-[5px]">몸무게</div>
						<kpInput
							class="kp-input private-input w-[calc(100%_-_50px)] pl-[20px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
							type="number"
							:model-value="weight"
							@update:modelValue="weight = $event" />
						<span class="input-title ml-[10px]">kg</span>
					</div>
					<div class="input-form mb-[20px]">
						<div class="input-title pl-[20px] mb-[5px]">나이</div>
						<kpInput
							class="kp-input private-input w-[calc(100%_-_50px)] pl-[20px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
							type="number"
							:model-value="age"
							@update:modelValue="age = $event" />
						<span class="input-title ml-[10px]">세</span>
					</div>
					<div class="input-form mb-[20px]">
						<div class="input-title pl-[20px] mb-[5px]">성별</div>
						<kp-select-box
							class="w-[50%]"
							:select-value="gender"
							:options="[
								{ value: '남성', label: '남성' },
								{ value: '여성', label: '여성' },
							]"
							@onChange="setGender" />
					</div>
				</template>
			</div>
			<template v-if="userInfo.userType === UserType.USER_DEVICE">
				<div class="bg-white pt-[25px] pb-[32px] px-[20px] mb-[20px] rounded-[10px]">
					<div class="flex justify-between items-center">
						<div class="flex">
							<span class="title">지정 긴급통화자 사용</span>
						</div>
						<kp-toggle :is-checked="isEnabledEmergency" @onToggleClick="setEnabledEmergency" />
					</div>
					<div class="flex justify-between items-center mt-[10px]">
						<div class="flex">
							<span class="title">119 연계 여부</span>
						</div>
						<kp-toggle :is-checked="isEnabled119" @onToggleClick="setEnabled119" />
					</div>
					<div class="mt-[20px] mb-[20px] input-form">
						<div class="input-title pl-[20px] mb-[5px]">이름</div>
						<kpInput
							class="kp-input private-input w-full px-[20px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
							:read-only="!isEnabledEmergency"
							:model-value="emergencyName"
							:handle-key-up="userNameCheck"
							:length="nameMaxLength"
							@update:modelValue="emergencyName = $event" />
					</div>
					<div class="mt-[20px]">
						<div class="input-form" :class="isSosPhoneValidCheck !== null && !isSosPhoneValidCheck ? '' : 'mb-[20px]'">
							<div class="input-title pl-[20px] mb-[5px]">전화번호</div>
							<kpInput
								class="kp-input private-input w-full pl-[20px] outline-0 pt-[16px] py-[15px] rounded-[25px]"
								:read-only="!isEnabledEmergency"
								:model-value="emergencyTel"
								:length="phoneMaxLength"
								:handle-key-up="phoneNumberCheck"
								@input="isSosPhoneValidCheck = null"
								placeholder="010-0000-0000"
								@update:modelValue="emergencyTel = $event" />
							<p
								v-if="isSosPhoneValidCheck !== null && !isSosPhoneValidCheck"
								class="pl-[20px] pt-[10px] pb-[10px] font-normal text-[14px] text-[#FF3131]">
								올바른 양식이 아닙니다.
							</p>
						</div>
					</div>
					<div class="mb-[20px] input-form">
						<div class="input-title pl-[20px] mb-[5px]">연결시도</div>
						<kp-select-box
							class="w-[50%]"
							:select-value="emergencyCnt"
							:options="[
								{ value: '1', label: '1' },
								{ value: '3', label: '3' },
								{ value: '5', label: '5' },
								{ value: '10', label: '10' },
							]"
							@onChange="setEmergencyCnt" />
					</div>
				</div>
				<div class="bg-white pt-[25px] pb-[32px] px-[20px] mb-[40px] rounded-[10px]">
					<div class="flex justify-between items-center">
						<div class="flex">
							<span class="title">평소 혈압정보(혈압 보정에 사용)</span>
						</div>
					</div>
					<div class="mt-[20px]">
						<div class="mt-[20px] input-form">
							<div class="input-title pl-[20px] mb-[5px]">수축기</div>
							<kp-select-box
								class="w-[50%]"
								:select-value="bpHigh"
								:options="[
									{ value: '70', label: '70' },
									{ value: '80', label: '80' },
									{ value: '90', label: '90' },
									{ value: '100', label: '100' },
									{ value: '110', label: '110' },
									{ value: '120', label: '120' },
									{ value: '130', label: '130' },
									{ value: '140', label: '140' },
									{ value: '150', label: '150' },
									{ value: '160', label: '160' },
									{ value: '170', label: '170' },
									{ value: '180', label: '180' },
									{ value: '190', label: '190' },
									{ value: '200', label: '200' },
								]"
								@onChange="setBpHigh" />
							<span class="input-title ml-[10px]">mmHg</span>
						</div>
						<div class="mt-[10px] input-form">
							<div class="input-title pl-[20px] mb-[5px]">이완기</div>
							<kp-select-box
								class="w-[50%]"
								:select-value="bpLow"
								:options="[
									{ value: '60', label: '60' },
									{ value: '70', label: '70' },
									{ value: '80', label: '80' },
									{ value: '90', label: '90' },
									{ value: '100', label: '100' },
									{ value: '110', label: '110' },
									{ value: '120', label: '120' },
									{ value: '130', label: '130' },
								]"
								@onChange="setBpLow" />
							<span class="input-title ml-[10px]">mmHg</span>
						</div>
					</div>
				</div>
			</template>

			<!--			<kpButton class="w-full opacity-100 text-[#F52E6B]"> 취소 </kpButton>-->
			<!--			bg-[linear-gradient(180deg,_#FE6587_100%,_#F52D6A_100%)]-->
			<kpButton class="save-btn w-full bottom-0 pt-[16px] pb-[15px] mb-[10px] text-white rounded-[25px]" @click="userFormCheck"> 저장 </kpButton>
			<kpButton class="cancel-btn w-full bottom-0 pt-[16px] pb-[15px] mb-[20px] rounded-[25px]" @click="doSetting"> 취소 </kpButton>
			<div class="withdraw-wrapper mb-[40px]">
				<span class="mr-[10px]">이 계정을 사용하지 않으시나요?</span>
				<span class="withdraw-bold cursor-pointer" @click="onClickUserDelete">회원탈퇴</span>
			</div>
		</article>
	</section>
</template>

<style scoped></style>
