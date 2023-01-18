import { Disposable } from '@src/base/common/lifecycle';
import { ILogService } from '@src/base/log/logService';
import { ITaskQueueService } from './task';

export class TaskQueueService extends Disposable implements ITaskQueueService {
  readonly _serviceBrand: undefined;
  private isRunning = false;
  constructor(
    @ILogService private readonly logService: ILogService,
    private queue: Function[] = [],
  ) {
    super();
  }
  enqueue(item: Function) {
    this.logService.info('push');
    // 入队
    this.queue.push(item);
    this.doJob();
  }
  private dequeue() {
    // 出队
    return this.queue.shift();
  }
  cutInQueue(item: Function) {
    this.logService.info('cut in');
    // 插入队头
    this.queue.unshift(item);
    this.doJob();
  }
  get isEmpty() {
    return this.size == 0;
  }
  get size() {
    return this.queue.length;
  }
  private async doJob() {
    if (this.isRunning) {
      return;
    }
    if (this.isEmpty) {
      return;
    }
    //如果无运行中任务且任务队列不为空，执行队列中任务
    try {
      this.isRunning = true;
      await this.dequeue()!();
    } catch (error: any) {
      this.logService.error(error);
    } finally {
      this.isRunning = false;
      this.doJob(); //本次执行完成后递归调用
    }
  }
}
