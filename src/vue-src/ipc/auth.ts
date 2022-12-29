import { ipcService } from '/@/ipc/ipc';
import { createChannelSenderWithMsg } from '/@/ipc/ipc';
import { IAuthService } from '@src/base/auth/authService';

const channel = ipcService.mainProcessService.getChannel('auth');

export default createChannelSenderWithMsg<IAuthService>(channel);
