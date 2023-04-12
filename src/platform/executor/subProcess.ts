import { Disposable } from '@base/common/lifecycle';
import { Emitter, Event } from '@base/common/event';
import { KILL_TYPE } from './executor';
import { ChildProcess, fork } from 'child_process';
import type { SpawnOptionsWithoutStdio } from 'child_process';
import readline from 'readline';
import { ILogService } from '@src/base/log/logService';

interface ICodeSignal {
  code: number | null;
  signal: NodeJS.Signals | null;
}
export class SubProcess extends Disposable {
  #child: ChildProcess | null = null;
  private readonly _onStdoutData = this._register(new Emitter<string>());
  readonly onStdoutData: Event<string> = this._onStdoutData.event;
  private readonly _onStderrData = this._register(new Emitter<string>());
  readonly onStderrData: Event<string> = this._onStderrData.event;
  private readonly _onClose = this._register(new Emitter<ICodeSignal>());
  readonly onClose: Event<ICodeSignal> = this._onClose.event;
  private readonly _onExit = this._register(new Emitter<ICodeSignal>());
  readonly onExit: Event<ICodeSignal> = this._onExit.event;
  private readonly _onError = this._register(new Emitter<Error>());
  readonly onError: Event<Error> = this._onError.event;
  constructor(
    private readonly logService: ILogService,
    command: string,
    args: string[],
    options?: SpawnOptionsWithoutStdio,
  ) {
    super();
    try {
      this.logService.info('create child process');
      this.#child = fork(args?.[0], options);
      this.logService.info('create child process success');
      this.initEvent(this.#child);
    } catch (e) {
      this.logService.error('create child process failed: ' + e);
    }
  }
  initEvent(child: ChildProcess) {
    if (child.stdout !== null) {
      readline
        .createInterface({
          input: child.stdout,
          terminal: false,
        })
        .on('line', (data) => {
          this._onStdoutData.fire(data);
        });
    }
    if (child.stderr !== null) {
      readline
        .createInterface({
          input: child.stderr,
          terminal: false,
        })
        .on('line', (data) => {
          this._onStderrData.fire(data);
        });
    }
    child.on('data', (data) => {
      this.logService.debug(data);
    });

    child.on('close', (code, signal) => {
      this.kill(KILL_TYPE.KILL);
      this._onClose.fire({ code, signal });
    });
    child.on('exit', (code, signal) => {
      this._onExit.fire({ code, signal });
    });
    child.on('error', (error) => {
      this.kill(KILL_TYPE.KILL);
      this._onError.fire(error);
    });
  }
  write(data: string) {
    this.#child?.stdin?.write(data);
  }
  kill(signal?: NodeJS.Signals | number) {
    this.#child?.kill(signal);
  }
  dispose() {
    super.dispose();
    this.#child = null;
  }
}
