import { createDecorator } from '@base/instantiation/instantiation';
import { InputArg, OutputArg } from '@src/platform/common/types';
import { ValueType } from '@src/platform/common/enum';
import { IComponentMeta, ComponentItem } from '@src/platform/component/component';

import type { StringLiteral, NumericLiteral, BooleanLiteral } from '@babel/types';

export const ICodeService = createDecorator<ICodeService>('codeService');

export interface ICodeService {
  readonly _serviceBrand: undefined;
  genGroupIndex(list: ComponentItem[]): string;
  getModuleExport(meta: IComponentMeta): string;
  parseIOParmas(codeStr: string): InputsOutput;
}

export type basicType = StringLiteral | NumericLiteral | BooleanLiteral;

export const valueTypeMap = new Map<string, ValueType>([
  ['StringLiteral', ValueType.String],
  ['NumericLiteral', ValueType.Number],
  ['BooleanLiteral', ValueType.Boolean],
  ['ObjectExpression', ValueType.Object],
  ['ArrayExpression', ValueType.List],
]);

export interface InputsOutput {
  inputs?: Nullable<InputArg[]>;
  output?: Nullable<OutputArg>;
}

export enum CodeErrorType {
  NeedExportsFunc = 1,
  SingleObjectParam,
}

export class CodeError extends Error {
  constructor(message: string, readonly code?: CodeErrorType) {
    super(message);
  }
}
