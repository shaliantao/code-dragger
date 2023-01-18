import { Disposable } from '@base/common/lifecycle';
import { ILogService } from '@base/log/logService';
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
  private readonly _onAppStart = this._register(new Emitter<IAppStart>());
  readonly onAppStart: Event<IAppStart> = this._onAppStart.event;
  private readonly _onCommandStart = this._register(new Emitter<ICommandStart>());
  readonly onCommandStart: Event<ICommandStart> = this._onCommandStart.event;
  private readonly _onCommandData = this._register(new Emitter<ICommandData>());
  readonly onCommandData: Event<ICommandData> = this._onCommandData.event;
  private readonly _onAppEnd = this._register(new Emitter<IAppData>());
  readonly onAppEnd: Event<IAppData> = this._onAppEnd.event;
  private readonly _onRunStateChange = this._register(new Emitter<APP_RUN_STATE>());
  readonly onRunStateChange: Event<APP_RUN_STATE> = this._onRunStateChange.event;
  constructor(
    private readonly appPath: string,
    private readonly command: 'node' | 'python' = 'node',
    @ILogService private readonly logService: ILogService,
  ) {
    super();
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
  async start(context?: IContext): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = this._getArgs(context);
      this._executor = this._register(
        new SubProcess(this.logService, this.command, args, {
          stdio: 'pipe',
        }),
      );
      this._onAppStart.fire({ startTime: Date.now() });
      this.runState = APP_RUN_STATE.RUNNING;
      this._executor.onStdoutData((data) => {
        try {
          const dataObj = JSON.parse(data);
          if (dataObj.startTime) {
            const meta = dataObj.meta;
            if (dataObj.inputs) {
              dataObj.inputs = meta.inputs.map((item) => {
                item.value = dataObj.inputs[item.key];
                return item;
              });
            }
            this._onCommandStart.fire(dataObj);
          } else if (dataObj.endTime) {
            this._onCommandData.fire({ code: COMMAND_EXEC_STATUS.SUCCESS, data: dataObj });
          } else {
            this._onCommandData.fire({
              code: COMMAND_EXEC_STATUS.LOG,
              data: { time: Date.now(), info: data },
            });
          }
        } catch (e) {
          this._onCommandData.fire({
            code: COMMAND_EXEC_STATUS.LOG,
            data: { time: Date.now(), info: data },
          });
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
            reject('onStderrData: ' + dataObj.error);
          } else {
            this.logService.info(data);
          }
        } catch (e) {
          this.logService.info(data);
        }
      });

      this._executor.onClose(({ code, signal }) => {
        this.logService.warn(
          `onClose: stdio of executor closed.code: ${code},signal: ${JSON.stringify(signal)}`,
        );
      });

      this._executor.onError((error) => {
        this.logService.error('executor has error.', error);
        this.runState = APP_RUN_STATE.ERROR;
        reject('onError: ' + error);
      });

      this._executor.onExit(({ code, signal }) => {
        this.logService.warn(
          `onExit: stdio of executor exit.code: ${code},signal: ${JSON.stringify(signal)}`,
        );
        if (this.runState === APP_RUN_STATE.RUNNING) {
          this.runState = this._hasError ? APP_RUN_STATE.ERROR : APP_RUN_STATE.SUCCESS;
        }
        this._onAppEnd.fire({ endTime: Date.now(), state: this.runState as APP_RUN_RESULT });
        resolve();
        this.dispose();
      });
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
