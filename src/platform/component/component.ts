import path from 'path';
import { ComponentCommand, IFileStat } from '@src/platform/common/types';
import { ErrorHandling } from '@src/platform/common/enum';
import { InputsOutput } from '@src/platform/code/code';
import { IGroupMeta } from '@src/platform/group/group';
import { createDecorator } from '@base/instantiation/instantiation';

export interface IComponentMeta extends InputsOutput {
  id: string;
  name: string;
  group: string;
  func: string;
  desc: string;
  diffPlatform: boolean;
  errorHandling: ErrorHandling;
}

export type IGroupComponentMeta = IGroupMeta & {
  version: string;
  children: ComponentCommand[];
};

export const initialMetaInfo: (uuid: string) => IComponentMeta = (uuid) => ({
  id: uuid,
  name: '未命名',
  group: 'Default',
  func: 'func',
  desc: '',
  diffPlatform: false,
  errorHandling: ErrorHandling.Stop,
});

export type ComponentItem = IComponentMeta & IFileStat;

export const IComponentService = createDecorator<IComponentService>('componentService');
export interface IComponentService {
  readonly _serviceBrand: undefined;
  getGroupComponentList(): Promise<IGroupComponentMeta[]>;
  newComponent(info: Partial<IComponentMeta>): Promise<string>;
  delComponent(group: string, func: string): Promise<void>;
  saveCode(group: string, func: string, codeStr: string): Promise<void>;
  showCode(group: string, func: string): Promise<string>;
  parseIOParams(codeStr: string): Promise<InputsOutput>;
  getIOParams(group: string, func: string): Promise<InputsOutput>;
  setComponentInfo(group: string, func: string, info: Partial<IComponentMeta>): Promise<void>;
  getComponentInfo(group: string, func: string): Promise<IComponentMeta>;
  getWorkspace(group: string, func: string): Promise<string>;
}

export const getComponentsPath = (group) => {
  return path.join(group, 'components');
};
