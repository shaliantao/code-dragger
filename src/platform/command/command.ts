import { createDecorator } from '@base/instantiation/instantiation';
import t from '@babel/types';
/**
 * 将json数据结构的指令转换成可执行的代码
 */
export const ICommandService = createDecorator<ICommandService>('commandService');

export interface ICommandService {
  readonly _serviceBrand: undefined;
  jsonToCodeStr(jsonStr: string): string;
  requiredGroupDeps: IRequiredGroupDep[];
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
