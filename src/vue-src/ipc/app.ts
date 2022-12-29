import { ipcService } from '/@/ipc/ipc';
import { createChannelSenderWithMsg } from '/@/ipc/ipc';
import { IAppService } from '@src/platform/app/app';

const channel = ipcService.mainProcessService.getChannel('app');

export default createChannelSenderWithMsg<IAppService>(channel);
