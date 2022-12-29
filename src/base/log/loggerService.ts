import log4js, { Logger } from 'log4js';
import { createDecorator as createServiceDecorator } from '@base/instantiation/instantiation';
import { IEnvironmentService } from '@base/environment/environmentService';
import { getLogLevel } from '@base/log/logLevel';

export const ILoggerService = createServiceDecorator<ILoggerService>('loggerService');

export interface ILoggerService {
  readonly _serviceBrand: undefined;

  getLogger(category: 'main' | 'robot' | 'web'): Logger;
}

export class LoggerService implements ILoggerService {
  declare readonly _serviceBrand: undefined;
  constructor(@IEnvironmentService private readonly environmentService: IEnvironmentService) {
    this.init();
  }
  init() {
    log4js.configure({
      appenders: {
        stdout: {
          //控制台输出
          type: 'console',
        },
        main: {
          type: 'dateFile',
          filename: this.environmentService.mainLogFile,
          pattern: '.yyyy-MM',
        },
        robot: {
          type: 'dateFile',
          filename: this.environmentService.robotLogFile,
          pattern: '.yyyy-MM-dd',
        },
        web: {
          type: 'dateFile',
          filename: this.environmentService.webLogFile,
          pattern: '.yyyy-MM-dd',

          layout: { type: 'messagePassThrough' },
        },
      },
      categories: {
        main: {
          appenders: ['stdout', 'main'],
          level: getLogLevel(this.environmentService.logLevel),
        },
        robot: {
          appenders: ['stdout', 'main'],
          level: getLogLevel(this.environmentService.logLevel),
        },
        web: { appenders: ['stdout'], level: getLogLevel(this.environmentService.logLevel) },
        default: { appenders: ['stdout'], level: getLogLevel(this.environmentService.logLevel) },
      },
    });
  }
  getLogger(category: 'main' | 'robot' | 'web'): Logger {
    const logger = log4js.getLogger(category);
    return logger;
  }
}
