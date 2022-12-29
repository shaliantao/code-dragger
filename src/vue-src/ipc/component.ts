import { ipcService } from '/@/ipc/ipc';
import { createChannelSenderWithMsg } from '/@/ipc/ipc';
import { IComponentService } from '@src/platform/component/component';

const channel = ipcService.mainProcessService.getChannel('component');

export default createChannelSenderWithMsg<IComponentService>(channel, ['parseIOParams']);
