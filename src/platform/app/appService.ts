/**
 * 提供ipc通信的接口
 * 通过依赖注入模式将跨语言相关的代码注入到具体的Manager中调用执行
 */

import { ILogService } from '@base/log/logService';
import { IEnvironmentService } from '@base/environment/environmentService';
import { IInstantiationService } from '@base/instantiation/instantiation';
import { Disposable } from '@base/common/lifecycle';
import { ServiceCollection } from '@base/instantiation/serviceCollection';
import { SyncDescriptor } from '@base/instantiation/descriptors';
import { IAppService, AppItem, IAppMeta, IAppInfo } from '@src/platform/app/app';
import { CommandNode } from '@src/platform/common/types';
import { ICommandService } from '@src/platform/command/command';
import { CommandService } from '@src/platform/command/commandService';
import { AppManager } from '@src/platform/app/appManager';
import { AppModel } from '@src/platform/app/appModel';
import { IAppProjectService, AppProjectService } from '@src/platform/project/appProjectService';

export class AppService extends Disposable implements IAppService {
  readonly _serviceBrand: undefined;
  private appManager: AppManager;
  get editableAppMap() {
    return this.appManager.editableAppMap;
  }
  get enabledAppMap() {
    return this.appManager.enabledAppMap;
  }
  constructor(
    @ILogService private readonly logService: ILogService,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @IEnvironmentService private readonly environmentService: IEnvironmentService,
  ) {
    super();
    this.appManager = this.createServices().createInstance(AppManager);
  }

  private createServices(): IInstantiationService {
    const services = new ServiceCollection();
    services.set(ICommandService, new SyncDescriptor(CommandService));
    services.set(IAppProjectService, new SyncDescriptor(AppProjectService));
    return this.instantiationService.createChild(services);
  }
  async getList(): Promise<AppItem[]> {
    const list = await this.appManager.getAppList();
    return list;
  }
  async newApp(info: Partial<IAppMeta>): Promise<string> {
    const uuid = await this.appManager.newApp(info);
    return uuid;
  }
  async delApp(uuid: string): Promise<void> {
    await this.appManager.delApp(uuid);
  }
  async saveApp(uuid: string, jsonArr: CommandNode[], info: Partial<IAppMeta>): Promise<void> {
    await this.appManager.saveApp(uuid, jsonArr, info);
  }
  async initBeforeStart(appModel: AppModel, jsonArr: CommandNode[]): Promise<void> {
    await this.appManager.initBeforeStart(appModel, jsonArr);
  }
  async showFlow(uuid: string): Promise<CommandNode[]> {
    const flowList = await this.appManager.showApp(uuid);
    return flowList;
  }
  async getAppInfo(uuid: string): Promise<IAppInfo> {
    const info = await this.appManager.getAppInfo(uuid);
    return info;
  }
  async getWorkspace(uuid: string): Promise<string> {
    const path = this.appManager.getWorkspace(uuid);
    return path;
  }
  async publish(uuid: string): Promise<void> {
    await this.appManager.publish(uuid);
  }
  async checkRequiredEnabledApp(uuid: string) {
    await this.appManager.checkRequiredEnabledApp(uuid);
  }
}
