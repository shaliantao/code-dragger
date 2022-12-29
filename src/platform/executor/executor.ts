import { ErrorHandling } from '@src/platform/common/enum';
import { IComponentMeta } from '@src/platform/component/component';
import { IAppMeta } from '@src/platform/app/app';
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
}

export type APP_RUN_RESULT = Exclude<
  APP_RUN_STATE,
  APP_RUN_STATE.INITIAL | APP_RUN_STATE.RUNNING | APP_RUN_STATE.PAUSED
>;

export interface IAppStart {
  startTime: number;
  meta: IAppMeta;
}
export interface IAppData {
  endTime: number;
  state: APP_RUN_RESULT;
  meta: IAppMeta;
}

export interface ICommandInfo {
  id: string;
  errorHandling: ErrorHandling;
}

export interface ICommandStart {
  startTime: number;
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

export type ICommandData = ICommandDataSuccess | ICommandDataError;
