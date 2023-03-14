//语言类型
export enum LangType {
  Javascript = 'javascript',
  Typescript = 'typescript',
  Python = 'python',
  Java = 'java',
}

//指令类型
export enum CommandType {
  Code = 'code',
  Component = 'component',
  If = 'if',
  ElseIf = 'elseif',
  Else = 'else',
  ForEach = 'forEach',
  Top = 'top',
}

//组件输入类型
export enum SrcType {
  Input = 'input',
  Output = 'output',
  KeyMapping = 'keyMapping',
  Global = 'global',
}

export enum ValueType {
  Unknown = 'Unknown',
  Number = 'Number',
  String = 'String',
  Boolean = 'Boolean',
  Object = 'Object',
  List = 'List',
}

export enum IsEnum {
  Yes,
  No,
}

export enum ErrorHandling {
  Stop,
  Ignore,
  Retry,
}

export const enum Platform {
  Mac = 'Mac',
  Linux = 'Linux',
  Windows = 'Windows',
  Common = 'Common',
}

export const enum ExecMode {
  Quick = 'Quick',
  Timing = 'Timing',
  Cycle = 'Cycle',
}

export const enum CycleType {
  Minute = 'Minute',
  Hour = 'Hour',
  Day = 'Day',
  Week = 'Week',
  Month = 'Month',
}
