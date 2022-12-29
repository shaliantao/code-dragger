import { createDecorator } from '@base/instantiation/instantiation';
import { Event, Emitter } from '@base/common/event';
import { isWindows } from '@base/common/platform';
import { ILogService } from '@base/log/logService';
import { Disposable } from '@src/base/common/lifecycle';
import { IInstantiationService } from '@base/instantiation/instantiation';
import { IEnvironmentService } from '@base/environment/environmentService';
import { TerminalProcess } from '@src/platform/terminal/terminalProcess';
import { ITerminalChildProcess } from '@src/platform/terminal/terminal';

export const ITerminalService = createDecorator<ITerminalService>('terminalService');

interface ITerminalData {
  cwd: string;
  data: string;
}

export interface ITerminalService {
  readonly _serviceBrand: undefined;
  readonly onTerminalData: Event<ITerminalData>;
  createProcess(cwd: string): Promise<void>;
  printTerminalData(cwd: string, data: string): Promise<void>;
  writeTerminalData(cwd: string, data: string): Promise<void>;
  killProcess(cwd: string): Promise<void>;
  resizeProcess(cwd: string, cols: number, rows: number): Promise<void>;
  dispose(): void;
}
export class TerminalService extends Disposable implements ITerminalService {
  readonly _serviceBrand: undefined;
  private _terminalMap: Map<string, ITerminalChildProcess> = new Map();
  private readonly _onTerminalData = this._register(new Emitter<ITerminalData>());
  readonly onTerminalData: Event<ITerminalData> = this._onTerminalData.event;
  constructor(
    @ILogService private readonly logService: ILogService,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @IEnvironmentService private readonly environmentService: IEnvironmentService,
  ) {
    super();
  }
  async createProcess(cwd: string) {
    const executable = isWindows ? 'powershell.exe' : '/bin/zsh';

    const instance = this.instantiationService.createInstance(TerminalProcess, { executable }, cwd);
    instance.onProcessData((data) => this.printTerminalData(cwd, data));
    instance.start();
    this._terminalMap?.set(cwd, instance);
  }
  async printTerminalData(cwd: string, data: string) {
    this._onTerminalData.fire({ cwd, data });
  }
  async writeTerminalData(cwd: string, data: string) {
    this._terminalMap.get(cwd)?.input(data);
  }
  async resizeProcess(cwd: string, cols: number, rows: number) {
    this._terminalMap.get(cwd)?.resize(cols, rows);
  }
  async killProcess(cwd: string) {
    this.logService.debug(`killProcess`);
    this._terminalMap.get(cwd)?.shutdown(true);
    this._terminalMap?.delete(cwd);
  }
  dispose(): void {
    super.dispose();
    for (const instance of this._terminalMap.values()) {
      instance?.shutdown(true);
    }
    this._terminalMap?.clear();
  }
}
