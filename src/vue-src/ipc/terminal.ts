import { ipcService } from '/@/ipc/ipc';
import { createChannelSender } from '@base/ipc/common/ipc';
import { ITerminalService } from '@src/platform/terminal/terminalService';

const channel = ipcService.mainProcessService.getChannel('terminal');

export default createChannelSender<ITerminalService>(channel);
