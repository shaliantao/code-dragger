import path from 'path';
import { app } from 'electron';
import { NativeParsedArgs } from './argv';
import { memoize } from '@base/common/decorators';
import { createDecorator as createServiceDecorator } from '@base/instantiation/instantiation';

export const IEnvironmentService =
  createServiceDecorator<IEnvironmentService>('environmentService');

export interface IEnvironmentService {
  readonly _serviceBrand: undefined;
  args: NativeParsedArgs;
  homePath: string;
  appPath: string;
  appDataPath: string;
  userDataPath: string;
  tempPath: string;
  downloadPath: string;
  documentPath: string;
  workspacePath: string;
  groupPath: string;
  logsPath: string;
  settingsFile: string;
  mainLogFile: string;
  webLogFile: string;
  robotLogFile: string;
  resourcePath: string;
  templatePath: string;
  appTmplPath: string;
  compTmplPath: string;
  groupTmplPath: string;
  logLevel: string | undefined;
}

export class EnvironmentService implements IEnvironmentService {
  declare readonly _serviceBrand: undefined;
  readonly logsPath: string;

  constructor(protected _args: NativeParsedArgs) {
    if (!_args['logs-path']) {
      _args['logs-path'] = app.getPath('logs');
    }
    this.logsPath = _args['logs-path'];
  }
  get args(): NativeParsedArgs {
    return this._args;
  }
  @memoize
  get homePath(): string {
    return app.getPath('home');
  }
  @memoize
  get appDataPath(): string {
    return app.getPath('appData');
  }
  @memoize
  get userDataPath(): string {
    return app.getPath('userData');
  }
  @memoize
  get tempPath(): string {
    return app.getPath('temp');
  }
  @memoize
  get downloadPath(): string {
    return app.getPath('downloads');
  }
  @memoize
  get documentPath(): string {
    return app.getPath('documents');
  }
  @memoize
  get appPath(): string {
    return app.getAppPath();
  }
  @memoize
  get workspacePath(): string {
    if (app.isPackaged) {
      return path.join(this.appDataPath, 'workspace');
    }
    return path.join(this.resourcePath, 'workspace');
  }
  @memoize
  get groupPath(): string {
    if (app.isPackaged) {
      return path.join(this.appDataPath, 'group');
    }
    return path.join(this.resourcePath, 'group');
  }
  @memoize
  get settingsFile(): string {
    return path.join(this.userDataPath, 'settings.json');
  }
  @memoize
  get mainLogFile(): string {
    return path.join(this.logsPath, 'main.log');
  }
  @memoize
  get webLogFile(): string {
    return path.join(this.logsPath, 'web.log');
  }
  @memoize
  get robotLogFile(): string {
    return path.join(this.logsPath, 'robot.log');
  }
  @memoize
  get resourcePath(): string {
    if (app.isPackaged) {
      return process.resourcesPath;
    }
    return path.join(process.cwd(), 'static');
  }
  @memoize
  get templatePath(): string {
    return path.join(this.resourcePath, 'template');
  }
  @memoize
  get appTmplPath(): string {
    return path.join(this.templatePath, 'appTmpl');
  }
  @memoize
  get compTmplPath(): string {
    return path.join(this.templatePath, 'compTmpl');
  }
  @memoize
  get groupTmplPath(): string {
    return path.join(this.templatePath, 'groupTmpl');
  }
  get logLevel(): string | undefined {
    return this._args.log || process.env.VITE_LOG_LEVEL;
  }
}
