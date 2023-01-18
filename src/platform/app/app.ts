import { createDecorator } from '@base/instantiation/instantiation';
import { CommandNode, IFileStat } from '@src/platform/common/types';
import { AppModel, IAppState } from '@src/platform/app/appModel';

export const IAppService = createDecorator<IAppService>('appService');
export interface IAppMeta {
  id: string;
  name: string;
  desc: string;
  diffPlatform: boolean;
}

export interface IAppInfo extends IAppState, IAppMeta {
  version: number;
}

export const initialMetaInfo: (uuid: string) => IAppMeta = (uuid) => ({
  id: uuid,
  name: '未命名',
  desc: '',
  diffPlatform: false,
});

export type AppItem = IAppMeta & IFileStat;

export interface IAppService {
  readonly _serviceBrand: undefined;
  editableAppMap: Map<string, AppModel>;
  enabledAppMap: Map<string, AppModel>;
  getList(): Promise<AppItem[]>;
  newApp(info: Partial<IAppMeta>): Promise<string>;
  delApp(uuid: string): Promise<void>;
  saveApp(uuid: string, jsonArr: CommandNode[], info: Partial<IAppMeta>): Promise<void>;
  initBeforeStart(appModel: AppModel, jsonArr: CommandNode[]): Promise<void>;
  showFlow(uuid: string): Promise<CommandNode[]>;
  getAppInfo(uuid: string): Promise<IAppInfo>;
  getWorkspace(uuid: string): Promise<string>;
  publish(key: string): Promise<void>;
  checkRequiredEnabledApp(appId: string): Promise<void>;
}
