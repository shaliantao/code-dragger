import { IGroupService, GroupItem, IGroupMeta, IGroupInfo } from '@src/platform/group/group';
import { IPackageInfo } from '@src/platform/project/project';
import { ILogService } from '@base/log/logService';
import { IEnvironmentService } from '@base/environment/environmentService';
import {
  IComponentProjectService,
  CompProjectService,
} from '@src/platform/project/compProjectService';
import {
  IGroupProjectService,
  GroupProjectService,
} from '@src/platform/project/groupProjectService';
import { IInstantiationService } from '@base/instantiation/instantiation';
import { GroupManager } from '@src/platform/group/groupManager';
import { IRequiredGroupDep } from '@src/platform/command/command';
import { Disposable } from '@src/base/common/lifecycle';
import { Emitter, Event } from '@base/common/event';
import { ServiceCollection } from '@base/instantiation/serviceCollection';
import { SyncDescriptor } from '@base/instantiation/descriptors';
import { ComponentItem } from '@src/platform/component/component';

export class GroupService extends Disposable implements IGroupService {
  readonly _serviceBrand: undefined;
  private groupManager: GroupManager;
  private readonly _onTypesChange = this._register(new Emitter<void>());
  readonly onTypesChange: Event<void> = this._onTypesChange.event;
  get editableGroupMap() {
    return this.groupManager.editableGroupMap;
  }
  get enabledGroupMap() {
    return this.groupManager.enabledGroupMap;
  }
  constructor(
    @ILogService private readonly logService: ILogService,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @IEnvironmentService private readonly environmentService: IEnvironmentService,
  ) {
    super();
    this.groupManager = this.createServices().createInstance(GroupManager);
  }
  private createServices(): IInstantiationService {
    const services = new ServiceCollection();
    services.set(IComponentProjectService, new SyncDescriptor(CompProjectService));
    services.set(IGroupProjectService, new SyncDescriptor(GroupProjectService));
    return this.instantiationService.createChild(services);
  }
  async getList(): Promise<GroupItem[]> {
    return await this.groupManager.getGroupList();
  }
  async getComponentList(key: string): Promise<ComponentItem[]> {
    return await this.groupManager.getComponentList(key);
  }
  // 新增空白的组件模板
  async newGroup(info: Partial<IGroupMeta>): Promise<string> {
    const uuid = await this.groupManager.newGroup(info);
    return uuid!;
  }
  async delGroup(key: string): Promise<void> {
    await this.groupManager.delGroup(key);
  }
  async setGroupInfo(key: string, info: Partial<IGroupMeta>): Promise<void> {
    await this.groupManager.setGroupInfo(key, info);
  }
  async getGroupInfo(key: string): Promise<IGroupInfo> {
    const info = await this.groupManager.getGroupInfo(key);
    return info;
  }
  async getWorkspace(key: string): Promise<string> {
    const path = await this.groupManager.getWorkspace(key);
    return path;
  }
  async setTypes(key: string, typeItem: string): Promise<void> {
    await this.groupManager.setTypes(key, typeItem);
    this._onTypesChange.fire();
  }
  async getTypes(): Promise<string[]> {
    const types = await this.groupManager.getTypes();
    return types;
  }
  async getPackageInfo(key: string): Promise<IPackageInfo> {
    const info = await this.groupManager.getPackageInfo(key);
    return info;
  }
  async publish(key: string): Promise<void> {
    await this.groupManager.publish(key);
  }
  async getVersions(key: string): Promise<object[]> {
    return await this.groupManager.getVersions(key);
  }

  async syncEnabledGroups(): Promise<void> {
    await this.groupManager.syncEnabledGroups();
  }
  async checkRequiredGroups(deps: IRequiredGroupDep[]): Promise<void> {
    await this.groupManager.checkRequiredGroups(deps);
  }
  async uploadGroup() {
    await this.groupManager.uploadGroup();
  }
}
