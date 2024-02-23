import { AxiosInstance } from 'axios';
import { MessageType, UserType } from '@src/types/types';
import { GroupCreatorInterface } from '@utils/group/dto/group';

export interface GetChannelInfoResult {
	data: {
		messageList: ChatMessageResponse[];
		userList: ChatUserResponse[];
		totalCount: number;
	};
}

export interface GetGroupInfoResult {
	data: {
		channelIdx: string;
		channelToken: string;
		groupIdx: string;
		emergencyTargetUserIdx: string | null;
		creatorInfo: GroupCreatorInterface;
	};
}

export interface GetMessageListResult {
	data: ChatMessageResponse[];
	totalCount: number;
}

export interface ChatMessageResponse {
	messageSeq: number;
	messageChannelIdx: string;
	messageBody: string;
	messageType: MessageType;
	isActive: boolean;
	dateReg: Date;
	dateMod: Date;
	userIdx: string;
	userId: string;
	username: string;
	tempUuid: string;
	userType: UserType;
	readCount?: number;
	fileInfo?: string;
	userProfile?: string;
}

export interface ChatUserResponse {
	userIdx: string;
	userId: string;
	username: string;
	userType: UserType;
	messageChannelIdx: string;
	stateDel: string;
	userProfile: string | undefined;
	isActive: boolean;
	lastAccessDate: Date;
	dateReg: Date;
	dateMod: Date;
	channelDateReg: Date;
	channelDateMod: Date;
	groupIdx: string;
	emergencyTargetUserIdx: string;
	managerIdx?: string;
}

/**
 * 채널 정보 조회
 * @param client
 * @param {
 *   messageChannelIdx: string,
 *   messageIdx: string,
 *   userIdx: string,
 *   pagingRow: number,
 *   page: number,
 * }
 */

export function getChannelInfo(client: AxiosInstance, param: any): Promise<GetChannelInfoResult> {
	const promiseFn = (fnResolve: (value: PromiseLike<GetChannelInfoResult> | GetChannelInfoResult) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/message/getChannelInfo', param)
			.then(res => {
				if (res.data.resultCode !== 0) {
					console.error(res);
					fnReject('msg.' + res.data.resultMsg);
				} else {
					fnResolve({ data: res.data.data });
				}
			})
			.catch(err => {
				console.error(err);
				fnReject('msg.RESULT_FAILED');
			});
	};
	return new Promise(promiseFn);
}

/**
 * 메세지 목록 조회
 * @param client
 * @param {
 *   messageChannelIdx: string,
 *   messageIdx: string,
 *   pagingRow: number,
 *   page: number,
 *   key: number,
 * }
 */

export function getMessageList(client: AxiosInstance, param: any): Promise<GetMessageListResult> {
	const promiseFn = (fnResolve: (value: PromiseLike<GetMessageListResult> | GetMessageListResult) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/message/getMessageList', param)
			.then(res => {
				if (res.data.resultCode !== 0) {
					console.error(res);
					fnReject('msg.' + res.data.resultMsg);
				} else {
					fnResolve({ data: res.data.data, totalCount: res.data.totalCount ?? 0 });
				}
			})
			.catch(err => {
				console.error(err);
				fnReject('msg.RESULT_FAILED');
			});
	};
	return new Promise(promiseFn);
}

/**
 * 그룹 정보 조회
 * @param client
 * @param {
 *   stateReg: string,
 * }
 */
let cachedGroupList: GetGroupInfoResult[] = [];
export function getGroupList(client: AxiosInstance, param: any): Promise<GetGroupInfoResult> {
	const promiseFn = (fnResolve: (value: PromiseLike<GetGroupInfoResult> | GetGroupInfoResult) => void, fnReject: (reason?: any) => void) => {
		if (!param.noCache && cachedGroupList.length > 0) {
			fnResolve({ data: cachedGroupList } as any as GetGroupInfoResult);
			return;
		}
		client
			.post('/api/1/message/getGroupList', param)
			.then(res => {
				if (res.data.resultCode !== 0) {
					console.error(res);
					fnReject('msg.' + res.data.resultMsg);
				} else {
					cachedGroupList = res.data.data;
					fnResolve({ data: res.data.data });
				}
			})
			.catch(err => {
				console.error(err);
				fnReject('msg.RESULT_FAILED');
			});
	};
	return new Promise(promiseFn);
}
export function clearGroupListCache() {
	cachedGroupList = [];
}
