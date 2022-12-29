import { debounce } from 'lodash-es';
import {
  MainProcessService,
  IMainProcessService,
} from '@base/ipc/electron-sandbox/mainProcessService';
import { createChannelSender, IChannel } from '@base/ipc/common/ipc';
import { useMessage } from '/@/hooks/web/useMessage';
import { context } from '@src/sandbox/globals';

const { createMessage, notification } = useMessage();

class IPCService {
  mainProcessService: IMainProcessService;
  constructor() {
    this.mainProcessService = new MainProcessService(context.windowId);
  }
}

export const ipcService = new IPCService();

export function createChannelSenderWithMsg<T>(channel: IChannel, errorExcludes?: string[]) {
  return createChannelSender<T>(channel, {
    onResult: debounce((res) => {
      // if (!res) {
      //   createMessage.success('操作成功');
      // }
    }, 50),
    onError(error, key) {
      if (Array.isArray(errorExcludes) && errorExcludes.includes(key)) {
        return;
      }
      notification.error({ message: '错误信息', description: '' + error });
    },
  });
}
