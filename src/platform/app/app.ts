import { createDecorator } from '@base/instantiation/instantiation';
import { CommandNode, IFileStat } from '@src/platform/common/types';
import { AppModel, IAppState } from '@src/platform/app/appModel';
import { ErrorHandling, ValueType } from '@src/platform/common/enum';
import { InputsOutput } from '@src/platform/code/code';
import { Event } from '@base/common/event';

export const IAppService = createDecorator<IAppService>('appService');
export interface IAppMeta {
  id: string;
  name: string;
  desc: string;
  diffPlatform: boolean;
}

export interface IAppComponentMeta extends InputsOutput {
  id: string;
  name: string;
  errorHandling: ErrorHandling;
}

export interface ICodeMeta {
  code: string;
  meta: IAppComponentMeta;
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

export interface IGlobalVar {
  name: string;
  type: ValueType;
  value: string;
}

export interface IGlobalVarObj {
  [key: string]: IGlobalVar;
}

export interface IAppService {
  readonly _serviceBrand: undefined;
  readonly onTypesChange: Event<void>;
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
  getXpath(appId: string, url?: string): Promise<void>;
  addGlobalVar(uuid: string, globalVar: IGlobalVar): Promise<void>;
  editGlobalVar(uuid: string, globalVar: IGlobalVar): Promise<void>;
  editGlobalVar(uuid: string, globalVar: IGlobalVar): Promise<void>;
  getGlobalList(uuid: string): Promise<IGlobalVar[]>;
  setTypes(uuid: string, typeItem: string): Promise<void>;
  getTypes(uuid: string): Promise<string[]>;
}
