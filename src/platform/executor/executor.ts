import { ErrorHandling } from '@src/platform/common/enum';
import { IComponentMeta } from '@src/platform/component/component';
import { IAppMeta } from '@src/platform/app/app';
import { InputArg } from '../common/types';
export interface IContext {
  [key: string]: string | number | boolean;
}

export enum KILL_TYPE {
  KILL = 'SIGKILL',
  PAUSE = 'SIGSTOP',
  RESUME = 'SIGCONT',
}

export enum APP_RUN_STATE {
  INITIAL = 'INITIAL',
  START = 'START',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  TIMEOUT = 'TIMEOUT',
  STOPED = 'STOPED',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum COMMAND_EXEC_STATUS {
  SUCCESS = 0,
  ERROR = 1,
  LOG = 2,
  ERROR_LOG = 3,
}

export type APP_RUN_RESULT = Exclude<
  APP_RUN_STATE,
  APP_RUN_STATE.INITIAL | APP_RUN_STATE.RUNNING | APP_RUN_STATE.PAUSED
>;

export interface IAppStart {
  startTime: number;
}

export interface IAppStartWithMeta extends IAppStart {
  meta: IAppMeta;
}

export interface IAppData {
  endTime: number;
  state: APP_RUN_RESULT;
}

export interface IAppDataWithMeta extends IAppData {
  meta: IAppMeta;
}

export interface ICommandInfo {
  id: string;
  errorHandling: ErrorHandling;
}

export interface ICommandStart {
  startTime: number;
  inputs: InputArg[];
  info: ICommandInfo;
  meta: IComponentMeta;
}

export interface ICommandDataSuccess {
  code: COMMAND_EXEC_STATUS.SUCCESS;
  data: {
    endTime: number;
    result?: any;
    info: ICommandInfo;
    meta: IComponentMeta;
  };
}

export interface ICommandDataError {
  code: COMMAND_EXEC_STATUS.ERROR;
  data: {
    endTime: number;
    error?: string;
    info: ICommandInfo;
    meta: IComponentMeta;
  };
}

export interface ICommandDataLog {
  code: COMMAND_EXEC_STATUS.LOG;
  data: {
    time: number;
    info: string;
  };
}

export interface ICommandErrorLog {
  code: COMMAND_EXEC_STATUS.ERROR_LOG;
  data: {
    time: number;
    info: string;
  };
}

export type ICommandData =
  | ICommandDataSuccess
  | ICommandDataError
  | ICommandDataLog
  | ICommandErrorLog;

export interface IPrint {
  onAppStateChange: (state: APP_RUN_STATE) => void;
  onCommandStart: (data: ICommandStart) => void;
  onCommandData: (data: ICommandData) => void;
}
