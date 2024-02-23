import { io, Socket } from 'socket.io-client';
import { CreateChannelResp, EnterChannelResponse, InitCompleteResp, MessageType, UserType } from '@src/types/types';
import { ChatMessageResponse } from '@utils/group/api/group-api';
import { STATE_REG } from '@components/Profile.vue';
import { getUserData } from '@utils/common-utils';
import AppConfig from '../../constants';

export type InitDataParam = {
	userIdx: string;
	stateReg: STATE_REG;
};

export interface TextMessageRequestParam {
	messageBody: string;
	messageType: MessageType;
	channelToken: string;
	tempUuid: string;
}

export interface FileMessageRequestParam {
	messageSeq?: number;
	messageBody?: string;
	messageType: MessageType;
	tempUuid: string;
	channelToken: string;
}

export interface ChannelRequestParam {
	userIdx: string;
	userType: UserType;
	channelIdx: string | undefined;
	channelToken: string | undefined;
}

export enum CHAT_OBJECT_TYPE {
	USER = 'USER',
	MESSAGE = 'MESSAGE',
	CHANNEL = 'CHANNEL',
}

export enum ChatUtilEvent {
	/**
	 *  사용자 이벤트
	 */
	CONNECT = 'connect',
	DISCONNECT = 'disconnect',

	INIT_CHANNEL_COMPLETE = 'init.channel.complete',
	INIT_CHANNEL = 'init.channel',
	INIT_DATA = 'init.data',
	INIT_DATA_COMPLETE = 'init.data.complete',
	CREATE_CHANNEL = 'create.channel',
	CREATE_CHANNEL_COMPLETE = 'create.channel.complete',
	ENTER_CHANNEL = 'enter.channel',
	ENTER_CHANNEL_COMPLETE = 'enter.channel.complete',

	JOIN_CHANNEL = 'channel.join',
	JOIN_CHANNEL_COMPLETE = 'channel.join.complete',
	QUIT_CHANNEL = 'channel.quit',
	QUIT_CHANNEL_COMPLETE = 'channel.quit.complete',
	DELETE_USER = 'delete.user',
	REMOVE_USER = 'remove.user',
	LEAVE_CHANNEL = 'leave.channel',
	LEAVE_CHANNEL_COMPLETE = 'leave.channel.complete',
	LEAVE_CHANNEL_BY_OTHER = 'leave.channel.by.other',

	USER_JOIN = 'user.join',
	USER_QUIT = 'user.quit',

	USER_DISCONNECTED = 'user.disconnected',
	USER_LIST = 'user.list',
	UPDATE_USER = 'user.update',
	UPDATE_MESSAGE = 'message.update',

	UPDATE = 'update',
	MESSAGE_RECEIVED = 'message.received',
	ERROR_RECEIVED = 'error.received',
	MESSAGE_SEND = 'message.send',

	FAIL_SEND_MESSAGE = 'fail.send.message',
}

export interface ChatUtilsInterface extends EventTarget {
	socket: Socket | undefined;
	isConnected: boolean;
	isDestroyed: boolean;
	commonToken: string | undefined;
	isNeedUpdate: boolean;

	launchSocket(): void;
	destroy(): void;
	initData(param: InitDataParam): void;
	sendEventMessage(event: ChatUtilEvent, payload?: any): void;
	sendTextMessage(dt: TextMessageRequestParam): void;
	sendFileMessage(dt: FileMessageRequestParam): void;
	sendEmergencyMessage(dt: TextMessageRequestParam): void;
	doJoinChannel(dt: ChannelRequestParam): void;
	doQuitChannel(dt: ChannelRequestParam): void;
	doCreateChannel(dt: { userIdx: string; messageChannelIdx: string }): void;
	doEnterChannel(dt: { userIdx: string; messageChannelIdx: string; groupIdx: string }): void;
	doRemoveUser(dt: { groupIdx: string; targetUserIdx: string; channelIdx: string; channelToken: string }): void;
	doLeaveChannel(dt: { groupIdx: string; targetUserIdx: string; channelIdx: string; channelToken: string }): void;
	updateMessage(dt: { channelIdx: string; channelToken: string }): void;
	updateUser(dt: any): void;
}

export interface ChatUpdateInterface {
	data: string;
}

export class ChatUtils extends EventTarget implements ChatUtilsInterface {
	private _socket: Socket | undefined;
	private _isConnected = false;
	private _isDestroyed = false;
	private _commonToken: string | undefined;
	private _isNeedUpdate = false;
	private _isDebug = false;

	constructor() {
		super();
		this.handleConnect = this.handleConnect.bind(this);
		this.handleDisconnect = this.handleDisconnect.bind(this);

		this.handleInitChannelComplete = this.handleInitChannelComplete.bind(this);
		this.handleCreateChannelComplete = this.handleCreateChannelComplete.bind(this);
		this.handleEnterChannelComplete = this.handleEnterChannelComplete.bind(this);

		this.handleQuitChannelComplete = this.handleQuitChannelComplete.bind(this);

		this.handleDeleteUser = this.handleDeleteUser.bind(this);
		this.handleRemoveUser = this.handleRemoveUser.bind(this);

		this.handleLeaveChannelComplete = this.handleLeaveChannelComplete.bind(this);
		this.handleLeaveChannelByOther = this.handleLeaveChannelByOther.bind(this);

		this.handleUserJoin = this.handleUserJoin.bind(this);
		this.handleUserDisconnect = this.handleUserDisconnect.bind(this);
		this.handleCurrentChannelUserList = this.handleCurrentChannelUserList.bind(this);

		this.handleUserUpdate = this.handleUserUpdate.bind(this);
		this.handleMessageUpdate = this.handleMessageUpdate.bind(this);
		this.handleMessageReceived = this.handleMessageReceived.bind(this);
		this.handleErrorReceived = this.handleErrorReceived.bind(this);
	}

	launchSocket(): void {
		if (this._isDebug) console.log('launchSocket');
		// if (this._socket && this._socket.connected) return;
		this.destroy();
		this.connect();
		this.addSocketEvent();
	}

	/**
	 * @param param
	 * 초기 채널 정보를 가져오는 메서드
	 */
	initData(param: InitDataParam) {
		if (this.isDebug) console.log(`init channels data`, JSON.stringify(param));
		if (this.socket && this.isConnected) {
			this.socket.emit(ChatUtilEvent.INIT_CHANNEL, param);
		}
	}

	sendEventMessage(event: ChatUtilEvent, payload?: any): void {
		if (this.isDebug) console.log(`sendEventMessage event: ${event}`, JSON.stringify(payload || {}));
		if (this.socket && this.isConnected) {
			this.socket.emit(event, Object.assign({}, payload, { commonToken: this._commonToken }));
		}
	}

	/**
	 * @param param
	 * 텍스트 메세지 보내는 메서드
	 */
	sendTextMessage(dt: TextMessageRequestParam) {
		if (this.isDebug) console.log(`sendEventMessage event:, dt`, dt);
		if (this.socket && this.isConnected) {
			this.socket.emit(ChatUtilEvent.MESSAGE_SEND, Object.assign({}, dt));
		}
	}

	/**
	 * @param param
	 * 파일 메세지 보내는 메서드
	 */
	sendFileMessage(dt: FileMessageRequestParam) {
		if (this.isDebug) console.log(`sendEventMessage event:, msg`, dt);
		if (this.socket && this.isConnected) {
			this.socket.emit(ChatUtilEvent.MESSAGE_SEND, Object.assign({}, dt, { commonToken: this._commonToken }));
		}
	}

	/**
	 * @param param
	 * 긴급 메세지 보내는 메서드
	 */
	sendEmergencyMessage(dt: TextMessageRequestParam) {
		if (this.isDebug) console.log(`sendEventMessage event:, msg`);
		if (this.socket && this.isConnected) {
			this.socket.emit(ChatUtilEvent.MESSAGE_SEND, Object.assign({}, dt, { commonToken: this._commonToken }));
		}
	}

	/**
	 * @param param
	 * 채팅방에 참여할 때 호출하는 메서드
	 */
	doJoinChannel(dt: ChannelRequestParam): void {
		if (this.isDebug) console.log(`doJoinChannel event:, channeIdx`, dt);
		if (this.socket && this.isConnected) {
			this.socket.emit(ChatUtilEvent.JOIN_CHANNEL, Object.assign({}, dt, { commonToken: this._commonToken }));
		}
	}

	/**
	 * @param param
	 * 채팅방에서 나올 때 호출하는 메서드
	 */
	doQuitChannel(dt: ChannelRequestParam): void {
		if (this.isDebug) console.log(`doQuitChannel event:, channeIdx`, dt);
		if (this.socket && this.isConnected) {
			this.socket.emit(ChatUtilEvent.QUIT_CHANNEL, Object.assign({}, dt, { commonToken: this._commonToken }));
		}
	}

	/**
	 * @param param
	 * 돌봄 그룹을 생성할 때 호출하는 메서드
	 */
	doCreateChannel(dt: { userIdx: string; messageChannelIdx: string }): void {
		if (this.isDebug) console.log(`doCreateChannel event`, dt);
		if (this.socket && this.isConnected) {
			this.socket.emit(ChatUtilEvent.CREATE_CHANNEL, Object.assign({}, dt, { commonToken: this._commonToken }));
		}
	}

	/**
	 * @param param
	 * 돌봄 그룹에 참여할 때 호출하는 메서드
	 */
	doEnterChannel(dt: { userIdx: string; messageChannelIdx: string; groupIdx: string }) {
		if (this.isDebug) console.log(`enterChannel`, JSON.stringify(dt));
		if (this.socket && this.isConnected) {
			this.socket.emit(ChatUtilEvent.ENTER_CHANNEL, Object.assign({}, dt, { commonToken: this._commonToken }));
		}
	}

	/**
	 * @param param
	 * 사용자 최근 접속 시간을 업데이트 할 때 호출하는 메서드
	 */
	updateUser(dt: any): void {
		if (this.isDebug) console.log(`updateUser event: ${event}`, JSON.stringify(dt || {}));
		if (this.socket && this.isConnected) {
			this.socket.emit(ChatUtilEvent.UPDATE_USER, Object.assign({}, dt, { commonToken: this._commonToken }));
		}
	}

	/**
	 * @param param
	 * 돌봄 그룹에서 사용자를 제외할 때 호출하는 메서드
	 */
	doRemoveUser(dt: { groupIdx: string; targetUserIdx: string; channelIdx: string; channelToken: string }): void {
		if (this.isDebug) console.log(`doRemoveChannel event: ${event}`, JSON.stringify(dt || {}));
		if (this.socket && this.isConnected) {
			this.socket.emit(ChatUtilEvent.REMOVE_USER, Object.assign({}, dt, { commonToken: this._commonToken }));
		}
	}

	/**
	 * @param param
	 * 돌봄 그룹에서 나올 때 호출하는 메서드
	 */
	doLeaveChannel(dt: { groupIdx: string; targetUserIdx: string; channelIdx: string; channelToken: string }): void {
		if (this.isDebug) console.log(`doLeaveChannel event: ${event}`, JSON.stringify(dt || {}));
		if (this.socket && this.isConnected) {
			this.socket.emit(ChatUtilEvent.LEAVE_CHANNEL, Object.assign({}, dt, { commonToken: this._commonToken }));
		}
	}

	/**
	 * @param param
	 * 최신 메세지를 가져올 때 호출하는 메서드
	 */
	updateMessage(dt: { channelIdx: string; channelToken: string }): void {
		if (this.isDebug) console.log(`updateMessage`, JSON.stringify(dt));
		if (this.socket && this.isConnected) {
			this.socket.emit(ChatUtilEvent.UPDATE_MESSAGE, Object.assign({}, dt, { commonToken: this._commonToken }));
		}
	}

	destroy(): void {
		this._isDestroyed = true;
		if (this.socket) {
			this.removeSocketEvent();
			this.socket.disconnect();
			this.socket = undefined;
		}
	}

	private connect(): void {
		this.isDestroyed = false;
		this.socket = io(AppConfig.CHAT_URL, {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 3000,
			reconnectionAttempts: 10,
		});
	}

	private addSocketEvent(): void {
		if (this.socket) {
			this.removeSocketEvent();
			this.socket.on(ChatUtilEvent.CONNECT, this.handleConnect);
			this.socket.on(ChatUtilEvent.DISCONNECT, this.handleDisconnect);

			this.socket.on(ChatUtilEvent.INIT_CHANNEL_COMPLETE, this.handleInitChannelComplete);
			this.socket.on(ChatUtilEvent.CREATE_CHANNEL_COMPLETE, this.handleCreateChannelComplete);
			this.socket.on(ChatUtilEvent.ENTER_CHANNEL_COMPLETE, this.handleEnterChannelComplete);
			this.socket.on(ChatUtilEvent.QUIT_CHANNEL_COMPLETE, this.handleQuitChannelComplete);

			this.socket.on(ChatUtilEvent.DELETE_USER, this.handleDeleteUser);
			this.socket.on(ChatUtilEvent.REMOVE_USER, this.handleRemoveUser);
			this.socket.on(ChatUtilEvent.LEAVE_CHANNEL_COMPLETE, this.handleLeaveChannelComplete);
			this.socket.on(ChatUtilEvent.LEAVE_CHANNEL_BY_OTHER, this.handleLeaveChannelByOther);

			this.socket.on(ChatUtilEvent.USER_JOIN, this.handleUserJoin);
			this.socket.on(ChatUtilEvent.USER_DISCONNECTED, this.handleUserDisconnect);
			this.socket.on(ChatUtilEvent.USER_LIST, this.handleCurrentChannelUserList);

			this.socket.on(ChatUtilEvent.MESSAGE_RECEIVED, this.handleMessageReceived);
			this.socket.on(ChatUtilEvent.ERROR_RECEIVED, this.handleErrorReceived);
			this.socket.on(ChatUtilEvent.UPDATE_USER, this.handleUserUpdate);
			this.socket.on(ChatUtilEvent.UPDATE_MESSAGE, this.handleMessageUpdate);
		}
	}

	private removeSocketEvent(): void {
		this.socket?.removeAllListeners();
	}

	/**
	 * @param e
	 * @private
	 * 소켓 연결이 되었을 때 호출되는 메서드
	 */
	private handleConnect(): void {
		if (this.isDebug) console.log(`handleConnect`);
		this._isConnected = true;
		this.dispatchEvent(new Event(ChatUtilEvent.CONNECT));
	}

	/**
	 * @private
	 * 소켓 연결이 끊어졌을 때 호출되는 메서드
	 */
	private handleDisconnect(): void {
		if (this.isDebug) console.log(`handleDisconnect`);
		this._isConnected = false;
		this._commonToken = undefined;
		this.dispatchEvent(new Event(ChatUtilEvent.DISCONNECT));
		if (!this._isDestroyed) this.connect();
	}

	/**
	 * @param dt
	 * @private
	 * 초기 채널 정보를 가져왔을 때 호출되는 메서드
	 */
	private handleInitChannelComplete(dt: Array<InitCompleteResp>): void {
		if (this.isDebug) console.log(`handleInitChannelComplete token: ${JSON.stringify(dt)}`);
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.INIT_CHANNEL_COMPLETE, { detail: dt }));
	}

	/**
	 * @param dt
	 * @private
	 * 채팅방에서 나왔을 때 호출되는 메서드
	 */
	private handleQuitChannelComplete(dt: { messageChannelIdx: string; userIdx: string; userList: string[]; accessDate: Date }): void {
		if (this.isDebug) console.log(`handleQuitChannelComplete`, dt);
		if (getUserData().userIdx === dt.userIdx) this.dispatchEvent(new CustomEvent(ChatUtilEvent.QUIT_CHANNEL_COMPLETE, { detail: dt }));
		else this.dispatchEvent(new CustomEvent(ChatUtilEvent.USER_QUIT, { detail: dt }));
	}

	/**
	 * @param dt
	 * @private
	 * 채팅방에 참여했을 때 호출되는 메서드
	 */
	private handleUserJoin(dt: {
		userIdx: string;
		messageChannelIdx: string;
		messageList: ChatMessageResponse[];
		userList: string[];
		accessDate: Date;
	}): void {
		if (this.isDebug) console.log(`handleApocUserJoin`, dt);
		if (dt.userIdx === getUserData().userIdx) this.dispatchEvent(new CustomEvent(ChatUtilEvent.JOIN_CHANNEL_COMPLETE, { detail: dt }));
		else this.dispatchEvent(new CustomEvent(ChatUtilEvent.USER_JOIN, { detail: dt }));
	}

	/**
	 * @param dt
	 * @private
	 * 다른 사용자가 소켓 연결이 끊어졌을 때 호출되는 메서드
	 */
	private handleUserDisconnect(dt: { userIdx: string; channelIdx?: string; lastAccessDate?: Date }): void {
		if (this.isDebug) console.log(`handleApocUserDisconnect`, dt);
		if (dt.userIdx === getUserData().userIdx) return;
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.USER_DISCONNECTED, { detail: dt })); // find user
	}

	private handleCurrentChannelUserList(list: any[]): void {
		if (this.isDebug) console.log(`handleJoinCurrentUserList`, JSON.stringify(list));
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.USER_LIST, { detail: list }));
	}

	/**
	 * @param dt
	 * @private
	 * 메세지를 받았을 때 호출되는 메서드
	 */
	private handleMessageReceived(dt: any): void {
		if (this.isDebug) console.warn(`handleMessageReceived`, dt);
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.MESSAGE_RECEIVED, { detail: dt }));
	}

	/**
	 * @param dt
	 * @private
	 * 에러를 받았을 때 호출되는 메서드
	 */
	private handleErrorReceived(msg: string): void {
		if (this.isDebug) console.log(`handleErrorReceived`, JSON.stringify(msg));
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.ERROR_RECEIVED, { detail: msg }));
	}

	/**
	 * @param dt
	 * @private
	 * 돌봄 그룹 생성이 완료 됐을 때 호출되는 메서드
	 */
	private handleCreateChannelComplete(dt: CreateChannelResp): void {
		if (this.isDebug) console.log(`handleCreateChannelCompelte`, JSON.stringify(dt));
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.CREATE_CHANNEL_COMPLETE, { detail: dt }));
	}

	/**
	 * @param dt
	 * @private
	 * 사용자 최근 접속 시간을 업데이트 했을 때 호출되는 메서드
	 */
	private handleUserUpdate(dt: { user_idx: string; last_access_date: Date; message_channel_idx: string }) {
		if (this.isDebug) console.log(`handleUserUpdate`, JSON.stringify(dt));
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.UPDATE_USER, { detail: dt }));
	}

	/**
	 * @param dt
	 * @private
	 * 메세지를 업데이트 했을 때 호출되는 메서드
	 */
	private handleMessageUpdate(dt: { messageInfo: ChatMessageResponse[]; totalCount: number; channelIdx: string }) {
		if (this.isDebug) console.log(`handleMessageUpdate`, JSON.stringify(dt));
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.UPDATE_MESSAGE, { detail: dt }));
	}

	/**
	 * @param dt
	 * @private
	 * 돌봄 그룹 참여가 완료되었을 때 호출 되는 메서드
	 */
	private handleEnterChannelComplete(dt: EnterChannelResponse) {
		if (this.isDebug) console.log(`handleEnterChannelComplete`, JSON.stringify(dt));
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.ENTER_CHANNEL_COMPLETE, { detail: dt }));
	}

	/**
	 * @param dt
	 * @private
	 * 사용자가 삭제 됐을 때 호출되는 메서드
	 */
	private handleDeleteUser(dt: { userIdx: string }) {
		if (this.isDebug) console.log(`handleEnterChannelComplete`, JSON.stringify(dt));
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.DELETE_USER, { detail: dt }));
	}

	/**
	 * @param dt
	 * @private
	 * 사용자가 돌봄 그룹에서 제외 완료 되었을 때 호출되는 메서드
	 */
	private handleRemoveUser(dt: { channelIdx: string; groupIdx: string; userIdx: string }) {
		if (this.isDebug) console.log(`handleEnterChannelComplete`, JSON.stringify(dt));
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.REMOVE_USER, { detail: dt }));
	}

	/**
	 * @param dt
	 * @private
	 * 돌봄 그룹에서 나왔을 때 호출되는 메서드
	 */
	private handleLeaveChannelComplete(dt: { channelIdx: string; groupIdx: string; userIdx: string }) {
		if (this.isDebug) console.log(`handleLeaveChannelComplete`, JSON.stringify(dt));
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.LEAVE_CHANNEL_COMPLETE, { detail: dt }));
	}

	/**
	 * @param dt
	 * @private
	 * 돌봄 그룹에서 추방 당했을 때 호출되는 메서드
	 */
	private handleLeaveChannelByOther(dt: { channelIdx: string; groupIdx: string; userIdx: string }) {
		if (this.isDebug) console.log(`handleLeaveChannelByOther`, JSON.stringify(dt));
		this.dispatchEvent(new CustomEvent(ChatUtilEvent.LEAVE_CHANNEL_BY_OTHER, { detail: dt }));
	}

	get socket(): Socket | undefined {
		return this._socket;
	}

	set socket(value: Socket | undefined) {
		this._socket = value;
	}

	get isConnected(): boolean {
		return this._isConnected;
	}

	set isConnected(value: boolean) {
		this._isConnected = value;
	}

	get isDestroyed(): boolean {
		return this._isDestroyed;
	}

	set isDestroyed(value: boolean) {
		this._isDestroyed = value;
	}

	get commonToken(): string | undefined {
		return this._commonToken;
	}

	set commonToken(value: string | undefined) {
		this._commonToken = value;
	}

	get isNeedUpdate(): boolean {
		return this._isNeedUpdate;
	}

	set isNeedUpdate(value: boolean) {
		this._isNeedUpdate = value;
	}

	get isDebug(): boolean {
		return this._isDebug;
	}

	set isDebug(value: boolean) {
		this._isDebug = value;
	}
}

let chatUtil: ChatUtils | undefined;

export const createChatUtils = (): ChatUtilsInterface => {
	// if (chatUtil) throw new Error('SocketUtils is already launch');
	if (!chatUtil) chatUtil = new ChatUtils();
	return chatUtil;
};

export const getChatUtils = (): ChatUtilsInterface => {
	// if (!chatUtil) throw new Error('SocketUtils is not Ready');
	if (!chatUtil) chatUtil = new ChatUtils();
	return chatUtil;
};

export const releaseSocket = (): void => {
	if (chatUtil) {
		chatUtil.destroy();
		chatUtil = undefined;
	}
};
