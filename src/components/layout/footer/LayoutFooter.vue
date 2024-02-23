<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import KpImage from '@components/common/KpImage.vue';
import { useRoute, useRouter } from 'vue-router';
import KpLink from '@components/common/KpLink.vue';
import { getUserData } from '@utils/common-utils';
import { UserType } from '@src/types/types';
import { getGroupManager } from '@utils/group/group-instance';
import { remove } from 'lodash';
import { useStore } from 'vuex';

const mainMenu = ['Dashboard', 'Map'];

const deviceMenu = ['DeviceMenu'];

const healthMenu = ['Health'];

const chatMenu = ['ChatList', 'ChatDetail'];

const settingMenu = ['SettingMenu', 'SettingGroup', 'SettingTarget', 'SettingAlarm'];

const locationMenu = ['Location'];

const nonFooterMenu = [
	'ChatDetail',
	'DeviceConnect',
	'Health Detail',
	'Login',
	'Terms',
	'Join',
	'Success',
	'FindUserInfo',
	'FindUserId',
	'FindUserPassword',
	'PrivateInfo',
	'UserType',
	'ResetPassword',
	'SettingTarget',
	'SettingAlarm',
	'DeviceWatchface',
	'DeviceUpdateCycle',
	'DeviceNotDisturb',
	'DeviceFirmwareUpdate',
	'SettingGroup',
	'Downloads',
];

export default defineComponent({
	name: 'LayoutFooter',
	components: { KpLink, KpImage },
	setup() {
		const store = useStore();
		const route = useRoute();
		const bottomMenu = ref<any>([
			{ name: 'device', label: '기기' },
			{ name: 'health', label: '건강' },
			{ name: 'main', label: '홈' },
			{ name: 'chat', label: '채팅' },
			{ name: 'setting', label: '설정' },
		]);
		const router = useRouter();
		const activeMenu = ref<string>('main');
		const hiddenFooter = ref<boolean>(false);
		const isManager = ref<boolean>();

		const openChatDetail = () => {
			try {
				const curGroup = getGroupManager().getCurrentGroup();
				if (curGroup) {
					getGroupManager().joinChannel(curGroup.channelIdx);
					router.push({ path: `/chat-room/${curGroup.groupIdx}` });
				}
			} catch (e) {
				//
			}
		};

		const handleSelectNavigation = (dt: any) => {
			if (!store.state.footerLock) {
				activeMenu.value = dt.name;
				switch (dt.name) {
					case 'chat':
						const userType = getUserData().userType;
						if (!userType) return;
						if (userType === UserType.USER_DEVICE || userType === UserType.USER) {
							openChatDetail();
						} else if (userType === UserType.MANAGER) {
							router.push('/chat-list');
						}
						break;
					case 'health':
						router.push('/health');
						break;
					case 'location':
						router.push({ path: '/location?all' });
						break;
					case 'main':
						router.push('/');
						break;
					case 'device':
						router.push('/device');
						break;
					case 'setting':
						router.push('/setting');
						break;
					default:
						break;
				}
			} else {
				if (dt.name === 'main') {
					activeMenu.value = dt.name;
					router.push('/');
				} else if (dt.name === 'setting') {
					activeMenu.value = dt.name;
					router.push('/setting');
				}
			}
		};

		const onActiveMenu = (routeName: string) => {
			if (mainMenu.indexOf((routeName ?? '') as string) > -1) {
				activeMenu.value = 'main';
			} else if (chatMenu.indexOf((routeName ?? '') as string) > -1) {
				activeMenu.value = 'chat';
			} else if (healthMenu.indexOf((routeName ?? '') as string) > -1) {
				activeMenu.value = 'health';
			} else if (deviceMenu.indexOf((routeName ?? '') as string) > -1) {
				activeMenu.value = 'device';
			} else if (settingMenu.indexOf((routeName ?? '') as string) > -1) {
				activeMenu.value = 'setting';
			} else if (locationMenu.indexOf((routeName ?? '') as string) > -1) {
				activeMenu.value = 'location';
			} else {
				activeMenu.value = 'main';
			}
		};

		const setFooter = () => {
			bottomMenu.value =
				store.state.footerType === 'MANAGER'
					? [
							{ name: 'location', label: '위치' },
							{ name: 'main', label: '홈' },
							{ name: 'chat', label: '채팅' },
							{ name: 'setting', label: '설정' },
					  ]
					: [
							{ name: 'device', label: '기기' },
							{ name: 'health', label: '건강' },
							{ name: 'main', label: '홈' },
							{ name: 'chat', label: '채팅' },
							{ name: 'setting', label: '설정' },
					  ];

			isManager.value = getUserData() && getUserData().userType && getUserData().userType === UserType.MANAGER;
		};

		watch(
			() => store.state.footerType,
			() => {
				setFooter();
			},
		);

		watch(
			() => route.name,
			() => {
				hiddenFooter.value = nonFooterMenu.indexOf((route.name ?? '') as string) > -1;

				onActiveMenu(route.name as string);
			},
		);

		onMounted(async () => {
			await router.isReady();
			isManager.value = getUserData() && getUserData().userType && getUserData().userType === UserType.MANAGER;
			if (isManager.value) remove(mainMenu, v => v === 'Location');
		});

		return { bottomMenu, activeMenu, hiddenFooter, isManager, store, handleSelectNavigation };
	},
});
</script>

<template>
	<footer v-if="!hiddenFooter" class="footer-nav flex fixed w-full bottom-0 items-center">
		<ul class="flex flex-row justify-between w-full hello" :class="{ 'max-w-[330px]': isManager, 'mx-[auto]': isManager }">
			<template v-for="(item, index) in bottomMenu" :key="index">
				<li class="footer-nav-item">
					<kp-link class="inline-flex flex-col items-center" :on-click="() => handleSelectNavigation(item)">
						<kp-image class="mb-[5px]" :src="`images/icon/ico-footer-${item.name}${activeMenu === item.name ? '-active' : ''}.svg`" />
						{{ item.label }}
					</kp-link>
				</li>
			</template>
		</ul>
	</footer>
</template>

<style scoped></style>
