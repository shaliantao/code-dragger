import { ipcService } from '/@/ipc/ipc';
import { createChannelSenderWithMsg } from '/@/ipc/ipc';
import { IHttpService } from '@src/base/http/http';

const channel = ipcService.mainProcessService.getChannel('http');

export default createChannelSenderWithMsg<IHttpService>(channel);
