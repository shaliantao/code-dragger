import chalk from 'chalk';
import { FloatWindow } from '@src/floatWindow';
import { ILogService } from '@base/log/logService';
import { IInstantiationService } from '@base/instantiation/instantiation';
import { createDecorator } from '@base/instantiation/instantiation';
import { Emitter, Event } from '@base/common/event';
import { Disposable } from '@base/common/lifecycle';
import { AppExecutor } from '@src/platform/executor/appExecutor';
import { ITerminalService } from '@src/platform/terminal/terminalService';
import { IAppService } from '@src/platform/app/app';
import {
  APP_RUN_STATE,
  COMMAND_EXEC_STATUS,
  ICommandData,
  ICommandStart,
  IAppStartWithMeta,
  IAppDataWithMeta,
  IPrint,
} from '@src/platform/executor/executor';
import { AppModel } from '../app/appModel';
import { CommandNode } from '../common/types';
import { formatToDateTime } from '/@/utils/dateUtil';
import dayjs from 'dayjs';

export const IExecutorService = createDecorator<IExecutorService>('executorService');

export interface IExecutorService {
  readonly onRunStateChange: Event<APP_RUN_STATE>;
  readonly onCommandStart: Event<ICommandStart>;
  readonly onCommandData: Event<ICommandData>;
  readonly onAppStart: Event<IAppStartWithMeta>;
  readonly onAppEnd: Event<IAppDataWithMeta>;
  startDevApp(appId: string, appFlow: CommandNode[]): Promise<void>;
  startTaskApp(appId: string): Promise<void>;
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
  private readonly _onAppStart = this._register(new Emitter<IAppStartWithMeta>());
  readonly onAppStart: Event<IAppStartWithMeta> = this._onAppStart.event;
  private readonly _onCommandStart = this._register(new Emitter<ICommandStart>());
  readonly onCommandStart: Event<ICommandStart> = this._onCommandStart.event;
  private readonly _onCommandData = this._register(new Emitter<ICommandData>());
  readonly onCommandData: Event<ICommandData> = this._onCommandData.event;
  private readonly _onAppEnd = this._register(new Emitter<IAppDataWithMeta>());
  readonly onAppEnd: Event<IAppDataWithMeta> = this._onAppEnd.event;
  constructor(
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @ILogService private readonly logService: ILogService,
    @IAppService private readonly appService: IAppService,
    @ITerminalService private readonly terminalService: ITerminalService,
  ) {
    super();
    this._floatWin = this.instantiationService.createInstance(FloatWindow);
    this._floatWin.createWindow();
  }
  // 启动开发模式应用，运行编辑中状态的应用
  async startDevApp(appId: string, appFlow: CommandNode[]) {
    const appModel = this.appService.editableAppMap.get(appId);
    if (appModel) {
      await this.appService.initBeforeStart(appModel, appFlow);
      await this.start(appModel, this.printToTerminal(appModel.root));
    } else {
      throw new Error('app not found');
    }
  }
  // 启动任务模式应用，运行启用中的应用
  async startTaskApp(appId: string) {
    this.logService.debug('startTaskApp:', appId);
    await this.appService.checkRequiredEnabledApp(appId);
    const appModel = this.appService.enabledAppMap.get(appId);
    if (appModel) {
      const appFlow = await appModel.getAppFlow();
      await this.appService.initBeforeStart(appModel, appFlow);
      this._floatWin?.showInactive();
      await this.start(appModel);
    } else {
      throw new Error('app not found');
    }
  }
  private async start(appModel: AppModel, print?: IPrint) {
    this._app = this._register(
      this.instantiationService.createInstance(AppExecutor, appModel.root, 'node'),
    );
    this._initListener(appModel, print);
    await this._app.start();
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
  private _initListener(appModel: AppModel, print?: IPrint) {
    this._app?.onAppStart((data) => {
      this._onAppStart.fire({ meta: appModel.item, ...data });
      if (print) {
        print.onAppStart({ meta: appModel.item, ...data });
      }
    });
    this._app?.onRunStateChange((state) => {
      this._onRunStateChange.fire(state);
      if (print) {
        print.onAppStateChange(state);
      }
    });
    this._app?.onCommandStart((data) => {
      const { startTime, info, meta, inputs } = data || {};
      this._onCommandStart.fire({ startTime, info, meta, inputs });
      if (print) {
        print.onCommandStart(data);
      }
    });
    this._app?.onCommandData((data) => {
      this._onCommandData.fire(data);
      if (print) {
        print.onCommandData(data);
      }
    });
    this._app?.onAppEnd((data) => {
      this._app = null;
      this._onAppEnd.fire({ meta: appModel.item, ...data });
      //this._floatWin?.hide();
      //setTimeout(() => this._floatWin?.hide(), 2000);
    });
  }
  private printToTerminal(root: string): IPrint {
    return {
      onAppStart: (data: IAppStartWithMeta) => {
        this.terminalService.printTerminalData(
          root,
          chalk.white(
            `\r\n${chalk.bold(
              `[${formatToDateTime(dayjs(data.startTime))}] 开始运行: ${data.meta.name}`,
            )} \r\n`,
          ),
        );
      },
      onAppStateChange: (state: APP_RUN_STATE) => {
        this.terminalService.printTerminalData(
          root,
          chalk.white(`\r\n${chalk.bold(`[${formatToDateTime()}] 运行状态: ${state}`)} \r\n`),
        );
      },
      onCommandStart: (data: ICommandStart) => {
        const inputs = data.inputs?.map(
          (input) => `${input.name || '未命名'}: ${input.value || '未赋值'}`,
        );
        const inputsText = Array.isArray(inputs) ? `\r\n\r\n${inputs.join('\r\n')}` : '暂无输入';
        this.terminalService.printTerminalData(
          root,
          chalk.blue('\r\n--------------------------------------------------------------\r\n'),
        );
        const title = chalk.blueBright(
          `\r\n${chalk.bold(`[${formatToDateTime(dayjs(data.startTime))}] 开始: `)} ${
            data.meta?.name
          }\r\n${chalk.italic(`\r\n节点输入：${inputsText}\r\n`)}`,
        );
        this.terminalService.printTerminalData(root, title);
      },
      onCommandData: (data: ICommandData) => {
        let text;
        if (data.code === COMMAND_EXEC_STATUS.SUCCESS) {
          text = chalk.greenBright(
            `\r\n${chalk.bold(
              `[${formatToDateTime(dayjs(data.data.endTime))}] 成功: `,
            )}\r\n${chalk.italic(`\r\n节点输出：${data.data.result || '暂无输出'}\r\n`)}
            `,
          );
        } else if (data.code === COMMAND_EXEC_STATUS.ERROR) {
          text = chalk.redBright(
            `\r\n${chalk.bold(
              `[${formatToDateTime(dayjs(data.data.endTime))}] 失败: `,
            )}\r\n错误信息：${data.data.error}\r\n`,
          );
        } else if (data.code === COMMAND_EXEC_STATUS.LOG) {
          text = chalk.white(
            `\r\n[${formatToDateTime(dayjs(data.data.time))}] 日志: ${data.data.info}\r\n`,
          );
        }
        this.terminalService.printTerminalData(root, text);
      },
    };
  }
  dispose(): void {
    super.dispose();
    this._app = null;
    this._floatWin?.destroy();
    this._floatWin = null;
  }
}
