import { GroupManagerInterface } from '@utils/group/group-base-manager';
import { GroupManagerManager } from '@utils/group/group-manager-manager';
import { GroupUserManager } from '@utils/group/group-user-manager';
import { getUserData } from '@utils/common-utils';
import { UserType } from '@src/types/types';

let groupManager: GroupManagerInterface | undefined;

export const createGroupManager = (): GroupManagerInterface => {
	if (!groupManager) {
		if (getUserData().userType === UserType.USER || getUserData().userType === UserType.USER_DEVICE) {
			groupManager = new GroupUserManager();
		} else if (getUserData().userType === UserType.MANAGER) {
			groupManager = new GroupManagerManager();
		} else {
			throw new NotFoundUserException('Not found user type');
		}
	}
	return groupManager;
};

export const getGroupManager = (): GroupManagerInterface => {
	// if (!groupManager) throw new NotChatReadyException('chat is not initialize');
	if (!groupManager) groupManager = createGroupManager();
	return groupManager;
};

export const removeGroupManager = (): void => {
	if (groupManager) {
		groupManager.destroy();
		groupManager = undefined;
	}
};

export class NotChatReadyException extends Error {
	constructor(message?: string) {
		super(message);
		this.name = 'NotChatReadyError';
	}
}

export class NotFoundUserException extends Error {
	constructor(message?: string) {
		super(message);
		this.name = 'NotFoundUserException';
	}
}
