import { ChatChannelEvent, ChatMessageInterface, Group } from '@utils/group/dto/group';
import { ChannelRequestParam, ChatUtilEvent, getChatUtils, TextMessageRequestParam } from '@utils/group/chat-utils';
import { GroupBaseManager, GroupManagerEvent } from '@utils/group/group-base-manager';
import { getGroupManager, removeGroupManager } from '@utils/group/group-instance';
import { CreateChannelResp, EnterChannelResponse, InitCompleteResp, MessageType } from '@src/types/types';
import { getUserData, removeLocalData } from '@utils/common-utils';
import { GroupUserInfo, saveMessageFile, sendPushNotice } from '@utils/api-utils';
import { STATE_REG } from '@components/Profile.vue';
import { remove } from 'lodash';
import { getApiClient } from '@utils/api-client';
import { KEY_LIST } from '@src/constants-keys';
import { removeCookie } from 'typescript-cookie';

export class GroupUserManager extends GroupBaseManager {
	constructor() {
		super();

		this.handleConnect = this.handleConnect.bind(this);
		this.handleDisconnect = this.handleDisconnect.bind(this);
		this.handleLoadComplete = this.handleLoadComplete.bind(this);
		this.handleInitChannelComplete = this.handleInitChannelComplete.bind(this);

		this.handleJoinChannelComplete = this.handleJoinChannelComplete.bind(this);
		this.handleQuitChannelComplete = this.handleQuitChannelComplete.bind(this);
		this.handleCreateChannelComplete = this.handleCreateChannelComplete.bind(this);
		this.handleEnterChannelComplete = this.handleEnterChannelComplete.bind(this);

		this.handleDeleteUser = this.handleDeleteUser.bind(this);
		this.handleRemoveUser = this.handleRemoveUser.bind(this);
		this.handleLeaveChannelByOther = this.handleLeaveChannelByOther.bind(this);
		this.handleLeaveChannelComplete = this.handleLeaveChannelComplete.bind(this);

		this.handleUserJoin = this.handleUserJoin.bind(this);
		this.handleUserDisconnect = this.handleUserDisconnect.bind(this);

		this.handleMessageReceived = this.handleMessageReceived.bind(this);
		this.handleUserUpdate = this.handleUserUpdate.bind(this);
		this.handleMessageUpdate = this.handleMessageUpdate.bind(this);

		this.initialize();
	}

	launchChat() {
		super.launchChat();
		if (!getChatUtils().isConnected) {
			this.addChatEvent();
		}
	}

	addChatEvent() {
		this.removeChatEvent();

		getChatUtils().addEventListener(ChatUtilEvent.CONNECT, this.handleConnect);
		getChatUtils().addEventListener(ChatUtilEvent.DISCONNECT, this.handleDisconnect);

		getChatUtils().addEventListener(ChatUtilEvent.INIT_CHANNEL_COMPLETE, this.handleInitChannelComplete);

		getChatUtils().addEventListener(ChatUtilEvent.JOIN_CHANNEL_COMPLETE, this.handleJoinChannelComplete);
		getChatUtils().addEventListener(ChatUtilEvent.QUIT_CHANNEL_COMPLETE, this.handleQuitChannelComplete);
		getChatUtils().addEventListener(ChatUtilEvent.CREATE_CHANNEL_COMPLETE, this.handleCreateChannelComplete);
		getChatUtils().addEventListener(ChatUtilEvent.ENTER_CHANNEL_COMPLETE, this.handleEnterChannelComplete);

		getChatUtils().addEventListener(ChatUtilEvent.DELETE_USER, this.handleDeleteUser);
		getChatUtils().addEventListener(ChatUtilEvent.REMOVE_USER, this.handleRemoveUser);
		getChatUtils().addEventListener(ChatUtilEvent.LEAVE_CHANNEL_BY_OTHER, this.handleLeaveChannelByOther);
		getChatUtils().addEventListener(ChatUtilEvent.LEAVE_CHANNEL_COMPLETE, this.handleLeaveChannelComplete);

		getChatUtils().addEventListener(ChatUtilEvent.USER_JOIN, this.handleUserJoin);
		getChatUtils().addEventListener(ChatUtilEvent.USER_QUIT, this.handleUserQuit);
		getChatUtils().addEventListener(ChatUtilEvent.USER_DISCONNECTED, this.handleUserDisconnect);

		getChatUtils().addEventListener(ChatUtilEvent.MESSAGE_RECEIVED, this.handleMessageReceived);
		getChatUtils().addEventListener(ChatUtilEvent.ERROR_RECEIVED, this.handleErrorReceived);
		getChatUtils().addEventListener(ChatUtilEvent.UPDATE_USER, this.handleUserUpdate);
		getChatUtils().addEventListener(ChatUtilEvent.UPDATE_MESSAGE, this.handleMessageUpdate);
	}

	removeChatEvent() {
		getChatUtils().removeEventListener(ChatUtilEvent.CONNECT, this.handleConnect);
		getChatUtils().removeEventListener(ChatUtilEvent.DISCONNECT, this.handleDisconnect);

		getChatUtils().removeEventListener(ChatUtilEvent.JOIN_CHANNEL_COMPLETE, this.handleJoinChannelComplete);
		getChatUtils().removeEventListener(ChatUtilEvent.QUIT_CHANNEL_COMPLETE, this.handleQuitChannelComplete);
		getChatUtils().removeEventListener(ChatUtilEvent.CREATE_CHANNEL_COMPLETE, this.handleCreateChannelComplete);
		getChatUtils().removeEventListener(ChatUtilEvent.ENTER_CHANNEL_COMPLETE, this.handleEnterChannelComplete);

		getChatUtils().removeEventListener(ChatUtilEvent.REMOVE_USER, this.handleRemoveUser);
		getChatUtils().removeEventListener(ChatUtilEvent.LEAVE_CHANNEL_BY_OTHER, this.handleLeaveChannelByOther);
		getChatUtils().removeEventListener(ChatUtilEvent.LEAVE_CHANNEL_COMPLETE, this.handleLeaveChannelComplete);

		getChatUtils().removeEventListener(ChatUtilEvent.USER_JOIN, this.handleUserJoin);
		getChatUtils().removeEventListener(ChatUtilEvent.USER_QUIT, this.handleUserQuit);
		getChatUtils().removeEventListener(ChatUtilEvent.USER_DISCONNECTED, this.handleUserDisconnect);

		getChatUtils().removeEventListener(ChatUtilEvent.MESSAGE_RECEIVED, this.handleMessageReceived);
		getChatUtils().removeEventListener(ChatUtilEvent.ERROR_RECEIVED, this.handleErrorReceived);
		getChatUtils().removeEventListener(ChatUtilEvent.UPDATE_USER, this.handleUserUpdate);
	}

	protected initialize(): void {
		super.initialize();
	}

	destroy(): void {
		this.removeChatEvent();
		super.destroy();
	}

	/**
	 * @private
	 * 채널별 모든 데이터 셋팅이 끝나면 호출되는 메서드
	 */
	handleLoadComplete(): void {
		super.handleLoadComplete();
		if (this._isDebug) console.log(`ChatManager handleLoadComplete loadChannel`, this);
		this._isReady = true;

		this.dispatchEvent(new Event(GroupManagerEvent.LOAD_COMPLETE));
	}

	/**
	 * @private
	 * 소켓 커넥션이 완료되면 호출되는 메서드
	 */
	private handleConnect(e: Event): void {
		const data = (e as CustomEvent).detail;
		if (this._isDebug) console.log('handleConnect data', data);
		getChatUtils().initData({ userIdx: getUserData().userIdx, stateReg: STATE_REG.RESOLVE });

		this.dispatchEvent(new Event(GroupManagerEvent.LOAD_START));
		// impl
	}

	/**
	 * @private
	 * 소켓 커넥션이 끊어지면 호출되는 메서드
	 */
	private handleDisconnect(e: Event): void {
		const data = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatManager handleDisconnect data', data);
		// impl
	}

	/**
	 * @private
	 * 채널별 기본 채널 정보 셋팅이 끝나면 호출되는 메서드
	 */
	private handleInitChannelComplete(e: Event): void {
		const data = (e as CustomEvent).detail as Array<InitCompleteResp>;
		if (this._isDebug) console.log('ChatManager handleInitChannelComplete', data);
		// super.updateGroupList(data);
		try {
			this.handleLoadComplete();
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * @private
	 * 채팅방에 접속 완료했을 때 호출되는 메서드
	 */
	private handleJoinChannelComplete(e: Event): void {
		const data = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatManager handleJoinRoomComplete data', data);

		const { messageList, messageChannelIdx, userList, accessDate } = data;

		const curChannel = this.getGroupByChannelIdx(messageChannelIdx);
		if (curChannel) {
			if (messageList && messageList.length > 0) {
				const newMessageList = curChannel.getCastedMessageList(messageList);
				curChannel.setMessageList(newMessageList, true);
			}
			curChannel.updateUserList(userList, accessDate);
			curChannel.calculateReadCount();
			curChannel.makeDayPartition();
			curChannel.makeDecorationMarker();

			this.dispatchEvent(new CustomEvent(GroupManagerEvent.UPDATE, { detail: curChannel.channelIdx }));
		}
	}

	/**
	 * @private
	 * 채팅방에서 나왔을 때 호출되는 메서드
	 */
	private handleQuitChannelComplete(e: Event): void {
		const data = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatManager handleJoinRoomComplete data', data);

		const { messageChannelIdx, userList, accessDate } = data;
		const quitChannel = this.getGroupByChannelIdx(messageChannelIdx);
		if (quitChannel) quitChannel.updateUserList(userList, accessDate);
	}

	/**
	 * @private
	 * 채팅방에 다른 유저 참여 했을 때 호출되는 메서드
	 */
	private handleUserJoin(e: Event): void {
		const data = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatManager handleUserJoin data', data);

		const curChannel = this.getGroupByChannelIdx(data.messageChannelIdx);
		if (curChannel) {
			curChannel.updateUserList(data.userList, data.accessDate);
			if (this.currentChannelIdx === curChannel.channelIdx) curChannel.calculateReadCount();

			this.dispatchEvent(new CustomEvent(GroupManagerEvent.USER_JOIN, { detail: curChannel.channelIdx }));
		}
	}

	/**
	 * @private
	 * 채팅방에 다른 유저 나갔을 때 호출되는 메서드
	 */
	private handleUserQuit(e: Event): void {
		const data = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatManager handleUserQuit data', data);

		const { messageChannelIdx, userList, accessDate } = data;
		const quitChannel = getGroupManager().getGroupByChannelIdx(messageChannelIdx);
		if (quitChannel) {
			quitChannel.updateUserList(userList, accessDate);
			this.dispatchEvent(new CustomEvent(GroupManagerEvent.USER_QUIT, { detail: quitChannel.channelIdx }));
		}
	}

	/**
	 * @private
	 * 다른 유저가 소켓 연결이 끊겼을 때 호출되는 메서드
	 */
	private handleUserDisconnect(e: Event): void {
		const data = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatManager handleDisConnect data', data);

		const { userIdx, channelIdx, lastAccessDate } = data;

		for (const channel of this.groupList) {
			for (const user of channel.userList) {
				if (user.userIdx === userIdx) {
					if (channelIdx && lastAccessDate) user.lastAccessDate = new Date(lastAccessDate);
					user.isActive = false;
				}
			}
		}
	}

	/**
	 * @private
	 * 메세지를 받았을 때 호출되는 메서드
	 */
	private handleMessageReceived(e: Event): void {
		const data = (e as CustomEvent).detail;
		const messageDtoList = data.messageInfo;
		const messageDto = messageDtoList[0];
		const onlineUserList = data.onlineUserList;
		if (this._isDebug) console.log('chatManager handleMessageReceived data', data);

		const updateChannel = this.getGroupByChannelIdx(messageDto.messageChannelIdx);
		if (updateChannel) {
			const isOtherMessage = messageDto.userIdx !== getUserData().userIdx;
			const isCurrentChannel = this.currentChannelIdx === messageDto.messageChannelIdx;
			const lastAccessDate = messageDto.dateReg;
			updateChannel.updateUserOnlineState(messageDto.userIdx, lastAccessDate);
			updateChannel.addMessage(messageDtoList, messageDto.messageType === MessageType.EMERGENCY_ALARM ? false : !isOtherMessage);
			updateChannel.totalCount = data.totalCount;

			if (isOtherMessage && isCurrentChannel) {
				if (this._isDebug) console.warn('handleUpdate');
				updateChannel.updateUserOnlineState(getUserData().userIdx, lastAccessDate);
				getChatUtils().updateUser({
					channelToken: updateChannel.channelToken,
					lastAccessDate: lastAccessDate,
				});
			} else if (isOtherMessage && !isCurrentChannel) {
				updateChannel.checkEmergencyState();
			} else if (!isOtherMessage) {
				// sendPushNotice(getApiClient(), {
				// 	onlineUserList,
				// 	messageInfo: {
				// 		messageChannelIdx: messageDto.messageChannelIdx,
				// 		username: messageDto.username,
				// 		messageBody: messageDto.messageBody,
				// 		messageType: messageDto.messageType,
				// 		fileInfo: messageDto.fileInfo,
				// 	},
				// });
			}

			if (updateChannel.channelIdx === this._currentChannelIdx) {
				updateChannel.makeDayPartition();
				updateChannel.makeDecorationMarker();
				updateChannel.calculateReadCount();
			}
		}
	}

	/**
	 * @private
	 * 메세지를 받았을 때 호출되는 메서드
	 */
	private handleErrorReceived(e: Event): void {
		const data = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatManager handleErrorReceived data', data);
		// impl
	}

	/**
	 * @private
	 * 채널 생성이 완료 되었을 때 호출 되는 메서드
	 */
	private handleCreateChannelComplete(e: Event): void {
		const dt = (e as CustomEvent).detail as CreateChannelResp;
		if (this._isDebug) console.log('chatManager handleCreateChannelComplete data', dt);

		const groupInstance = new Group(dt.messageChannelIdx, dt.channelToken, dt.groupIdx, dt.creatorInfo);
		groupInstance.dateReg = dt.dateReg;
		groupInstance.dateMod = dt.dateMod;

		this.groupList.push(groupInstance);

		// 채널 연결 완료
		this.dispatchEvent(new CustomEvent(GroupManagerEvent.ADD_CHANNEL, { detail: groupInstance.channelIdx }));
	}

	/**
	 * @private
	 * 채널 참여를 완료 하였을 때 호출 되는 메서드
	 */
	private handleEnterChannelComplete(e: Event): void {
		const dt = (e as CustomEvent).detail as EnterChannelResponse;
		if (this._isDebug) console.log('chatManager handleEnterChannelComplete data', dt);

		if (dt.userIdx === getUserData().userIdx) {
			const newGroup = new Group(dt.channelIdx, dt.channelToken, dt.groupIdx, dt.creatorInfo);
			newGroup.dateReg = dt.channelDateReg;
			newGroup.dateMod = dt.channelDateMod;
			newGroup.totalCount = dt.totalCount;

			newGroup.doLoadUserList(dt.userList ?? []);
			newGroup.doLoadMessageList(dt.messageList ?? []);
			this.groupList.push(newGroup);

			if (!this.currentGroupIdx) this.setCurrentGroup(dt.groupIdx);
		} else {
			const updateGroup = this.getGroup(dt.groupIdx);
			if (updateGroup) {
				updateGroup.userList = [];
				updateGroup.doLoadUserList(dt.userList);
				const newMessageList = [];
				if (updateGroup.messageList.length > 0) {
					for (const getMessage of dt.messageList) {
						if (getMessage.messageSeq > updateGroup.messageList[updateGroup.messageList.length - 1].messageSeq) newMessageList.push(getMessage);
					}
					updateGroup.addMessage(newMessageList, true);
				} else {
					updateGroup.addMessage(dt.messageList, true);
				}
				// if (this.currentChannelIdx === updateGroup.channelIdx) updateGroup.calculateReadCount();

				this.dispatchEvent(new CustomEvent(GroupManagerEvent.USER_ENTER, { detail: updateGroup.channelIdx }));
			}
		}
	}

	/**
	 * @private
	 * 유저 정보를 업데이트 했을 때 호출되는 메서드
	 */
	private handleUserUpdate(e: Event): void {
		const dt = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatUserManager.handleUserUpdate', dt);
		const userIdx = dt.user_idx;
		const channelIdx = dt.message_channel_idx;
		const lastAccessDate = dt.last_access_date;

		if (getUserData().userIdx === userIdx) return;

		const findChannel = this.getGroupByChannelIdx(channelIdx);
		if (findChannel) {
			const updateUser = findChannel.userList.find(user => user.userIdx === userIdx);
			if (updateUser) updateUser.lastAccessDate = new Date(lastAccessDate);
			findChannel.calculateReadCount();
		}
	}

	/**
	 * @private
	 * 메세지를 업데이트 했을 때 호출되는 메서드
	 */
	private handleMessageUpdate(e: Event): void {
		const dt = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatUserManager.handleMessageUpdate', dt);
		const messageList = dt.messageInfo;
		const channelIdx = dt.channelIdx;
		const totalCount = dt.totalCount;

		const updateGroup = this.getGroupByChannelIdx(channelIdx);
		if (updateGroup) {
			updateGroup.updateMessageList(messageList);
			updateGroup.totalCount = totalCount;
			updateGroup.calculateReadCount();
			updateGroup.makeDecorationMarker();
			updateGroup.makeDayPartition();
		}

		this.dispatchEvent(
			new CustomEvent(GroupManagerEvent.UPDATE, {
				detail: {
					channelIdx,
				},
			}),
		);
	}

	/**
	 * @private
	 * 사용자가 채팅방에서 제외 됐을 때 호출되는 메서드
	 */
	private handleRemoveUser(e: Event): void {
		const dt = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatUserManager.handleRemoveUser', dt);
		const channelIdx = dt.channelIdx;
		const userIdx = dt.userIdx;

		const updateGroup = this.getGroupByChannelIdx(channelIdx);
		if (updateGroup) {
			updateGroup.removeUser(userIdx);
			if (updateGroup.channelToken) getChatUtils().updateMessage({ channelIdx, channelToken: updateGroup.channelToken });
		}
	}

	/**
	 * @private
	 * 사용자가 삭제 됐을 때 호출되는 메서드
	 */
	private handleDeleteUser(e: Event): void {
		const detail = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatUserManager.handleDeleteUser', detail);

		if (detail.userIdx === getUserData().userIdx) {
			removeLocalData(KEY_LIST.CONST.LOGIN_USER);
			removeLocalData(KEY_LIST.CONST.LOGIN_KEEP);
			removeLocalData(KEY_LIST.CONST.LOGIN_TOKEN);
			removeCookie(KEY_LIST.CONST.LOGIN_TOKEN);
			window.alert('서비스에 대한 접근 권한이 없습니다. 관리자에게 문의해 주세요.');
			removeGroupManager();
			window.location.replace('/login');
		}
	}

	/**
	 * @private
	 * 채팅방에서 강퇴 당했을 때 호출되는 메서드
	 */
	private handleLeaveChannelByOther(e: Event): void {
		const dt = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatUserManager.handleLeaveChannelByOther', dt);

		if (!dt.userIdx || dt.userIdx === getUserData().userIdx) {
			remove(this._groupList, v => v.groupIdx === dt.groupIdx);
			if (this.currentGroupIdx === dt.groupIdx) {
				if (this._groupList.length < 1) this.setCurrentGroup(undefined);
				else this.setCurrentGroup(this._groupList[0].groupIdx);
			}

			this.dispatchEvent(
				new CustomEvent(GroupManagerEvent.KICKED, {
					detail: {
						channelIdx: dt.channelIdx,
						userIdx: dt.userIdx,
					},
				}),
			);
		}
	}

	/**
	 * @private
	 * 채팅방에서 나왔을 때 호출되는 메서드
	 */
	private handleLeaveChannelComplete(e: Event): void {
		const dt = (e as CustomEvent).detail;
		if (this._isDebug) console.log('chatUserManager.handleLeaveChannelComplete', dt);

		if (dt.userIdx === getUserData().userIdx) {
			remove(this._groupList, v => v.groupIdx === dt.groupIdx);
			if (this.currentGroupIdx === dt.groupIdx) {
				if (this._groupList.length < 1) this.setCurrentGroup(undefined);
				else {
					this.setCurrentGroup(this._groupList[0].groupIdx);
					this.changeCurrentChannelIdx(undefined);
				}
			}
			this.dispatchEvent(new CustomEvent(GroupManagerEvent.LEAVE_CHANNEL, { detail: dt.channelIdx }));
		}
	}

	/**
	 * @param dt
	 * 메세지 보낼 때 사용하는 메서드
	 */
	sendChatMessage(dt: { messageBody: string | File; messageType: MessageType; tempUuid: string }): void {
		super.sendChatMessage(dt);

		let userChannelIdx: string | undefined = '';
		if (dt.messageType === MessageType.EMERGENCY_ALARM) {
			userChannelIdx = this.getMyGroup()?.channelIdx || '';
		} else {
			userChannelIdx = this.currentChannelIdx;
		}

		if (!userChannelIdx || !getUserData().userIdx) return;
		const param = {
			channelToken: this.getChannelToken(userChannelIdx),
			messageType: dt.messageType,
			messageBody: dt.messageBody,
			tempUuid: dt.tempUuid,
		};
		if (dt.messageType === MessageType.TEXT) {
			getChatUtils().sendTextMessage(param as TextMessageRequestParam);
		} else if (dt.messageType === MessageType.EMERGENCY || dt.messageType === MessageType.EMERGENCY_ALARM) {
			getChatUtils().sendEmergencyMessage(param as TextMessageRequestParam);
		} else {
			// impl
			const { messageType, messageBody, tempUuid } = dt;
			const formData = new FormData();
			formData.append('messageFile', messageBody);
			formData.append('channelIdx', userChannelIdx);
			formData.append('messageType', messageType);
			formData.append('tempUuid', tempUuid);

			saveMessageFile(getApiClient(), formData)
				.then(res => {
					const { attachFileIdx, messageSeq } = res.data;
					const channelToken = this.getChannelToken(userChannelIdx);
					if (channelToken) {
						getChatUtils().sendFileMessage({
							messageSeq,
							messageType,
							tempUuid,
							channelToken,
						});
					}
				})
				.catch(e => {
					if (e === 'msg.RESULT_FAILED') {
						getChatUtils().dispatchEvent(new CustomEvent(ChatUtilEvent.FAIL_SEND_MESSAGE, { detail: tempUuid }));
					}
				});
		}
	}

	setCurrentGroup(groupIdx: string | undefined): void {
		super.setCurrentGroup(groupIdx);
	}

	/**
	 * @param dt
	 * 내가 기기 사용자로 생성된 그룹 정보를 가져올 때 사용하는 메서드
	 */
	getMyGroup(): Group | undefined {
		const myGroup = this._groupList.filter(g => g.creatorInfo?.userIdx === getUserData().userIdx);
		if (myGroup.length > 0) return myGroup[0];
		return undefined;
	}

	/**
	 * @param dt
	 * 채팅방에서 나갈때 사용하는 메서드
	 */
	leaveGroup(groupIdx: string, targetUserIdx: string, channelIdx: string): void {
		super.leaveGroup(groupIdx, targetUserIdx, channelIdx);
		const channelToken = this.getChannelToken(channelIdx);
		if (channelToken) {
			getChatUtils().doLeaveChannel({
				groupIdx,
				targetUserIdx,
				channelIdx,
				channelToken,
			});
		}
	}

	updateChatMessage() {
		super.updateChatMessage();
		//impl
	}

	deleteChatMessage() {
		super.deleteChatMessage();
		// impl;
	}

	createGroup(dt: GroupUserInfo): void {
		super.createGroup(dt);
	}

	getCurrentGroup(): Group | undefined {
		return super.getCurrentGroup();
	}

	getChannelToken(channelIdx?: string): string | undefined {
		return super.getChannelToken(channelIdx);
	}

	getGroupList(): Array<Group> {
		return super.getGroupList();
	}

	/**
	 * @param dt
	 * 채팅방에 참여할 때 호출하는 메서드
	 */
	joinChannel(channelIdx?: string): void {
		super.joinChannel(channelIdx);
		if (!channelIdx) return;

		const joinGroup = this.getGroupByChannelIdx(channelIdx);
		if (joinGroup) {
			this._currentChannelIdx = joinGroup.channelIdx;
			joinGroup.readEmergencyMessage();

			getChatUtils().doJoinChannel({
				userIdx: getUserData().userIdx,
				userType: getUserData().userType,
				channelIdx: this._currentChannelIdx,
				channelToken: this.getChannelToken(this._currentChannelIdx),
			} as ChannelRequestParam);
		}
	}

	/**
	 * @param dt
	 * 채팅방을 닫을 때 호출하는 메서드
	 */
	quitChannel(channelIdx?: string): void {
		super.quitChannel();

		if (!channelIdx) return;
		const channelToken = this.getChannelToken(this._currentChannelIdx);
		this._currentChannelIdx = undefined;
		const param = {
			userIdx: getUserData().userIdx,
			userType: getUserData().userType,
			channelIdx: channelIdx,
			channelToken,
		};

		getChatUtils().doQuitChannel(param as ChannelRequestParam);
	}

	setCurrentChannel(channelIdx: string): void {
		super.setCurrentChannel(channelIdx);
	}

	addUser(): void {
		super.addUser();
	}

	/**
	 * @param dt
	 * 사용자를 채팅방에서 제외할 때 호출하는 메서드
	 */
	removeUser(groupIdx: string, targetUserIdx: string, channelIdx: string): void {
		super.removeUser(groupIdx, targetUserIdx, channelIdx);
		const channelToken = this.getChannelToken(channelIdx);
		if (channelToken) {
			getChatUtils().doRemoveUser({
				groupIdx,
				targetUserIdx,
				channelIdx,
				channelToken,
			});
		}
	}

	getLastMessage(channelIdx?: string): ChatMessageInterface | undefined {
		return super.getLastMessage(channelIdx);
	}

	/**
	 * @param dt
	 * 그룹의 긴급 상태를 변경할 때 호출하는 메서드
	 */
	updateEmergencyState(): void {
		for (const group of this._groupList) {
			group.checkEmergencyState();
		}
	}
}
