import { ipcService } from '/@/ipc/ipc';
import { createChannelSender } from '@base/ipc/common/ipc';
import { IExecutorService } from '@src/platform/executor/executorService';

const channel = ipcService.mainProcessService.getChannel('executor');

export default createChannelSender<IExecutorService>(channel);
