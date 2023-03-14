import { createDecorator } from '@base/instantiation/instantiation';
import { CommandNode } from '@src/platform/common/types';
import { ICodeMeta } from '@src/platform/app/app';
import t from '@babel/types';
/**
 * 将json数据结构的指令转换成可执行的代码
 */
export const ICommandService = createDecorator<ICommandService>('commandService');

export interface ICommandService {
  readonly _serviceBrand: undefined;
  jsonToCode(jsonArr: CommandNode[]): IReturnObj;
}

export type RunTemplateObj = {
  inputs?: t.ObjectExpression;
  output?: t.Identifier;
};

export interface IRequiredGroupDep {
  groupKey: string;
  version: string;
  localPath: string;
}

export interface IReturnObj {
  code: string;
  requiredGroupDeps: IRequiredGroupDep[];
  requiredCodeMap: Map<string, ICodeMeta>;
}
