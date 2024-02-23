import { GroupCreatorInterface } from '@utils/group/dto/group';
import { STATE_REG } from '@components/Profile.vue';
import { ChatMessageResponse, ChatUserResponse } from '@utils/group/api/group-api';

export interface TermsInterface {
	types: string;
	title: string;
	body: string;
}

export interface StatusCodeInterface {
	[code: string]: number;
}

export interface UserInfoInterface {
	userName: string;
	userId: string;
	pwd: string;
	validatePwd: string;
	phone: string;
	email: string;
}

export interface LoginUserInfoInterface {
	email: string;
	tel: string;
	token: string;
	userId: string;
	userIdx: string;
	userName: string;
	userType: string;
	deviceName?: string;
	deviceIdx?: string;
}

export enum UserType {
	USER = 'USER',
	USER_DEVICE = 'USER_DEVICE',
	MANAGER = 'MANAGER',
	ADMIN = 'ADMIN',
}

export enum MessageType {
	TEXT = 'TEXT',
	VIDEO = 'VIDEO',
	IMAGE = 'IMAGE',
	EMERGENCY = 'EMERGENCY',
	EMERGENCY_ALARM = 'EMERGENCY_ALARM',
	EMERGENCY_VIDEO = 'EMERGENCY_VIDEO',
	EMERGENCY_IMAGE = 'EMERGENCY_IMAGE',
	ERROR = 'ERROR',
	ENTER = 'ENTER',
	LEAVE = 'LEAVE',
}

export enum ErrorType {
	EXCEPTION = 'EXCEPTION',
}

export enum HeaderType {
	DEFAULT = 'DEFAULT',
	BACK_MENU = 'BACK_MENU',
}

export enum PopupType {
	NONE = 'none',
	GROUP_FIND_USER = 'groupFindUser',
	GROUP_EMERGENCY_CHANGE = 'groupEmergencyChange',
	CHAT_USERS = 'chatUsers',
	GROUP_USERS = 'groupUsers',
	GROUP_STATE_MANAGE = 'groupStateManage',
	WATCHFACE = 'watchface',
	DISTURB = 'disturb',
}

export interface UserLoginInputInterface {
	userId: string;
	pwd: string;
	maintain: boolean;
}

export interface CreateChannelResp {
	creatorIdx: string;
	channelToken: string;
	channelIdx: string;
	lastAccessDate: Date;
	dateMod: Date;
	dateReg: Date;
	messageChannelIdx: string;
	stateDel: 'N' | 'Y';
	groupIdx: string;
	creatorInfo: GroupCreatorInterface;
}

export interface InitCompleteResp {
	channelIdx: string;
	channelToken: string;
	groupIdx: string;
	emergencyTargetUserIdx: string | null;
	creatorInfo: GroupCreatorInterface;
}

export interface UserDtoInterface {
	userIdx: string;
	userId: string;
	username: string;
	userProfile: string | undefined;
	groupIdx: string;
	messageChannelIdx: string;
	stateReg: STATE_REG;
}

export interface CreatorDtoInterface {
	groupIdx: string;
	creatorIdx: string;
	creatorId: string;
	creatorName: string;
	creatorProfile: string | undefined;
	messageChannelIdx: string;
	stateReg: STATE_REG;
}

export interface EnterChannelResponse {
	userIdx: string;
	channelIdx: string;
	groupIdx: string;
	channelDateReg: Date;
	channelDateMod: Date;
	emergencyTargetUserIdx: string | null;
	channelToken: string;
	messageList: ChatMessageResponse[];
	totalCount: number;
	userList: ChatUserResponse[];
	creatorInfo: GroupCreatorInterface;
}

export interface DeviceInterface {
	deviceName: string;
	macAddress: string;
}

export type ChartDataTypes = 'working' | 'heart-rate' | 'temperature' | 'blood-pressure' | 'sleep' | 'oxygen' | 'stress';

export enum AndroidEventType {
	GET_TOKEN = 'GET_TOKEN',
	GET_DEVICE_LIST = 'GET_DEVICE_LIST',
	GET_DEVICE_CONNECT_STATE = 'GET_DEVICE_CONNECT_STATE', // 기기 연결 시도의 콜백
	GET_DEVICE_CONNECTING = 'GET_DEVICE_CONNECTING', // 현재 기기 연결의 콜백
	GET_DEVICE_BIND_STATE = 'GET_DEVICE_BIND_STATE',
	GET_DEVICE_INFO = 'GET_DEVICE_INFO',
	SYNC_DATA = 'SYNC_DATA',
	GET_HAND = 'GET_HAND',
	GET_SHAKE = 'GET_SHAKE',
	DISCONNECT_DEVICE = 'DISCONNECT_DEVICE',
	GET_LOCATION = 'GET_LOCATION',
	INSERT_LOCATION = 'INSERT_LOCATION',
	GET_DISTURB_MODE = 'GET_DISTURB_MODE',
	SYNC_WATCH_FACE = 'SYNC_WATCH_FACE',
	GET_ALARM = 'GET_ALARM',
	MESSAGE_TYPE = 'MESSAGE_TYPE',
	HEART_SETTING_CALLBACK = 'HEART_SETTING_CALLBACK',
	TEMP_SETTING_CALLBACK = 'TEMP_SETTING_CALLBACK',
	SLEEP_SETTING_CALLBACK = 'SLEEP_SETTING_CALLBACK',
	OXYGEN_SETTING_CALLBACK = 'OXYGEN_SETTING_CALLBACK',
	STRESS_SETTING_CALLBACK = 'STRESS_SETTING_CALLBACK',
	UPGRADE_FIRMWARE_CALLBACK = 'UPGRADE_FIRMWARE_CALLBACK',
	GET_WEATHER = 'GET_WEATHER',
}

export enum DeviceConnectStateType {
	SUCCESS = 'success_connect',
	FAILED = 'failed_connect',
	DISCONNECTED = 'disconnected',
	SUCCESS_BIND = 'success_bind',
	FAILED_BIND = 'failed_bind',
	CONNECTED = 'connected',
	NOTCONNECTED = 'not-connected',
}

export enum DeviceAlarmType {
	ALERT_HIGH_HEART_RATE = 'ALERT_HIGH_HEART_RATE',
	ALERT_LOW_HEART_RATE = 'ALERT_LOW_HEART_RATE',
	ALERT_HIGH_OXYGEN = 'ALERT_HIGH_OXYGEN',
	ALERT_LOW_OXYGEN = 'ALERT_LOW_OXYGEN',
	ALERT_HIGH_TEMPERATURE = 'ALERT_HIGH_TEMPERATURE',
	ALERT_LOW_TEMPERATURE = 'ALERT_LOW_TEMPERATURE',
	ALERT_HIGH_BLOOD_PRESSURE = 'ALERT_HIGH_BLOOD_PRESSURE',
	ALERT_LOW_BLOOD_PRESSURE = 'ALERT_LOW_BLOOD_PRESSURE',
	ALERT_FIND_PHONE_EVENT = 'FIND_PHONE_EVENT',
	ALERT_BATTERY_EVENT = 'BATTERY_EVENT',
	ALERT_EMERGENCY_CALL = 'ALERT_EMERGENCY_CALL',
}
