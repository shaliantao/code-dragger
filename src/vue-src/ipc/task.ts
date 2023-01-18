import { ITaskScheduleService } from '@src/platform/task/task';
import { ipcService } from '/@/ipc/ipc';
import { createChannelSenderWithMsg } from '/@/ipc/ipc';

const channel = ipcService.mainProcessService.getChannel('taskSchedule');

export default createChannelSenderWithMsg<ITaskScheduleService>(channel);
