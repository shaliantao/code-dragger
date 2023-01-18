import { IFileStat } from '@src/platform/common/types';
import { IPackageInfo } from '@src/platform/project/project';
import { Event } from '@base/common/event';
import { createDecorator } from '@base/instantiation/instantiation';
import { ComponentItem } from '@src/platform/component/component';
import { GroupModel, IGroupState } from '@src/platform/group/groupModel';
import { IRequiredGroupDep } from '@src/platform/command/command';

export const IGroupService = createDecorator<IGroupService>('groupService');

export interface IGroupMeta {
  id: string;
  name: string;
  key: string;
  desc: string;
  diffPlatform: boolean;
}

export interface IGroupInfo extends IGroupState, IGroupMeta {
  version: number;
}

export const initialMetaInfo: (uuid: string) => IGroupMeta = (uuid) => ({
  id: uuid,
  name: '未命名',
  key: 'Default',
  desc: '',
  diffPlatform: false,
});

export type GroupItem = IGroupMeta & IFileStat;

export interface IGroupService {
  readonly _serviceBrand: undefined;
  readonly onTypesChange: Event<void>;
  editableGroupMap: Map<string, GroupModel>;
  enabledGroupMap: Map<string, GroupModel>;
  getList(): Promise<GroupItem[]>;
  getComponentList(key: string): Promise<ComponentItem[]>;
  newGroup(info: Partial<IGroupMeta>): Promise<string>;
  delGroup(key: string): Promise<void>;
  setGroupInfo(key: string, info: Partial<IGroupMeta>): Promise<void>;
  getGroupInfo(key: string): Promise<IGroupInfo>;
  getWorkspace(key: string): Promise<string>;
  setGroupTypes(key: string, typeItem: string): Promise<void>;
  getTypes(): Promise<string[]>;
  getPackageInfo(key: string): Promise<IPackageInfo>;
  publish(key: string): Promise<void>;
  getVersions(key: string): Promise<object[]>;
  syncEnabledGroups(): Promise<void>;
  checkRequiredGroups(deps: IRequiredGroupDep[]);
}
