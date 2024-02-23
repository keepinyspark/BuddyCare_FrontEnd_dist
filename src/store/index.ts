import { createStore } from 'vuex';
import { StoreState } from './types';
import {
	CHANGE_SELECTED_GROUP,
	RESET_SCROLL,
	SET_AUTH_TOKEN,
	SET_FIND_USER_ID,
	SET_FIND_USER_INFO_TYPE,
	SET_HEADER_TITLE,
	SET_LOADING,
	SET_POPUP,
	SET_TERMS_AGREE_LIST,
	SET_USER_IDX,
	SET_HEADER_STATE,
	SET_FOOTER_TYPE,
	SET_FOOTER_LOCK,
	SET_EMERGENCY_PHONE,
	SET_CONNECTED_STATUS,
	SET_HEART_SETTING,
	SET_TEMP_SETTING,
	SET_SLEEP_SETTING,
	SET_OXYGEN_SETTING,
	SET_STRESS_SETTING,
	SET_SYNC_UPDATE_TIME,
} from './actions';
import { HeaderType, PopupType, UserType } from '@src/types/types';

const store = createStore<StoreState>({
	state: {
		count: 0,
		isLoading: false,
		userIdx: '',
		findUserId: '',
		findUserInfoType: 'user',
		authToken: '',
		resetScroll: false,
		selectedGroup: undefined,
		savedTermsList: [],
		headerTitle: '',
		syncUpdateTime: undefined,
		popupType: PopupType.NONE,
		headerState: HeaderType.DEFAULT,
		footerType: UserType.USER,
		footerLock: false,
		emergencyPhone: '',
		isConnected: false,
		isHeartSetting: false,
		isTempSetting: false,
		isSleepSetting: false,
		isOxygenSetting: false,
		isStressSetting: false,
	},
	mutations: {
		[SET_SYNC_UPDATE_TIME](state, v) {
			state.syncUpdateTime = v;
		},
		[SET_LOADING](state, v) {
			state.isLoading = v;
		},
		[SET_AUTH_TOKEN](state, v) {
			state.authToken = v;
		},
		[RESET_SCROLL](state) {
			state.resetScroll = !state.resetScroll;
		},
		[CHANGE_SELECTED_GROUP](state, v) {
			state.selectedGroup = v;
		},
		[SET_USER_IDX](state, v) {
			state.userIdx = v;
		},
		[SET_FIND_USER_ID](state, v) {
			state.findUserId = v;
		},
		[SET_FIND_USER_INFO_TYPE](state, v) {
			state.findUserInfoType = v;
		},
		[SET_TERMS_AGREE_LIST](state, v) {
			state.savedTermsList = v;
		},
		[SET_HEADER_TITLE](state, v) {
			state.headerTitle = v;
		},
		[SET_POPUP](state, v) {
			state.popupType = v;
		},
		[SET_HEADER_STATE](state, v) {
			state.headerState = v;
		},
		[SET_FOOTER_TYPE](state, v) {
			state.footerType = v;
		},
		[SET_FOOTER_LOCK](state, v) {
			state.footerLock = v;
		},
		[SET_EMERGENCY_PHONE](state, v) {
			state.emergencyPhone = v;
		},
		[SET_CONNECTED_STATUS](state, v) {
			state.isConnected = v;
		},
		[SET_HEART_SETTING](state, v) {
			state.isHeartSetting = v;
		},
		[SET_TEMP_SETTING](state, v) {
			state.isTempSetting = v;
		},
		[SET_SLEEP_SETTING](state, v) {
			state.isSleepSetting = v;
		},
		[SET_OXYGEN_SETTING](state, v) {
			state.isOxygenSetting = v;
		},
		[SET_STRESS_SETTING](state, v) {
			state.isStressSetting = v;
		},
	},
	actions: {
		resetScroll(context) {
			context.commit(RESET_SCROLL);
		},
		changeSelectedGroup(context, v) {
			context.commit(CHANGE_SELECTED_GROUP, v);
		},
		setPopup(context, v) {
			context.commit(SET_POPUP, v);
		},
		setConnectedStatus(context, v) {
			context.commit(SET_CONNECTED_STATUS, v);
		},
	},
});

export default store;
