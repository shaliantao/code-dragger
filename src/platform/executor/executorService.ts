import { FloatWindow } from '@src/floatWindow';
import { ILogService } from '@base/log/logService';
import { IInstantiationService } from '@base/instantiation/instantiation';
import { createDecorator } from '@base/instantiation/instantiation';
import { Emitter, Event } from '@base/common/event';
import { Disposable } from '@base/common/lifecycle';
import { AppExecutor } from '@src/platform/executor/appExecutor';
import { ITerminalService } from '@src/platform/terminal/terminalService';
import {
  APP_RUN_STATE,
  COMMAND_EXEC_STATUS,
  ICommandData,
  IAppData,
  IAppStart,
  ICommandStart,
} from '@src/platform/executor/executor';

export const IExecutorService = createDecorator<IExecutorService>('executorService');

export interface IExecutorService {
  readonly onRunStateChange: Event<APP_RUN_STATE>;
  readonly onCommandStart: Event<ICommandStart>;
  readonly onCommandData: Event<ICommandData>;
  readonly onAppStart: Event<IAppStart>;
  readonly onAppData: Event<IAppData>;
  start(appId: string): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  closeFloatWin(): Promise<void>;
}

export class ExecutorService extends Disposable implements IExecutorService {
  readonly _serviceBrand: undefined;
  private _floatWin: FloatWindow | null;
  private _app: Nullable<AppExecutor> = null;
  private readonly _onRunStateChange = this._register(new Emitter<APP_RUN_STATE>());
  readonly onRunStateChange: Event<APP_RUN_STATE> = this._onRunStateChange.event;
  private readonly _onAppStart = this._register(new Emitter<IAppStart>());
  readonly onAppStart: Event<IAppStart> = this._onAppStart.event;
  private readonly _onCommandStart = this._register(new Emitter<ICommandStart>());
  readonly onCommandStart: Event<ICommandStart> = this._onCommandStart.event;
  private readonly _onCommandData = this._register(new Emitter<ICommandData>());
  readonly onCommandData: Event<ICommandData> = this._onCommandData.event;
  private readonly _onAppData = this._register(new Emitter<IAppData>());
  readonly onAppData: Event<IAppData> = this._onAppData.event;
  constructor(
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @ILogService private readonly logService: ILogService,
    @ITerminalService private readonly terminalService: ITerminalService,
  ) {
    super();
    this._floatWin = this.instantiationService.createInstance(FloatWindow);
    this._floatWin.createWindow();
  }
  async start(appId) {
    this._app = this._register(
      this.instantiationService.createInstance(AppExecutor, appId, 'node'),
    );
    this._initListener(this._app.appPath);
    this._app.start();
    //this._floatWin?.showInactive();
  }
  async stop() {
    this._app?.stop();
  }
  async pause() {
    if (this._app?.isRunning) {
      this._app.pause();
    }
  }
  async resume() {
    if (!this._app?.isRunning) {
      this._app?.resume();
    }
  }
  async closeFloatWin() {
    if (this._floatWin) {
      this._floatWin.hide();
    }
  }
  private _initListener(appPath: string) {
    this._app?.onRunStateChange((state) => {
      this._onRunStateChange.fire(state);
      this.terminalService.printTerminalData(appPath, `\r\n\r\nState: ${state}\r\n`);
    });
    this._app?.onCommandStart(({ startTime, info, meta }) => {
      this._onCommandStart.fire({ startTime, info, meta });
      const title = `\r\n\x1b[1;32m开始执行: ${meta?.name}\x1b[0m\r\n`;
      this.terminalService.printTerminalData(appPath, title);
    });
    this._app?.onCommandData(({ code, data }) => {
      let title;
      if (code === COMMAND_EXEC_STATUS.SUCCESS) {
        title = `\x1b[1;32m执行结果: success\x1b[0m\r\n`;
      } else {
        title = `\x1b[1;31m执行结果: error\x1b[0m\r\n`;
      }
      this._onCommandData.fire({ code, data });
      this.terminalService.printTerminalData(appPath, `${title}${JSON.stringify(data)}`);
    });
    this._app?.onAppStart((data) => {
      this._onAppStart.fire(data);
    });
    this._app?.onAppData((data) => {
      this._app = null;
      this._onAppData.fire(data);
      //setTimeout(() => this._floatWin?.hide(), 500);
    });
  }
  dispose(): void {
    super.dispose();
    this._app = null;
    this._floatWin?.destroy();
    this._floatWin = null;
  }
}
