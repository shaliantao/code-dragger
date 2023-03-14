import { ipcService } from '/@/ipc/ipc';
import { createChannelSenderWithMsg } from '/@/ipc/ipc';
import { IExecutorService } from '@src/platform/executor/executorService';

const channel = ipcService.mainProcessService.getChannel('executor');

export default createChannelSenderWithMsg<IExecutorService>(channel);
