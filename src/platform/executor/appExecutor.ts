import path from 'path';
import { Disposable } from '@base/common/lifecycle';
import { ILogService } from '@base/log/logService';
import { IAppService } from '@src/platform/app/app';
import { IEnvironmentService } from '@base/environment/environmentService';
import { Emitter, Event } from '@base/common/event';
import { SubProcess } from '@src/platform/executor/subProcess';
import {
  ICommandData,
  ICommandStart,
  IAppStart,
  IAppData,
  IContext,
  KILL_TYPE,
  APP_RUN_STATE,
  APP_RUN_RESULT,
  COMMAND_EXEC_STATUS,
} from '@src/platform/executor/executor';

export class AppExecutor extends Disposable {
  private _runState = APP_RUN_STATE.INITIAL;
  private _hasError = false;
  private _executor: SubProcess | null = null;
  appPath = '';
  private readonly _onAppStart = this._register(new Emitter<IAppStart>());
  readonly onAppStart: Event<IAppStart> = this._onAppStart.event;
  private readonly _onCommandStart = this._register(new Emitter<ICommandStart>());
  readonly onCommandStart: Event<ICommandStart> = this._onCommandStart.event;
  private readonly _onCommandData = this._register(new Emitter<ICommandData>());
  readonly onCommandData: Event<ICommandData> = this._onCommandData.event;
  private readonly _onAppData = this._register(new Emitter<IAppData>());
  readonly onAppData: Event<IAppData> = this._onAppData.event;
  private readonly _onRunStateChange = this._register(new Emitter<APP_RUN_STATE>());
  readonly onRunStateChange: Event<APP_RUN_STATE> = this._onRunStateChange.event;
  constructor(
    private readonly appId: string,
    private readonly command: 'node' | 'python' = 'node',
    @ILogService private readonly logService: ILogService,
    @IAppService private readonly appService: IAppService,
    @IEnvironmentService private readonly environmentService: IEnvironmentService,
  ) {
    super();
    this.appPath = path.join(this.environmentService.workspacePath, this.appId);
  }
  private _getArgs(context?: IContext) {
    const args = [this.appPath];
    if (context) {
      for (const key of Object.keys(context)) {
        if (context[key]) {
          args.push(`-${key}=` + context[key]);
        }
      }
    }
    return args;
  }
  get isRunning() {
    return this._runState === APP_RUN_STATE.RUNNING;
  }
  get runState(): APP_RUN_STATE {
    return this._runState;
  }
  private set runState(state: APP_RUN_STATE) {
    this._runState = state;
    this._onRunStateChange.fire(state);
  }
  async start(context?: IContext) {
    const args = this._getArgs(context);
    this._executor = this._register(
      new SubProcess(this.logService, this.command, args, {
        stdio: 'pipe',
      }),
    );
    this.runState = APP_RUN_STATE.RUNNING;
    const meta = await this.appService.getAppInfo(this.appId);
    this._onAppStart.fire({ startTime: Date.now(), meta });
    this._executor.onStdoutData((data) => {
      try {
        const dataObj = JSON.parse(data);
        if (dataObj.startTime) {
          this._onCommandStart.fire(dataObj);
        } else if (dataObj.endTime) {
          this._onCommandData.fire({ code: COMMAND_EXEC_STATUS.SUCCESS, data: dataObj });
        } else {
          this.logService.info(data);
        }
      } catch (e) {
        this.logService.info(data);
      }
    });

    this._executor.onStderrData((data) => {
      try {
        const dataObj = JSON.parse(data);
        if (dataObj.endTime) {
          if (!this._hasError) {
            this._hasError = true;
          }
          this._onCommandData.fire({ code: COMMAND_EXEC_STATUS.ERROR, data: dataObj });
        } else {
          this.logService.info(data);
        }
      } catch (e) {
        this.logService.info(data);
      }
    });

    this._executor.onClose(({ code, signal }) => {
      this.logService.warn(
        `stdio of executor closed.code: ${code},signal: ${JSON.stringify(signal)}`,
      );
    });

    this._executor.onError((error) => {
      this.logService.error('executor has error.', error);
      this.runState = APP_RUN_STATE.ERROR;
    });

    this._executor.onExit(({ code, signal }) => {
      this.logService.warn(
        `stdio of executor exit.code: ${code},signal: ${JSON.stringify(signal)}`,
      );
      if (this.runState === APP_RUN_STATE.RUNNING) {
        this.runState = this._hasError ? APP_RUN_STATE.ERROR : APP_RUN_STATE.SUCCESS;
      }
      this._onAppData.fire({ endTime: Date.now(), state: this.runState as APP_RUN_RESULT, meta });
      this.dispose();
    });
  }
  pause() {
    this._executor?.kill(KILL_TYPE.PAUSE);
    this.runState = APP_RUN_STATE.PAUSED;
  }
  resume() {
    this._executor?.kill(KILL_TYPE.RESUME);
    this.runState = APP_RUN_STATE.RUNNING;
  }
  stop() {
    this._executor?.kill(KILL_TYPE.KILL);
    this.runState = APP_RUN_STATE.STOPED;
  }
  timeout() {
    this._executor?.kill(KILL_TYPE.KILL);
    this.runState = APP_RUN_STATE.TIMEOUT;
  }
  dispose() {
    super.dispose();
    this._executor = null;
  }
}
