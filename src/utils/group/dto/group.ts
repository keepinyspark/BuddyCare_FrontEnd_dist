import { CHAT_OBJECT_TYPE } from '@utils/group/chat-utils';
import { ChatMessageResponse, ChatUserResponse, getChannelInfo, GetChannelInfoResult } from '@utils/group/api/group-api';
import { getApiClient } from '@utils/api-client';
import { MessageType } from '@src/types/types';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import { getGroupManager } from '@utils/group/group-instance';
import { getUserData } from '@utils/common-utils';
import { findIndex, remove } from 'lodash';

export const MAX_MESSAGE_SEQ = 9999999999;

export interface ChatUserInterface {
	type: CHAT_OBJECT_TYPE;
	userIdx: string;
	username: string;
	channelIdx: string;
	userId: string | undefined;
	userProfile: string | undefined;
	isActive: boolean;
	lastAccessDate: Date;
}

export interface ChatMessageInterface {
	type: CHAT_OBJECT_TYPE;
	messageSeq: number;
	messageType: MessageType;
	userIdx: string;
	userId: string;
	username: string;
	messageBody: string;
	isActive: boolean;
	dateReg: Date;
	dateMod: Date;
	readCount: number;
	totalCount: number;
	isDayFirstMsg?: boolean; // 날짜별 첫번째 메세지 여부
	parentSeq?: number | undefined; // 메세지 그룹별 첫번째 메세지 시퀀스
	isLastChild?: boolean | undefined; // 메세지 그룹별 마지막 메세지 여부
	changeSender?: boolean | undefined; // 메세지 송신자 바뀜 여부
	tempUuid?: string; // 임시 uuid
	fileInfo?: string | undefined;
	userProfile: string | undefined;
}

export interface GroupCreatorInterface {
	userIdx: string;
	username: string;
	userId: string;
	userProfile: string | undefined;
	deviceIdx: string | undefined;
	email: string;
	tel: string;
	dateReg: Date;
}

export enum ChatChannelEvent {
	INITIALIZE_COMPLETE = 'initializeComplete',
}

export class Group extends EventTarget {
	private readonly _type: CHAT_OBJECT_TYPE;
	private readonly _channelIdx: string;
	private readonly _groupIdx: string;
	private _creatorInfo: GroupCreatorInterface | undefined; // 돌봄 그룹 생성자 정보
	private _channelToken: string | undefined;
	private _userList: Array<ChatUserInterface>; // 돌봄 그룹 참여자 목록
	private _messageList: Array<ChatMessageInterface>; // 돌봄 그룹 메세지 목록
	private _dateReg: Date | undefined; // 채널 생성일자
	private _dateMod: Date | undefined; // 채널 수정일자
	private _isDelete: boolean;
	private _pagingKey: number;
	private _totalCount: number; // 메세지 전체 갯수
	private _emergencyTargetUserIdx: string | null; // 긴급 통화 연결 대상 idx
	private _emergencyState: boolean; // 돌봄 그룹 긴급 상태

	constructor(channelIdx: string, channelToken: string, groupIdx: string, creatorInfo: GroupCreatorInterface) {
		super();
		this._type = CHAT_OBJECT_TYPE.CHANNEL;
		this._creatorInfo = creatorInfo;
		this._channelIdx = channelIdx;
		this._channelToken = channelToken;
		this._groupIdx = groupIdx;
		this._emergencyTargetUserIdx = null;
		this._userList = [];
		this._messageList = [];
		this._isDelete = false;
		this._pagingKey = 0;
		this._totalCount = 0;
		this._emergencyState = false;
	}

	/**
	 * 그룹의 정보를 셋팅할 때 호출하는 메서드
	 */
	doLoadData() {
		const param = {
			messageChannelIdx: this._channelIdx,
		};

		// call Api
		getChannelInfo(getApiClient(), param)
			.then(res => {
				this.setChannelInfo(res);
				this.doLoadUserList(res.data.userList ?? []);
				this.doLoadMessageList(res.data.messageList ?? []);
				this._totalCount = res.data.totalCount;
				this.checkEmergencyState();

				this.dispatchEvent(new CustomEvent(ChatChannelEvent.INITIALIZE_COMPLETE, { detail: this._channelIdx }));
			})
			.catch(e => console.log(e));
	}

	/**
	 * @private
	 * 채널 정보를 셋팅할 때 사용하는 메서드
	 */
	private setChannelInfo(dt: GetChannelInfoResult): void {
		if (dt.data.userList.length < 1) return;
		const channelInfo = dt.data.userList[0];
		this.dateMod = channelInfo.channelDateMod;
		this.dateReg = channelInfo.channelDateReg;
	}

	toUserDto(data: ChatUserResponse): ChatUserInterface {
		return <ChatUserInterface>{
			type: CHAT_OBJECT_TYPE.USER,
			userIdx: data.userIdx,
			channelIdx: data.messageChannelIdx,
			userId: data.userId,
			username: data.username,
			userProfile: data.userProfile ?? undefined,
			isActive: data.isActive ?? false,
			lastAccessDate: new Date(data.lastAccessDate),
		};
	}

	toMessageDto(data: ChatMessageResponse): ChatMessageInterface {
		return <ChatMessageInterface>{
			type: CHAT_OBJECT_TYPE.MESSAGE,
			messageSeq: data.messageSeq,
			userIdx: data.userIdx,
			userId: data.userId,
			username: data.username,
			messageType: data.messageType as MessageType,
			messageBody: data.messageBody,
			isActive: data.isActive ?? true,
			dateReg: new Date(data.dateReg),
			dateMod: new Date(data.dateMod),
			readCount: this._userList.length,
			fileInfo: data.fileInfo ?? undefined,
			userProfile: data.userProfile ?? undefined,
		};
	}

	/**
	 * @private
	 * 메세지 리스트를 dto로 변환할때 사용하는 메서드
	 */
	getCastedMessageList(list: ChatMessageResponse[]): ChatMessageInterface[] {
		const result = [];

		for (const resMsg of list) {
			result.push(this.toMessageDto(resMsg));
		}

		return result;
	}

	addUser(dt: any): void {}

	/**
	 * 돌봄 그룹에서 사용자를 제거할 때 사용하는 메서드
	 */
	removeUser(userIdx: string) {
		remove(this._userList, v => v.userIdx === userIdx);
		if (this.channelIdx === getGroupManager().currentChannelIdx)
			getGroupManager().dispatchEvent(
				new CustomEvent(GroupManagerEvent.REMOVE_USER, {
					detail: {
						channelIdx: this.channelIdx,
						userIdx: userIdx,
					},
				}),
			);
	}

	/**
	 * @param getMessageList
	 * 메세지 정보를 업데이트 할때 사용하는 메서드
	 */
	updateMessageList(getMessageList: ChatMessageResponse[]) {
		const newMessageList = [];
		if (this.messageList.length > 0) {
			const lastMessageDate = new Date(this.messageList[this.messageList.length - 1].dateReg);
			for (const getMessage of getMessageList ?? []) {
				if (new Date(getMessage.dateReg) > lastMessageDate) {
					newMessageList.push(getMessage);
				}
			}
			this.addMessage(newMessageList, true);
		} else {
			this.addMessage(getMessageList ?? [], true);
		}
	}

	/**
	 * 임시 메세지를 미리 생성하는 메서드
	 */
	addUnloadMessage(dt: { messageBody: string | File; messageType: MessageType; tempUuid: string }, noEvent?: boolean): void {
		const defaultMessage = this.createDefaultMessage();
		defaultMessage.messageType = dt.messageType;
		defaultMessage.messageBody = dt.messageBody instanceof File ? '' : dt.messageBody;
		defaultMessage.tempUuid = dt.tempUuid;

		const msgLength = this._messageList.length;
		if (msgLength) defaultMessage.messageSeq = Number(this._messageList[msgLength - 1].messageSeq + MAX_MESSAGE_SEQ);

		this._messageList.push(defaultMessage);

		// if (!noEvent) this.dispatchEvent(new Event(ChatChannelEvent.UPDATE));
	}

	/**
	 * 메세지 객체를 만드는 메서드
	 */
	createDefaultMessage(): ChatMessageInterface {
		return {
			type: CHAT_OBJECT_TYPE.MESSAGE,
			messageSeq: MAX_MESSAGE_SEQ,
			messageType: MessageType.TEXT,
			userIdx: getUserData().userIdx,
			userId: getUserData().userId,
			username: getUserData().username,
			userProfile: undefined,
			messageBody: '',
			isActive: true,
			dateReg: new Date(),
			dateMod: new Date(),
			readCount: this._userList.length - 1,
			totalCount: 0,
		};
	}

	/**
	 * 돌봄 그룹에 메세지를 넣을 때 사용하는 메서드
	 */
	setMessageList(msgList: ChatMessageInterface[], noEvent: boolean) {
		this._messageList = msgList;
		this._messageList.sort((prev, next) => {
			return prev.dateReg > next.dateReg ? 1 : -1;
		});

		if (!noEvent) getGroupManager().dispatchEvent(new CustomEvent(GroupManagerEvent.MESSAGE_RECEIVED, { detail: this._channelIdx }));
	}

	clearData(): void {
		this._userList = [];
		this._messageList = [];
	}

	/**
	 * 초기 메세지 정보를 셋팅할 때 호출하는 메서드
	 */
	doLoadMessageList(msgList: ChatMessageResponse[]): void {
		if (msgList.length < 1) return;
		for (let i = msgList.length - 1; i >= 0; i--) {
			this._messageList.push(this.toMessageDto(msgList[i]));
		}
		this.increasePagingKey();
	}

	increasePagingKey(): void {
		this._pagingKey++;
	}

	decreasePagingKey(): void {
		this._pagingKey--;
	}

	/**
	 * @param userList
	 * 초기 유저정보를 셋팅할 때 호출하는 메서드
	 */
	doLoadUserList(userList: ChatUserResponse[]): void {
		if (userList.length < 1) return;
		for (const user of userList) {
			this._userList.push(this.toUserDto(user));
		}
	}

	/**
	 * @param list
	 * @param date
	 * 돌봄 그룹 사용자 목록을 업데이트 할 때 사용하는 메서드
	 */
	updateUserList(list: string[], date: Date): void {
		this.clearUserActive();

		for (const user of this._userList) {
			for (const li of list) {
				if (user.userIdx === li) {
					user.isActive = true;
					user.lastAccessDate = new Date(date);
				}
			}
		}
	}

	/**
	 * @param userIdx
	 * @param date
	 * 사용자 접속 상태를 업데이트 하는 메서드
	 */
	updateUserOnlineState(userIdx: string, date: Date): void {
		for (const user of this._userList) {
			if (userIdx === user.userIdx) {
				user.isActive = true;
				user.lastAccessDate = new Date(date);
			}
		}
	}

	/**
	 * 읽음 표시 업데이트
	 */
	calculateReadCount(): void {
		const totalUserCount = this._userList.length;

		try {
			const messageSize = this.messageList.length;
			if (messageSize < 1 || !this.messageList[0].dateReg) return;

			for (let i = 0; i < messageSize; i++) {
				let maxReadCount = totalUserCount;
				const message = this._messageList[i];
				if (message.dateReg) {
					for (let j = 0; j < totalUserCount; j++) {
						const user = this._userList[j];

						if (message.dateReg <= user.lastAccessDate) {
							message.readCount = message.readCount > 0 ? maxReadCount - 1 : 0;
							maxReadCount--;
						}
					}
				}
			}
		} catch (e) {
			console.log('e', e);
		}

		getGroupManager().dispatchEvent(new CustomEvent(GroupManagerEvent.UPDATE, { detail: this.channelIdx }));
	}

	/**
	 * 채팅방 날짜 표시 생성
	 */
	makeDayPartition(): void {
		const msgList = this.messageList;
		if (msgList.length < 1 || !msgList[0].dateReg) return;
		// clear
		msgList.forEach(v => (v.isDayFirstMsg = false));

		if (Number(this._totalCount) === Number(msgList.length)) this._messageList[0].isDayFirstMsg = true;

		let prevDate = msgList[0].dateReg.getDate();
		for (let i = 0; i < msgList.length; i++) {
			const msgDate = msgList[i].dateReg.getDate();
			if (prevDate !== msgDate) {
				prevDate = msgDate;
				msgList[i].isDayFirstMsg = true;
			}
		}
		getGroupManager().dispatchEvent(new CustomEvent(GroupManagerEvent.UPDATE, { detail: this.channelIdx }));
	}

	/**
	 * 시간 별 메세지 그룹핑을 만드는 메서드
	 */
	makeDecorationMarker(): void {
		const blackListType = [MessageType.ENTER, MessageType.LEAVE];
		const messageList = this.messageList;

		if (messageList && messageList.length > 0) {
			for (let i = 0; i < messageList.length; i++) {
				if (i === 0) {
					messageList[i].parentSeq = undefined;
					messageList[i].isLastChild = true;
				} else {
					messageList[i].parentSeq = undefined;
					const previousMsg = messageList[i - 1];
					const currentMsg = messageList[i];
					currentMsg.isLastChild = true;

					if (blackListType.indexOf(currentMsg.messageType) < 0 && blackListType.indexOf(previousMsg.messageType) < 0) {
						// 메세지 + 메세지
						if (currentMsg.dateReg && previousMsg.dateReg) {
							if (currentMsg.userIdx === previousMsg.userIdx) {
								const curStringDate = currentMsg.dateReg.toString();
								const curYearToHour = curStringDate.split(':')[0];
								const curMinute = curStringDate.split(':')[1];

								const prevStringDate = previousMsg.dateReg.toString();
								const prevYearToHour = prevStringDate.split(':')[0];
								const prevMinute = prevStringDate.split(':')[1];
								if (curYearToHour === prevYearToHour && curMinute === prevMinute) {
									previousMsg.isLastChild = false;
									currentMsg.isLastChild = true;
									if (previousMsg.parentSeq) {
										currentMsg.parentSeq = previousMsg.parentSeq;
									} else {
										currentMsg.parentSeq = previousMsg.messageSeq;
									}
								}
							} else {
								currentMsg.changeSender = true;
							}
						}
					} else if (blackListType.indexOf(currentMsg.messageType) < 0 && blackListType.indexOf(previousMsg.messageType) > -1) {
						// 참가 + 메세지
						currentMsg.changeSender = true;
					} else if (blackListType.indexOf(currentMsg.messageType) > -1 && blackListType.indexOf(previousMsg.messageType) < 0) {
						// 메세지 + 참가
						previousMsg.isLastChild = true;
						currentMsg.changeSender = true;
					} else {
					}
				}
			}
		}
	}

	/**
	 * @private
	 * 가장 최근 사용자 메세지를 가져오는 메서드
	 */
	getLastMessage(): ChatMessageInterface | undefined {
		const size = this.messageList.length;
		const commonMessageTypeList = [
			MessageType.TEXT,
			MessageType.IMAGE,
			MessageType.VIDEO,
			MessageType.EMERGENCY,
			MessageType.EMERGENCY_ALARM,
			MessageType.EMERGENCY_IMAGE,
			MessageType.EMERGENCY_VIDEO,
		];
		for (let i = size - 1; i >= 0; i--) {
			if (commonMessageTypeList.includes(this.messageList[i].messageType)) return this.messageList[i];
		}

		return size > 0 ? this.messageList[size - 1] : undefined;
	}

	/**
	 * 채팅방에 읽지 않은 메세지를 확인하는 메서드
	 */
	isUpdated(): boolean {
		const lastMsg = this.getLastMessage();
		if (lastMsg && lastMsg.dateReg) {
			if (lastMsg.userIdx === getUserData().userIdx) return false;
			const myLastAccess = this.getMyLastAccessDate();
			if (myLastAccess) return lastMsg.dateReg > myLastAccess;
		}

		return false;
	}

	/**
	 * 사용자 접속 정보 초기화
	 */
	clearUserActive(): void {
		for (const user of this._userList) {
			user.isActive = false;
		}
	}

	/**
	 * @param msgList
	 * @param noEvent
	 * 메세지를 추가하는 메서드
	 */
	addMessage(msgList: ChatMessageResponse[], noEvent = false): void {
		for (const msg of msgList) {
			const newMessage = this.toMessageDto(msg);

			if (newMessage.userIdx === getUserData().userIdx) {
				if (newMessage.messageType === MessageType.EMERGENCY_ALARM) {
					this._messageList.push(newMessage);
				}
				const tempMessageIndex = findIndex(this._messageList, v => v.tempUuid === msg.tempUuid);
				if (tempMessageIndex && tempMessageIndex > -1) {
					newMessage.tempUuid = undefined;
					this._messageList[tempMessageIndex] = newMessage;
				}
			} else {
				this._messageList.push(newMessage);
			}
		}

		this._messageList.sort((prev, next) => {
			return prev.dateReg > next.dateReg ? 1 : -1;
		});

		if (!noEvent) getGroupManager().dispatchEvent(new CustomEvent(GroupManagerEvent.MESSAGE_RECEIVED, { detail: this._channelIdx }));
	}

	/**
	 * 내 마지막 채팅방 접속시간을 가져오는 메서드
	 */
	getMyLastAccessDate(): Date | undefined {
		const myInfo = this._userList.find(user => user.userIdx === getUserData().userIdx);
		if (myInfo) return myInfo.lastAccessDate;
		return undefined;
	}

	/**
	 * 돌봄 그룹 긴급 상황을 확인하는 메서드
	 */
	checkEmergencyState(): void {
		const myInfo = this.userList.find(v => v.userIdx === getUserData().userIdx);
		const messageList = this._messageList;
		if (myInfo && messageList && messageList.length > 0) {
			const unCheckEmergency = messageList.find(
				msg =>
					msg.dateReg > myInfo.lastAccessDate &&
					(msg.messageType === MessageType.EMERGENCY ||
						msg.messageType === MessageType.EMERGENCY_VIDEO ||
						msg.messageType === MessageType.EMERGENCY_IMAGE ||
						msg.messageType === MessageType.EMERGENCY_ALARM),
			);
			this._emergencyState = !!unCheckEmergency;
		}
	}

	/**
	 * 긴급 메세지를 확인할 때 메서드
	 */
	readEmergencyMessage(): void {
		this._emergencyState = false;
	}

	get type(): CHAT_OBJECT_TYPE {
		return this._type;
	}

	get channelIdx(): string {
		return this._channelIdx;
	}

	get userList(): Array<ChatUserInterface> {
		return this._userList;
	}

	set userList(value: Array<ChatUserInterface>) {
		this._userList = value;
	}
	get messageList(): Array<ChatMessageInterface> {
		return this._messageList.filter(msg => msg.isActive);
	}

	set messageList(value: Array<ChatMessageInterface>) {
		this._messageList = value;
	}
	get dateReg(): Date | undefined {
		return this._dateReg;
	}

	set dateReg(value: Date | undefined) {
		this._dateReg = value;
	}

	get dateMod(): Date | undefined {
		return this._dateMod;
	}

	set dateMod(value: Date | undefined) {
		this._dateMod = value;
	}

	get channelToken(): string | undefined {
		return this._channelToken;
	}

	set channelToken(value: string | undefined) {
		this._channelToken = value;
	}

	get isDelete(): boolean {
		return this._isDelete;
	}

	set isDelete(value: boolean) {
		this._isDelete = value;
	}

	get pagingKey(): number {
		return this._pagingKey;
	}

	get totalCount(): number {
		return this._totalCount;
	}

	set totalCount(value: number) {
		this._totalCount = value;
	}

	get groupIdx(): string {
		return this._groupIdx;
	}

	get emergencyTargetUserIdx(): string | null {
		return this._emergencyTargetUserIdx;
	}

	set emergencyTargetUserIdx(value: string | null) {
		this._emergencyTargetUserIdx = value;
	}

	get creatorInfo(): GroupCreatorInterface | undefined {
		return this._creatorInfo;
	}

	set creatorInfo(value: GroupCreatorInterface | undefined) {
		this._creatorInfo = value;
	}

	get emergencyState(): boolean {
		return this._emergencyState;
	}
}
