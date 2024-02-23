import { AxiosInstance } from 'axios';
import { CreatorDtoInterface, UserDtoInterface, UserType } from '@src/types/types';
import { STATE_REG } from '@components/Profile.vue';
import { GroupJoinRequestInterface } from '@views/settings/SettingGroup.vue';
import { getAPiFileHeader } from '@utils/api-client';

export interface GetUserInfoResult {
	data: FindUserInterface;
}

export interface FindUserInterface {
	userIdx: string;
	email: string;
	tel: string;
	userId: string;
	username: string;
	userType: UserType;
	userProfile: string | undefined;
}

export interface createGroupResult {
	data: {
		channelIdx: string;
		groupIdx: string;
		userIdx: string;
	};
}

export interface GetGroupInfoResult {
	data: {
		userList: Array<UserDtoInterface>;
		creatorList: Array<CreatorDtoInterface>;
	};
}

export interface GetEmergencyCandidateResult {
	data: {
		userList: Array<UserDtoInterface>;
	};
}

export interface GetGroupEmergencyInfoResult {
	data: {
		emergencyUserInfo: EmergencyUserInfo[];
	};
}

export interface GetGroupJoinRequestResult {
	data: {
		requestList: GroupJoinRequestInterface[];
	};
}

export interface DeleteGroupUserRequest {
	groupIdx: string;
	targetUserIdx: string;
	channelIdx: string;
}

export interface DeleteGroupUserResult {
	data: {
		groupIdx: string;
		channelIdx: string;
		userIdx: string;
		stateReg: STATE_REG;
	};
}

export interface GetGroupInfoRequest {
	groupIdx?: string;
	userIdx?: string;
	stateReg?: STATE_REG;
}

export interface GroupUserInfo {
	groupIdx: string;
	messageChannelIdx: string;
	userIdx: string;
	stateReg: STATE_REG;
	stateDel: 'Y' | 'N';
	dateReg: Date;
	dateMod: Date;
	userId: string;
	username: string;
	creatorIdx: string;
}

export interface EmergencyUserInfo {
	userIdx: string;
	dateReg: Date;
	dateMod: Date;
	stateDel: 'Y' | 'N';
	userId: string;
	userName: string;
	userProfile: string | null;
	tel?: string;
}

export interface addUserGroupResult {
	data: {
		userList: Array<UserDtoInterface>;
		creatorList: Array<CreatorDtoInterface>;
	};
}

export interface saveMessageFileResult {
	data: {
		attachFileIdx: string;
		messageSeq: number;
	};
}

/**
 * 그룹 정보 조회
 * @param client
 * @param param
 *   groupIdx: string,
 *   userIdx: string,
 * }
 */

export function getGroupInfo(client: AxiosInstance, param: any): Promise<GetGroupInfoResult> {
	const promiseFn = (fnResolve: (value: PromiseLike<GetGroupInfoResult> | GetGroupInfoResult) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/group/getGroupInfo', param)
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
 * 그룹 정보 조회
 * @param client
 * @param param
 *   groupIdx: string,
 *   userIdx: string,
 * }
 */

export function getGroupEmergencyInfo(client: AxiosInstance, param: any): Promise<GetGroupEmergencyInfoResult> {
	const promiseFn = (
		fnResolve: (value: PromiseLike<GetGroupEmergencyInfoResult> | GetGroupEmergencyInfoResult) => void,
		fnReject: (reason?: any) => void,
	) => {
		client
			.post('/api/1/group/getGroupEmergencyInfo', param)
			.then(res => {
				if (res.data.resultCode !== 0) {
					fnReject('msg.' + res.data.resultMsg);
				} else {
					fnResolve({ data: res.data.data });
				}
			})
			.catch(err => {
				fnReject('msg.RESULT_FAILED');
			});
	};
	return new Promise(promiseFn);
}

/**
 * 그룹 사용자 상태 변경
 * @param client
 * @param param
 *   groupIdx: string,
 *   userIdx: string,
 * }
 */
export function deleteGroupUser(client: AxiosInstance, param: DeleteGroupUserRequest): Promise<DeleteGroupUserResult> {
	const promiseFn = (fnResolve: (value: PromiseLike<DeleteGroupUserResult> | DeleteGroupUserResult) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/group/deleteGroupUser', param)
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
 * 그룹 사용자 아이디 조회
 * @param client
 * @param param
 *   groupIdx: string,
 *   userIdx: string,
 * }
 */
export function getUserInfoById(client: AxiosInstance, param: { userId: string; userIdx: string }): Promise<GetUserInfoResult> {
	const promiseFn = (fnResolve: (value: PromiseLike<GetUserInfoResult> | GetUserInfoResult) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/users/getUserInfoById', param)
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
 * 그룹 사용자 추가
 * @param client
 * @param param
 *   groupIdx: string,
 *   userIdx: string,
 * }
 */
export function addUserGroup(client: AxiosInstance, param: { userIdx: string }): Promise<addUserGroupResult> {
	const promiseFn = (fnResolve: (value: PromiseLike<addUserGroupResult> | addUserGroupResult) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/group/insertUserGroupInfo', param)
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
 * 그룹 비상 연락 대상 변경
 * @param client
 * @param param
 *   groupIdx: string,
 *   userIdx: string,
 *   emergencyTargetUserIdx,
 * }
 */
export function updateEmergencyTargetUser(
	client: AxiosInstance,
	param: { emergencyTargetUserIdx: string; groupIdx: string },
): Promise<{
	data: {
		groupIdx: string;
		emergencyTargetUserIdx: string;
	};
}> {
	const promiseFn = (fnResolve: (value: PromiseLike<any> | any) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/group/updateEmergencyTargetUser', param)
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
 * 그룹 정보 조회
 * @param client
 * @param param
 *   groupIdx: string,
 *   userIdx: string,
 * }
 */

export function getGroupRequestInfo(client: AxiosInstance, param: any): Promise<GetGroupJoinRequestResult> {
	const promiseFn = (
		fnResolve: (value: PromiseLike<GetGroupJoinRequestResult> | GetGroupJoinRequestResult) => void,
		fnReject: (reason?: any) => void,
	) => {
		client
			.post('/api/1/group/getGroupRequestInfo', param)
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
 * 그룹 사용자 참여 상태 변경
 * @param client
 * @param param
 *   groupIdx: string,
 *   userIdx: string,
 * }
 */
export function updateUserGroupJoinState(client: AxiosInstance, param: any): Promise<GetGroupJoinRequestResult> {
	const promiseFn = (
		fnResolve: (value: PromiseLike<GetGroupJoinRequestResult> | GetGroupJoinRequestResult) => void,
		fnReject: (reason?: any) => void,
	) => {
		client
			.post('/api/1/group/updateUserGroupJoin', param)
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
 * 그룹 생성
 * @param client
 * @param param
 *   groupIdx: string,
 *   userIdx: string,
 * }
 */

export function createGroup(client: AxiosInstance, param: any): Promise<createGroupResult> {
	const promiseFn = (fnResolve: (value: PromiseLike<createGroupResult> | createGroupResult) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/group/createUserGroupInfo', param)
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
 * 긴급 통화 변경 대상 목록 조회
 * @param client
 * @param param
 *   groupIdx: string,
 *   userIdx: string,
 * }
 */

export function getEmergencyCandidateList(client: AxiosInstance, param: any): Promise<GetEmergencyCandidateResult> {
	const promiseFn = (
		fnResolve: (value: PromiseLike<GetEmergencyCandidateResult> | GetEmergencyCandidateResult) => void,
		fnReject: (reason?: any) => void,
	) => {
		client
			.post('/api/1/group/getGroupEmergencyCandidateList', param)
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
 * 파일 메세지 저장
 * @param client
 * @param param
 * }
 */

export function saveMessageFile(client: AxiosInstance, param: any): Promise<saveMessageFileResult> {
	const promiseFn = (fnResolve: (value: PromiseLike<saveMessageFileResult> | saveMessageFileResult) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/message/saveMessageFile', param, getAPiFileHeader())
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
 * 푸쉬 알림 전송
 * @param client
 * @param param
 * }
 */

export function sendPushNotice(
	client: AxiosInstance,
	param: {
		onlineUserList: string[];
		messageInfo: {
			messageChannelIdx: string;
			username: string;
			messageBody: string;
			messageType: string;
			fileInfo: string | null;
		};
	},
): Promise<any> {
	const promiseFn = (fnResolve: (value: PromiseLike<any> | any) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/common/push-notice', param)
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

export function sendPushNoticeAlone(
	client: AxiosInstance,
	param: {
		targetUserIdx: string;
	},
): Promise<any> {
	const promiseFn = (fnResolve: (value: PromiseLike<any> | any) => void, fnReject: (reason?: any) => void) => {
		client
			.post('/api/1/common/push-notice-alone', param)
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
