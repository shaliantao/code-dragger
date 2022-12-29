import { exec } from 'child_process';
import * as fs from 'fs';
import type * as pty from 'node-pty';
import { IFileService } from '@base/file/fileService';
import * as platform from '@base/common/platform';
import { Event, Emitter } from '@base/common/event';
import { getResolvedShellEnv } from '@base/shell/node/shellEnv';
import { Disposable } from '@base/common/lifecycle';
import { ILogService } from '@base/log/logService';
import {
  ITerminalChildProcess,
  ITerminalLaunchError,
  IShellLaunchConfig,
} from '@src/platform/terminal/terminal';

// Writing large amounts of data can be corrupted for some reason, after looking into this is
// appears to be a race condition around writing to the FD which may be based on how powerful the
// hardware is. The workaround for this is to space out when large amounts of data is being written
// to the terminal. See https://github.com/microsoft/vscode/issues/38137
const WRITE_MAX_CHUNK_SIZE = 50;
const WRITE_INTERVAL_MS = 5;

export class TerminalProcess extends Disposable implements ITerminalChildProcess {
  private _exitCode?: number;
  private _closeTimeout: any;
  private _isDisposed = false;
  private readonly _initialCwd: string;
  private _ptyProcess?: pty.IPty;
  private _currentTitle = '';
  private _titleInterval: NodeJS.Timer | null = null;
  private _writeQueue: string[] = [];
  private _writeTimeout?: NodeJS.Timeout;
  private _delayedResizer?: DelayedResizer;
  private _processStartupComplete?: Promise<void>;
  private readonly _ptyOptions: pty.IPtyForkOptions | pty.IWindowsPtyForkOptions;
  private readonly _onProcessData = this._register(new Emitter<string>());
  public get onProcessData(): Event<string> {
    return this._onProcessData.event;
  }
  private readonly _onProcessExit = this._register(new Emitter<number>());
  public get onProcessExit(): Event<number> {
    return this._onProcessExit.event;
  }
  private readonly _onProcessReady = this._register(new Emitter<{ pid: number; cwd: string }>());
  public get onProcessReady(): Event<{ pid: number; cwd: string }> {
    return this._onProcessReady.event;
  }
  private readonly _onProcessTitleChanged = this._register(new Emitter<string>());
  public get onProcessTitleChanged(): Event<string> {
    return this._onProcessTitleChanged.event;
  }
  constructor(
    private readonly _shellLaunchConfig: IShellLaunchConfig,
    cwd: string,
    @ILogService private readonly logService: ILogService,
    @IFileService private readonly fileService: IFileService,
  ) {
    super();
    this._initialCwd = cwd;
    this._ptyOptions = {
      name: 'xterm-256color',
      cwd,
    };
  }
  private async _resolveShellEnv(): Promise<typeof process.env> {
    if (platform.isWindows) {
      return process.env;
    }

    try {
      return await getResolvedShellEnv(this.logService);
    } catch (error) {
      this.logService.error('ptyHost was unable to resolve shell environment', error);

      return {};
    }
  }
  private _setupTitlePolling(ptyProcess: pty.IPty) {
    // Send initial timeout async to give event listeners a chance to init
    setTimeout(() => {
      this._sendProcessTitle(ptyProcess);
    }, 0);
    // Setup polling for non-Windows, for Windows `process` doesn't change
    if (!platform.isWindows) {
      this._titleInterval = setInterval(() => {
        if (this._currentTitle !== ptyProcess.process) {
          this._sendProcessTitle(ptyProcess);
        }
      }, 200);
    }
  }
  private _sendProcessTitle(ptyProcess: pty.IPty): void {
    if (this._isDisposed) {
      return;
    }
    this._currentTitle = ptyProcess.process;
    this._onProcessTitleChanged.fire(this._currentTitle);
  }
  private _sendProcessId(pid: number) {
    this._onProcessReady.fire({ pid, cwd: this._initialCwd });
  }
  // Allow any trailing data events to be sent before the exit event is sent.
  // See https://github.com/Tyriar/node-pty/issues/72
  private _queueProcessExit() {
    if (this._closeTimeout) {
      clearTimeout(this._closeTimeout);
    }
    this._closeTimeout = setTimeout(() => this._kill(), 250);
  }
  private async _setupPtyProcess(
    shellLaunchConfig: IShellLaunchConfig,
    options: pty.IPtyForkOptions,
  ): Promise<void> {
    const args = shellLaunchConfig.args || [];
    this.logService.trace('IPty#spawn', shellLaunchConfig.executable, args, options);
    const ptyProcess = (await import('node-pty')).spawn(
      shellLaunchConfig.executable!,
      args,
      options,
    );
    this._ptyProcess = ptyProcess;
    this._processStartupComplete = new Promise<void>((c) => {
      this.onProcessReady(() => c());
    });
    ptyProcess.onData((data) => {
      this._onProcessData.fire(data);
      if (this._closeTimeout) {
        clearTimeout(this._closeTimeout);
        this._queueProcessExit();
      }
    });
    ptyProcess.onExit((e) => {
      this._exitCode = e.exitCode;
      this._queueProcessExit();
    });
    this._setupTitlePolling(ptyProcess);
    this._sendProcessId(ptyProcess.pid);
  }
  private async _validateCwd(): Promise<undefined | ITerminalLaunchError> {
    try {
      const result = await this.fileService.getStat(this._initialCwd);
      if (!result.isDirectory()) {
        return {
          message: `Starting directory ${this._initialCwd.toString()} is not a directory`,
        };
      }
    } catch (err) {
      return {
        message: `Starting directory ${this._initialCwd.toString()} does not exist`,
      };
    }
    return undefined;
  }
  private async _kill(): Promise<void> {
    // Wait to kill to process until the start up code has run. This prevents us from firing a process exit before a
    // process start.
    await this._processStartupComplete;
    if (this._isDisposed) {
      return;
    }
    // Attempt to kill the pty, it may have already been killed at this
    // point but we want to make sure
    try {
      if (this._ptyProcess) {
        this.logService.trace('IPty#kill');
        this._ptyProcess.kill();
      }
    } catch (ex) {
      // Swallow, the pty has already been killed
    }
    this._onProcessExit.fire(this._exitCode || 0);
    this.dispose();
  }
  private _doWrite(): void {
    const data = this._writeQueue.shift()!;
    this.logService.trace('IPty#write', `${data.length} characters`);
    this._ptyProcess!.write(data);
  }
  private _startWrite(): void {
    // Don't write if it's already queued of is there is nothing to write
    if (this._writeTimeout !== undefined || this._writeQueue.length === 0) {
      return;
    }

    this._doWrite();

    // Don't queue more writes if the queue is empty
    if (this._writeQueue.length === 0) {
      this._writeTimeout = undefined;
      return;
    }

    // Queue the next write
    this._writeTimeout = setTimeout(() => {
      this._writeTimeout = undefined;
      this._startWrite();
    }, WRITE_INTERVAL_MS);
  }
  public async start(): Promise<ITerminalLaunchError | undefined> {
    const result = await this._validateCwd();
    if (result !== undefined) {
      return result;
    }
    try {
      const shellEnv = await this._resolveShellEnv();
      this._ptyOptions.env = shellEnv as { [key: string]: string };
      await this._setupPtyProcess(this._shellLaunchConfig, this._ptyOptions);
      return undefined;
    } catch (err) {
      const e = err as Error;
      this.logService.trace('IPty#spawn native exception', err);
      return { message: `A native exception occurred during launch (${e.message})` };
    }
  }
  public shutdown(immediate: boolean): void {
    if (immediate) {
      this._kill();
    } else {
      this._queueProcessExit();
    }
  }
  public input(data: string): void {
    if (this._isDisposed || !this._ptyProcess) {
      return;
    }
    for (let i = 0; i <= Math.floor(data.length / WRITE_MAX_CHUNK_SIZE); i++) {
      this._writeQueue.push(data.substr(i * WRITE_MAX_CHUNK_SIZE, WRITE_MAX_CHUNK_SIZE));
    }
    this._startWrite();
  }
  public getInitialCwd(): Promise<string> {
    return Promise.resolve(this._initialCwd);
  }
  public getCwd(): Promise<string> {
    if (platform.isMacintosh) {
      return new Promise<string>((resolve) => {
        if (!this._ptyProcess) {
          resolve(this._initialCwd);
          return;
        }
        this.logService.trace('IPty#pid');
        exec('lsof -OPl -p ' + this._ptyProcess.pid + ' | grep cwd', (_error, stdout, _stderr) => {
          if (stdout !== '') {
            resolve(stdout.substring(stdout.indexOf('/'), stdout.length - 1));
          }
        });
      });
    }

    if (platform.isLinux) {
      return new Promise<string>((resolve) => {
        if (!this._ptyProcess) {
          resolve(this._initialCwd);
          return;
        }
        this.logService.trace('IPty#pid');
        fs.readlink('/proc/' + this._ptyProcess.pid + '/cwd', (err, linkedstr) => {
          if (err) {
            resolve(this._initialCwd);
          }
          resolve(linkedstr);
        });
      });
    }

    return new Promise<string>((resolve) => {
      resolve(this._initialCwd);
    });
  }
  public resize(cols: number, rows: number): void {
    if (this._isDisposed) {
      return;
    }
    if (typeof cols !== 'number' || typeof rows !== 'number' || isNaN(cols) || isNaN(rows)) {
      return;
    }
    // Ensure that cols and rows are always >= 1, this prevents a native
    // exception in winpty.
    if (this._ptyProcess) {
      cols = Math.max(cols, 1);
      rows = Math.max(rows, 1);

      // Delay resize if needed
      if (this._delayedResizer) {
        this._delayedResizer.cols = cols;
        this._delayedResizer.rows = rows;
        return;
      }

      this.logService.trace('IPty#resize', cols, rows);
      try {
        this._ptyProcess.resize(cols, rows);
      } catch (err) {
        const e = err as Error;
        // Swallow error if the pty has already exited
        this.logService.trace('IPty#resize exception ' + e.message);
        if (this._exitCode !== undefined && e.message !== 'ioctl(2) failed, EBADF') {
          throw e;
        }
      }
    }
  }
  public getLatency(): Promise<number> {
    return Promise.resolve(0);
  }
  public dispose(): void {
    this._isDisposed = true;
    if (this._titleInterval) {
      clearInterval(this._titleInterval);
    }
    this._titleInterval = null;
    this._onProcessData.dispose();
    this._onProcessExit.dispose();
    this._onProcessReady.dispose();
    this._onProcessTitleChanged.dispose();
    super.dispose();
  }
}

/**
 * Tracks the latest resize event to be trigger at a later point.
 */
class DelayedResizer extends Disposable {
  public rows: number | undefined;
  public cols: number | undefined;
  private _timeout: NodeJS.Timeout;

  private readonly _onTrigger = this._register(new Emitter<{ rows?: number; cols?: number }>());
  public get onTrigger(): Event<{ rows?: number; cols?: number }> {
    return this._onTrigger.event;
  }

  constructor() {
    super();
    this._timeout = setTimeout(() => {
      this._onTrigger.fire({ rows: this.rows, cols: this.cols });
    }, 1000);
    this._register({
      dispose: () => {
        clearTimeout(this._timeout);
      },
    });
  }

  dispose(): void {
    super.dispose();
    clearTimeout(this._timeout);
  }
}
