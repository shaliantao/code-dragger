import {
  IComponentService,
  IComponentMeta,
  IGroupComponentMeta,
} from '@src/platform/component/component';
import { InputsOutput } from '@src/platform/code/code';
import { ILogService } from '@base/log/logService';
import { IEnvironmentService } from '@base/environment/environmentService';
import {
  IGroupProjectService,
  GroupProjectService,
} from '@src/platform/project/groupProjectService';
import { IInstantiationService } from '@base/instantiation/instantiation';
import { ComponentManager } from '@src/platform/component/componentManager';
import { Disposable } from '@src/base/common/lifecycle';
import { ServiceCollection } from '@base/instantiation/serviceCollection';
import { SyncDescriptor } from '@base/instantiation/descriptors';
export class ComponentService extends Disposable implements IComponentService {
  readonly _serviceBrand: undefined;
  private componentManager: ComponentManager;
  constructor(
    @ILogService private readonly logService: ILogService,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @IEnvironmentService private readonly environmentService: IEnvironmentService,
  ) {
    super();
    this.componentManager = this.createServices().createInstance(ComponentManager);
  }
  private createServices(): IInstantiationService {
    const services = new ServiceCollection();
    services.set(IGroupProjectService, new SyncDescriptor(GroupProjectService));
    return this.instantiationService.createChild(services);
  }
  async getGroupComponentList(): Promise<IGroupComponentMeta[]> {
    return await this.componentManager.getGroupComponentList();
  }
  // 新增空白的组件模板
  async newComponent(info: Partial<IComponentMeta>): Promise<string> {
    const uuid = await this.componentManager.createComponent(info);
    return uuid!;
  }
  async delComponent(group: string, func: string): Promise<void> {
    await this.componentManager.delComponent(group, func);
  }
  // 保存组件代码
  async saveCode(group: string, func: string, codeStr: string): Promise<void> {
    await this.componentManager.saveCode(group, func, codeStr);
  }
  // 回显组件代码
  async showCode(group: string, func: string): Promise<string> {
    const res = await this.componentManager.showCode(group, func);
    return res;
  }
  async parseIOParams(codeStr: string): Promise<InputsOutput> {
    const res = this.componentManager.parseIOParams(codeStr);
    return res;
  }
  async getIOParams(group: string, func: string): Promise<InputsOutput> {
    const res = await this.componentManager.getIOParams(group, func);
    return res;
  }
  async setComponentInfo(
    group: string,
    func: string,
    info: Partial<IComponentMeta>,
  ): Promise<void> {
    await this.componentManager.setComponentInfo(group, func, info);
  }
  async getComponentInfo(group: string, func: string): Promise<IComponentMeta> {
    const info = await this.componentManager.getComponentInfo(group, func);
    return info;
  }
  async getWorkspace(group: string, func: string): Promise<string> {
    const path = await this.componentManager.getWorkspace(group, func);
    return path;
  }
}
