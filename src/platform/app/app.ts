import { createDecorator } from '@base/instantiation/instantiation';
import { CommandNode, IFileStat } from '@src/platform/common/types';

export const IAppService = createDecorator<IAppService>('appService');
export interface IAppMeta {
  id: string;
  name: string;
  desc: string;
}

export const initialMetaInfo: (uuid: string) => IAppMeta = (uuid) => ({
  id: uuid,
  name: '未命名',
  desc: '',
});

export type AppItem = IAppMeta & IFileStat;

export interface IAppService {
  readonly _serviceBrand: undefined;
  getList(): Promise<AppItem[]>;
  newApp(info?: Partial<IAppMeta>): Promise<string>;
  delApp(uuid: string): Promise<void>;
  saveFlow(uuid: string, jsonArr: CommandNode[]): Promise<void>;
  showFlow(uuid: string): Promise<CommandNode[]>;
  getAppInfo(uuid: string): Promise<IAppMeta>;
  setAppInfo(uuid: string, info: Partial<IAppMeta>): Promise<void>;
  getWorkspace(uuid: string): Promise<string>;
  publish(key: string): Promise<void>;
}
