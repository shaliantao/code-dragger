import { ipcService } from '/@/ipc/ipc';
import { createChannelSenderWithMsg } from '/@/ipc/ipc';
import { IGroupService } from '@src/platform/group/group';

const channel = ipcService.mainProcessService.getChannel('group');

export default createChannelSenderWithMsg<IGroupService>(channel);
