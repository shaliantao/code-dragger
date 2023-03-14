import { CommandType, SrcType, ValueType, IsEnum, ErrorHandling } from '@src/platform/common/enum';

type PickRequired<T, K extends keyof T> = {
  [P in K]-?: T[K];
} & Omit<T, K>;

export interface IFileStat {
  createTime: number;
  modifyTime: number;
}
export interface InputArg {
  name: string;
  key: string;
  type: ValueType;
  srcType: SrcType;
  isEnum: IsEnum;
  value: string;
  defaultVal: string;
}
export interface BaseOutputArg {
  name: string;
  key: string;
  type: Exclude<ValueType, ValueType.List | ValueType.Object>;
}
export interface ObjectOutputArg {
  name: string;
  key: string;
  type: ValueType.Object;
  children: BaseOutputArg[];
}

export interface BasicListItemArg {
  name: string;
  key: string;
}

export interface BaseListItemArg {
  type: Exclude<ValueType, ValueType.List | ValueType.Object>;
}

export interface ObjectListItemArg {
  type: ValueType.Object;
  children: BaseOutputArg[];
}

export interface ListListItemArg {
  type: ValueType.List;
  child: ListItemArg;
}

export type ListItemArg = BasicListItemArg &
  (BaseListItemArg | ObjectListItemArg | ListListItemArg);

export interface ListOutputArg {
  name: string;
  key: string;
  type: ValueType.List;
  child: ListItemArg;
}

export type OutputArg = BaseOutputArg | ObjectOutputArg | ListOutputArg;

export type OutputNodes = OutputArg & {
  disabled?: boolean;
};

export type KeyRequiredOutputArg = PickRequired<OutputArg, 'key'>;

export interface TypeItem {
  name: string;
  key: string;
}
export interface CommandCommon {
  id: string;
  name: string;
}
export interface CodeCommand extends CommandCommon {
  formType: CommandType.Code;
  type: CommandType.Code;
  code: string;
  errorHandling: ErrorHandling;
  inputs?: InputArg[];
  output?: OutputArg;
}

export interface ComponentCommand extends CommandCommon {
  formType: CommandType.Component;
  type: CommandType.Component;
  componentId: string;
  group: string;
  func: string;
  desc: string;
  diffPlatform: boolean;
  errorHandling: ErrorHandling;
  inputs?: InputArg[];
  output?: OutputArg;
  version: string;
}

export interface IfCommand extends CommandCommon {
  type: CommandType.If;
  formType: CommandType.If;
  leftSrcType: SrcType;
  leftValue: '';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  rightSrcType: SrcType;
  rightValue: '';
  tasks?: CommandNode[];
}

export interface ElseIfCommand extends CommandCommon {
  type: CommandType.ElseIf;
  formType: CommandType.If;
  leftSrcType: SrcType;
  leftValue: '';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  rightSrcType: SrcType;
  rightValue: '';
  tasks?: CommandNode[];
}

export interface ElseCommand extends CommandCommon {
  type: CommandType.Else;
  formType: CommandType.Else;
  tasks?: CommandNode[];
}

export interface ForEachCommand extends CommandCommon {
  type: CommandType.ForEach;
  formType: CommandType.ForEach;
  srcType: SrcType;
  items: string;
  output: OutputArg;
  tasks?: CommandNode[];
}

export interface TopCommand {
  type: CommandType.Top;
  tasks: CommandNode[];
}

export type CommandNode =
  | CodeCommand
  | ComponentCommand
  | IfCommand
  | ElseIfCommand
  | ElseCommand
  | ForEachCommand;

export type FlowCommandNode = IfCommand | ElseIfCommand | ElseCommand | ForEachCommand;

export type ParentNode = (FlowCommandNode | TopCommand) & {
  parent?: ParentNode;
};
