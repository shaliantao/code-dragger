/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import type { Logger } from 'log4js';
import { createDecorator as createServiceDecorator } from '@base/instantiation/instantiation';
import { IDisposable, Disposable } from '@base/common/lifecycle';
import { Event, Emitter } from '@base/common/event';
import { ILoggerService } from '@base/log/loggerService';
import { LogLevel, getLogLevel } from '@base/log/logLevel';

export const ILogService = createServiceDecorator<ILogService>('logService');

export interface ILogger extends IDisposable {
  onDidChangeLogLevel: Event<LogLevel>;
  getLevel(): LogLevel;
  setLevel(level: LogLevel): void;

  trace(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string | Error, ...args: any[]): void;
  fatal(message: string | Error, ...args: any[]): void;

  /**
   * An operation to flush the contents. Can be synchronous.
   */
  flush(): void;
}

export interface ILogService extends ILogger {
  readonly _serviceBrand: undefined;
}

export abstract class AbstractLogService extends Disposable {
  public ctorName: string | undefined;
  private readonly _onDidChangeLogLevel: Emitter<LogLevel> = this._register(
    new Emitter<LogLevel>(),
  );
  readonly onDidChangeLogLevel: Event<LogLevel> = this._onDidChangeLogLevel.event;
  constructor(protected logger: Logger) {
    super();
  }
  setLevel(level: LogLevel): void {
    if (this.logger.level !== level) {
      this.logger.level = level;
      this._onDidChangeLogLevel.fire(level);
    }
  }

  getLevel(): LogLevel {
    return getLogLevel(this.logger.level);
  }
}

export class ConsoleLogMainService extends AbstractLogService implements ILogService {
  declare readonly _serviceBrand: undefined;

  constructor(@ILoggerService readonly loggerService: ILoggerService) {
    super(loggerService.getLogger('main'));
  }

  trace(message: string, ...args: any[]): void {
    this.logger.trace(`${this.ctorName} - ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.logger.debug(`${this.ctorName} - ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.logger.info(`${this.ctorName} - ${message}`, ...args);
  }

  warn(message: string | Error, ...args: any[]): void {
    this.logger.warn(`${this.ctorName} - ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.logger.error(`${this.ctorName} - ${message}`, ...args);
  }

  fatal(message: string, ...args: any[]): void {
    this.logger.fatal(`${this.ctorName} - ${message}`, ...args);
  }

  dispose(): void {
    // noop
  }

  flush(): void {
    // noop
  }
}

export class NullLogService implements ILogService {
  declare readonly _serviceBrand: undefined;
  readonly onDidChangeLogLevel: Event<LogLevel> = new Emitter<LogLevel>().event;
  setLevel(_level: LogLevel): void {}
  getLevel(): LogLevel {
    return LogLevel.Info;
  }
  trace(_message: string, ..._args: any[]): void {}
  debug(_message: string, ..._args: any[]): void {}
  info(_message: string, ..._args: any[]): void {}
  warn(_message: string, ..._args: any[]): void {}
  error(_message: string | Error, ..._args: any[]): void {}
  fatal(_message: string | Error, ..._args: any[]): void {}
  dispose(): void {}
  flush(): void {}
}
