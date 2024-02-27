<script lang="ts">
import { defineComponent, onUnmounted } from 'vue';
import KpButton from '@components/common/KpButton.vue';
import { SET_AUTH_TOKEN } from '@src/store/actions';
import { getUserData, removeLocalData } from '@utils/common-utils';
import { KEY_LIST } from '../../constants-keys';
import { removeCookie } from 'typescript-cookie';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { createGroup } from '@utils/api-utils';
import { getApiClient } from '@utils/api-client';
import { createGroupManager, getGroupManager, removeGroupManager } from '@utils/group/group-instance';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import router from '@src/router';

export default defineComponent({
	name: 'GroupWaitingPopup',
	components: { KpButton },
	setup() {
		const store = useStore();
		const route = useRoute();
		const router = useRouter();

		const onClickSetting = () => {
			router.push('/setting/group');
		};

		const onClickBack = () => {
			store.commit(SET_AUTH_TOKEN, '');
			removeLocalData(KEY_LIST.CONST.LOGIN_USER);
			removeLocalData(KEY_LIST.CONST.LOGIN_TOKEN);
			removeCookie(KEY_LIST.CONST.LOGIN_TOKEN);
			removeGroupManager();
			router.replace('/');
		};

		return { onClickSetting, onClickBack };
	},
});
</script>
<template>
	<div class="waiting-popup">
		<!--		<kp-link link="#" :on-click="handleCreateGroup">그룹 만들기</kp-link>-->

		<div class="waiting-popup-wrapper">
			<p class="title">돌봄 그룹 연결 대기중입니다.</p>
			<p class="desc">기기 사용자에게<br />돌봄 그룹 연결을 요청해주세요.</p>
			<kp-button class="btn-setting" isDefault :on-click="onClickSetting">돌봄 그룹 설정</kp-button>
			<!--			<kp-button class="btn-back" isDefault :on-click="onClickBack">뒤로가기</kp-button>-->
		</div>
	</div>
</template>

<style scoped></style>
