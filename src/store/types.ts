import { HeaderType, PopupType, UserType } from '@src/types/types';

export interface StoreState {
	count: number;
	isLoading: boolean;
	userIdx: string;
	findUserId: string;
	findUserInfoType: string;
	authToken: string;
	resetScroll: boolean;
	selectedGroup: string | undefined;
	syncUpdateTime: Date | undefined;
	savedTermsList: Array<string>;
	headerTitle: string;
	headerState: HeaderType;
	popupType: PopupType;
	footerType: UserType;
	footerLock: boolean;
	emergencyPhone: string;
	isConnected: boolean;
	isHeartSetting: boolean;
	isTempSetting: boolean;
	isSleepSetting: boolean;
	isOxygenSetting: boolean;
	isStressSetting: boolean;
}
