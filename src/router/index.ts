import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
/**
 * 회원가입
 */
import Login from '@views/login/Login.vue';
import Terms from '@views/login/Terms.vue';
import Join from '@views/login/Join.vue';
import FindUserInfo from '@views/login/FindUserInfo.vue';
import Success from '@views/login/Success.vue';
import UserType from '@views/login/UserType.vue';
import FindUserId from '@views/login/FindUserId.vue';
import FindUserPassword from '@views/login/FindUserPassword.vue';

/**
 * 메인
 */
import DashBoard from '@views/Main/DashBoard.vue';
import DashBoardDevice from '@views/Main/DashBoardDevice.vue';
import DashBoardUser from '@views/Main/DashBoardUser.vue';
import DashBoardManager from '@views/Main/DashBoardManager.vue';

/**
 * 기기
 */
import DeviceConnect from '@views/login/DeviceConnect.vue';
import DeviceMenu from '@views/device/DeviceMenu.vue';
import DeviceWatchface from '@views/device/DeviceWatchface.vue';
import DeviceUpdateCycle from '@views/device/DeviceUpdateCycle.vue';
import DeviceNotDisturb from '@views/device/DeviceNotDisturb.vue';
import DeviceFirmwareUpdate from '@views/device/DeviceFirmwareUpdate.vue';

/**
 * 건강
 */
import HealthView from '@views/health/HealthView.vue';

/**
 * 채팅
 */
import ChatList from '@views/chat/ChatList.vue';
import ChatDetail from '@views/chat/ChatDetail.vue';

/**
 * 셋팅
 */
import SettingMenu from '@views/settings/SettingMenu.vue';
import SettingGroup from '@views/settings/SettingGroup.vue';
import SettingTarget from '@views/settings/SettingTarget.vue';
import SettingAlarm from '@views/settings/SettingAlarm.vue';

/**
 * 지도
 */
import LocationView from '@views/Main/LocationView.vue';
import MapView from '@views/Main/LocationView.vue';

/**
 * 개인정보
 */
import PrivateInfo from '@views/settings/PrivateInfo.vue';
import ResetPassword from '@views/login/ResetPassword.vue';

import Downloads from '@views/Downloads.vue';

//////

const routes = [
	{
		path: '/login',
		name: 'Login',
		component: Login,
	},
	{
		path: '/login/terms',
		name: 'Terms',
		component: Terms,
	},
	{
		path: '/login/join',
		name: 'Join',
		component: Join,
	},
	{
		path: '/login/success/:type',
		name: 'Success',
		component: Success,
	},
	{
		path: '/find',
		name: 'FindUserInfo',
		component: FindUserInfo,
	},
	{
		path: '/id-find',
		name: 'FindUserId',
		component: FindUserId,
	},
	{
		path: '/password-find',
		name: 'FindUserPassword',
		component: FindUserPassword,
	},
	{
		path: '/private',
		name: 'PrivateInfo',
		component: PrivateInfo,
	},
	{
		path: '/user-type',
		name: 'UserType',
		component: UserType,
	},
	{
		path: '/reset-pwd',
		name: 'ResetPassword',
		component: ResetPassword,
	},
	{
		path: '/device-connect',
		name: 'DeviceConnect',
		component: DeviceConnect,
	},
	{
		path: '/',
		name: 'Dashboard',
		component: DashBoard,
	},
	{
		path: '/main-device',
		name: 'DashboardDeviceUser',
		component: DashBoardDevice,
	},
	{
		path: '/main-user',
		name: 'DashboardUser',
		component: DashBoardUser,
	},
	{
		path: '/main-manager',
		name: 'DashboardManager',
		component: DashBoardManager,
	},
	{
		path: '/chat-list',
		name: 'ChatList',
		component: ChatList,
	},
	{
		path: '/chat-room/:id',
		name: 'ChatDetail',
		component: ChatDetail,
	},
	{
		path: '/setting',
		name: 'SettingMenu',
		component: SettingMenu,
	},
	{
		path: '/setting/group',
		name: 'SettingGroup',
		component: SettingGroup,
	},
	{
		path: '/setting/target',
		name: 'SettingTarget',
		component: SettingTarget,
	},
	{
		path: '/setting/alarm',
		name: 'SettingAlarm',
		component: SettingAlarm,
	},
	{
		path: '/location',
		name: 'Location',
		component: LocationView,
	},
	{
		path: '/map',
		name: 'Map',
		component: MapView,
	},
	{
		path: '/health',
		name: 'Health',
		component: HealthView,
	},
	{
		path: '/health/:type',
		name: 'Health Detail',
		component: HealthView,
	},
	{
		path: '/device',
		name: 'DeviceMenu',
		component: DeviceMenu,
	},
	{
		path: '/device/watchface',
		name: 'DeviceWatchface',
		component: DeviceWatchface,
	},
	{
		path: '/device/update-cycle',
		name: 'DeviceUpdateCycle',
		component: DeviceUpdateCycle,
	},
	{
		path: '/device/not-disturb',
		name: 'DeviceNotDisturb',
		component: DeviceNotDisturb,
	},
	{
		path: '/device/firmware-update',
		name: 'DeviceFirmwareUpdate',
		component: DeviceFirmwareUpdate,
	},
	{
		path: '/downloads/',
		name: 'Downloads',
		component: Downloads,
	},
];
const router = createRouter({
	history: createWebHistory(),
	routes,
	scrollBehavior() {
		document.getElementById('app')?.scrollIntoView({ behavior: 'auto' });
	},
});

router.beforeEach((to, from, next) => {
	// hash값 대응 redirect
	if (to.fullPath.indexOf('#/') > 0) {
		next({ path: to.fullPath.replace('#/', '') });
	} else {
		next();
	}

	if (to.fullPath.indexOf('downloads') > 0) {
		next({ path: to.fullPath.replace('downloads/', 'downloads') });
	} else {
		next();
	}
});

export default router;
