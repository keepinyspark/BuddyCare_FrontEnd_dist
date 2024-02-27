import { ChatChannelEvent, ChatMessageInterface, Group } from '@utils/group/dto/group';
import { ChannelRequestParam, createChatUtils, getChatUtils, releaseSocket } from '@utils/group/chat-utils';
import { ErrorType, InitCompleteResp, MessageType } from '@src/types/types';
import { GroupUserInfo } from '@utils/api-utils';
import { getUserData, loadLocalData, removeLocalData, saveLocalData } from '@utils/common-utils';

export interface ChatErrorInterface {
	userIdx: string;
	msgType: ErrorType;
	created: Date;
	body: string;
}

export enum GroupManagerEvent {
	LOAD_START = 'loadStart',
	LOAD_COMPLETE = 'loadComplete',
	MESSAGE_RECEIVED = 'messageReceived',
	ADD_CHANNEL = 'addChannel',
	LEAVE_CHANNEL = 'leaveChannel',
	KICKED = 'kicked',
	REMOVE_USER = 'removeUser',
	USER_JOIN = 'userJoin',
	USER_QUIT = 'userQuit',
	USER_ENTER = 'userEnter',
	CHANGE_GROUP = 'changeGroup',
	UPDATE = 'update',

	SEND_EMERGENCY_ALARM = 'SEND_EMERGENCY_ALARM',
}

export interface GroupManagerInterface extends EventTarget {
	isReady: boolean;
	currentGroupIdx: string | undefined;
	currentChannelIdx: string | undefined;
	groupList: Array<Group>;

	launchChat(): void;
	destroy(): void;
	changeCurrentChannelIdx(idx: string | undefined): void;
	sendChatMessage(dt: { messageBody: string | File; messageType: MessageType; tempUuid: string }): void;
	updateChatMessage(): void;
	deleteChatMessage(): void;
	addUser(): void;
	enterChannel(dt: { messageChannelIdx: string; userIdx: string; groupIdx: string }): void;
	createGroup(dt: GroupUserInfo): void;
	leaveGroup(groupIdx: string, targetUserIdx: string, channelIdx: string): void;
	removeUser(groupIdx: string, targetUserIdx: string, channelIdx: string): void;
	setCurrentChannel(channelIdx: string): void;
	setCurrentGroup(groupIdx: string | undefined): void;
	getGroup(groupIdx?: string): Group | undefined;
	getGroupByChannelIdx(channelIdx?: string): Group | undefined;
	getGroupList(): Array<Group>;
	updateGroupList(data: Array<InitCompleteResp>): void;
	getChannelToken(channelIdx?: string): string | undefined;
	getCurrentGroup(): Group | undefined;
	joinChannel(channelIdx?: string): void;
	quitChannel(channelIdx?: string): void;
	getLastMessage(channelIdx?: string): ChatMessageInterface | undefined;
	getGroupIdxByChannelIdx(channelIdx: string): string | undefined;
	updateEmergencyState(): void;
}

export class GroupBaseManager extends EventTarget implements GroupManagerInterface {
	protected _currentChannelIdx: string | undefined = undefined; // 현재 채팅방에 channelIdx
	protected _currentGroupIdx: string | undefined = undefined; // 현재 대쉬보드에 선택된 groupIdx
	protected _groupList: Array<Group> = []; // 돌봄 그룹 목록
	protected _isDebug = false;
	protected _isReady = false; // 그룹 매니저 데이터 바인딩 완료 여부

	constructor() {
		super();
		const cGroupIdx = loadLocalData('CUR_GROUP_IDX');
		if (cGroupIdx) this._currentGroupIdx = cGroupIdx;
	}

	launchChat() {
		releaseSocket();
		// if (!getChatUtils().isConnected) {
		getChatUtils().launchSocket();
		// }
	}

	protected initialize(): void {
		try {
			createChatUtils();
		} catch (e) {
			// 중복 소켓
			console.log(e);
		}
	}

	destroy(): void {
		this._groupList = [];
		this._currentChannelIdx = undefined;
		releaseSocket();
	}

	/**
	 * @param dt
	 * 돌봄 그룹을 생성할 때 메서드
	 */
	createGroup(dt: GroupUserInfo): void {
		getChatUtils().doCreateChannel({ userIdx: dt.userIdx, messageChannelIdx: dt.messageChannelIdx });
	}

	/**
	 * @param groupIdx
	 * 돌봄 그룹 정보를 가져올 때 사용하는 메서드
	 */
	getGroup(groupIdx?: string | undefined): Group | undefined {
		if (!groupIdx) this.getCurrentGroup();

		const findChannel = this._groupList.filter(c => c.groupIdx === groupIdx);
		if (findChannel.length) return findChannel[0];
		return undefined;
	}

	/**
	 * @param channelIdx
	 * 채널 idx로 그룹 정보를 가져올 때 사용하는 메서드
	 */
	getGroupByChannelIdx(channelIdx?: string | undefined): Group | undefined {
		if (!channelIdx) this.getCurrentGroup();

		const findChannel = this._groupList.filter(c => c.channelIdx === channelIdx);
		if (findChannel.length) return findChannel[0];
		return undefined;
	}

	handleLoadComplete() {
		// don't need implement
	}

	/**
	 * 현재 그룹 정보를 가져오는 메서드
	 */
	getCurrentGroup(): Group | undefined {
		if (this._currentGroupIdx) return this._groupList.find(c => c.groupIdx === this._currentGroupIdx);
		return undefined;
	}

	async updateGroupList(data: Array<InitCompleteResp>) {
		const funcPromise = (fnResolve: (dt?: any) => void, fnReject: (dt?: any) => void) => {
			this._groupList = [];
			let loadCount = 0;

			if (!data || data.length < 1) {
				// this.handleLoadComplete();
				return;
			}

			for (const dt of data) {
				const newGroup = new Group(dt.channelIdx, dt.channelToken, dt.groupIdx, dt.creatorInfo);
				newGroup.emergencyTargetUserIdx = dt.emergencyTargetUserIdx;
				this._groupList.push(newGroup);

				const handleLoadReceived = (e: Event): void => {
					const eChannelIdx = (e as CustomEvent).detail;
					const totalChannelCount = data.length;
					if (eChannelIdx && eChannelIdx === dt.channelIdx) {
						loadCount++;

						if (loadCount >= totalChannelCount) {
							try {
								if (!this.currentGroupIdx) this.setCurrentGroup(this._groupList[0].groupIdx);
								else this.dispatchEvent(new CustomEvent(GroupManagerEvent.LOAD_COMPLETE));
							} catch (e) {
								console.error(e);
							}
							fnResolve();
							// this.handleLoadComplete();
						}
					}
				};

				newGroup.addEventListener(ChatChannelEvent.INITIALIZE_COMPLETE, handleLoadReceived.bind(this), { once: true });
				newGroup.doLoadData();
			}
		};
		return new Promise(funcPromise);
	}

	/**
	 * @param dt
	 * 현재 선택된 돌봄 그룹을 변경할 때 사용하는 메서드
	 */
	setCurrentGroup(groupIdx: string | undefined): void {
		if (groupIdx) {
			this._currentGroupIdx = groupIdx;
			saveLocalData('CUR_GROUP_IDX', groupIdx);
		} else {
			this._currentGroupIdx = undefined;
			this._currentChannelIdx = undefined;
			removeLocalData('CUR_GROUP_IDX');
		}
		this.dispatchEvent(new CustomEvent(GroupManagerEvent.CHANGE_GROUP, { detail: groupIdx }));
	}

	sendChatMessage(dt: { messageBody: string | File; messageType: MessageType; tempUuid: string }): void {
		// impl
	}

	updateChatMessage() {
		//impl
	}

	deleteChatMessage() {
		// imp;
	}

	/**
	 * @param channelIdx
	 * 채널의 인증 토큰을 가져오는 메서드
	 */
	getChannelToken(channelIdx?: string): string | undefined {
		if (channelIdx) {
			const findChannel = this._groupList.find(c => c.channelIdx === channelIdx);
			if (findChannel) return findChannel.channelToken;
		} else {
			const curChannel = this.getCurrentGroup();
			if (curChannel) return curChannel.channelToken;
		}
		return undefined;
	}

	getGroupList(): Array<Group> {
		return this._groupList.filter(c => !c.isDelete);
	}

	joinChannel(channelIdx?: string): void {
		// impl
	}

	quitChannel(): void {
		// impl
	}

	/**
	 * 채널의 마지막 메세지를 가져오는 메서드
	 */
	getLastMessage(channelIdx?: string): ChatMessageInterface | undefined {
		const curChannel = channelIdx ? this.getGroupByChannelIdx(channelIdx) : this.getCurrentGroup();

		if (curChannel) {
			curChannel.messageList.sort((prev, next) => {
				return prev.dateReg > next.dateReg ? 1 : -1;
			});
			for (let i = curChannel.messageList.length - 1; i > 0; i--) {
				if (curChannel.messageList[i].messageType !== MessageType.ENTER && curChannel.messageList[i].messageType !== MessageType.LEAVE)
					return curChannel.messageList[i];
			}

			return curChannel.messageList[curChannel.messageList.length - 1];
		}

		return undefined;
	}

	/**
	 * 현재 채팅방을 설정하는 메서드
	 */
	setCurrentChannel(channelIdx: string | undefined): void {
		const param = {
			userIdx: getUserData().userIdx,
			userType: getUserData().userType,
			channelIdx: channelIdx ?? this._currentChannelIdx,
		};
		const group = this.getGroupByChannelIdx(channelIdx);
		if (channelIdx) {
			if (!group) return;
			getChatUtils().doJoinChannel(Object.assign({}, param, { channelToken: group.channelToken }));
		} else {
			const curGroup = this.getCurrentGroup();
			if (curGroup) getChatUtils().doQuitChannel(Object.assign({}, param, { channelToken: curGroup.channelToken }));
		}
		this._currentChannelIdx = channelIdx;
		this._currentGroupIdx = group?.groupIdx;
		// this.dispatchEvent(new CustomEvent(ChatManagerEvent.CHANGE_CHANNEL, { detail: channelIdx }));
	}

	getGroupIdxByChannelIdx(channelIdx: string): string | undefined {
		const list = this.getGroupList();
		const findChannel = list.find(c => c.channelIdx === channelIdx);
		if (findChannel) return findChannel.groupIdx;

		return undefined;
	}

	leaveGroup(groupIdx: string, targetUserIdx: string, channelIdx: string): void {
		// impl
	}

	addUser(): void {
		// impl
	}

	removeUser(groupIdx: string, targetUserIdx: string, channelIdx: string): void {
		// impl
	}

	/**
	 * @param dt
	 * 돌봄 그룹에 참여할 때 사용하는 메서드
	 */
	enterChannel(dt: { messageChannelIdx: string; userIdx: string; groupIdx: string }): void {
		if (this._isDebug) console.log('chatBaseManager.enterChannel ', JSON.stringify(dt));
		getChatUtils().doEnterChannel(dt);
	}

	changeCurrentChannelIdx(idx: string | undefined): void {
		this._currentChannelIdx = idx;
	}

	updateEmergencyState(): void {
		// impl
	}

	get currentChannelIdx(): string | undefined {
		return this._currentChannelIdx;
	}

	get groupList(): Array<Group> {
		return this._groupList;
	}

	set groupList(value: Array<Group>) {
		this._groupList = value;
	}

	get isReady(): boolean {
		return this._isReady;
	}

	get currentGroupIdx(): string | undefined {
		return this._currentGroupIdx;
	}
}
