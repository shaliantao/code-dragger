import { ValueType } from '@src/platform/common/enum';

export const basicTypeArr: string[] = [
  ValueType.Unknown,
  ValueType.Number,
  ValueType.String,
  ValueType.Boolean,
];

export const valueTypeArr: string[] = [...basicTypeArr, ValueType.Object, ValueType.List];
