import { createDecorator } from '@base/instantiation/instantiation';

export const ITaskScheduleService = createDecorator<ITaskScheduleService>('taskScheduleService');

export interface ITaskScheduleService {
  readonly _serviceBrand: undefined;
  syncTask(): Promise<boolean>;
  cancelAllJobs(): Promise<void>;
}

export const ITaskQueueService = createDecorator<ITaskQueueService>('taskSQueueService');

export interface ITaskQueueService {
  readonly _serviceBrand: undefined;
  isEmpty: boolean;
  size: number;
  enqueue(func: Function): void;
  cutInQueue(func: Function): void;
}
