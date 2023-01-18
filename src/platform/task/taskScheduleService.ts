import { Disposable } from '@src/base/common/lifecycle';
import { IHttpService } from '@src/base/http/http';
import { ILogService } from '@src/base/log/logService';
import { ITaskQueueService, ITaskScheduleService } from '@src/platform/task/task';
import type { TaskInfo } from '/#/api';
import { ExecMode } from '../common/enum';
import schedule from 'node-schedule';
import { IExecutorService } from '../executor/executorService';

export class TaskScheduleService extends Disposable implements ITaskScheduleService {
  readonly _serviceBrand: undefined;
  private scheduledTasks: schedule.Job[] = [];
  constructor(
    @ILogService private readonly logService: ILogService,
    @IHttpService private readonly httpService: IHttpService,
    @ITaskQueueService private readonly taskQueueService: ITaskQueueService,
    @IExecutorService private readonly exectorService: IExecutorService,
  ) {
    super();
    this.syncTask();
  }
  private async getTasks(): Promise<TaskInfo[]> {
    const res = await this.httpService.get({
      url: 'tasks/all',
    });
    return res.data;
  }

  private createJob(task: TaskInfo): schedule.Job {
    let spec;
    if (task.execMode === ExecMode.Cycle) {
      spec = {
        start: new Date(task.validateStart!),
        end: new Date(task.validateEnd!),
        rule: task.cron!.split(' ').slice(0, 6).join(' '),
      };
    } else if (task.execMode === ExecMode.Timing) {
      spec = new Date(task.startTime!);
    }

    const job = schedule.scheduleJob(spec, () => {
      const appId = task.appId;
      this.taskQueueService.enqueue(async () => await this.exectorService.startTaskApp(appId));
    });
    return job;
  }

  async syncTask(): Promise<boolean> {
    this.logService.debug('syncTask');
    this.cancelAllJobs();
    const tasks = await this.getTasks();
    for (const task of tasks) {
      const job = await this.createJob(task);
      if (job) {
        this.scheduledTasks.push(job);
      }
    }
    return true;
  }
  cancelJob(job: schedule.Job): void {
    job.cancel();
  }
  async cancelAllJobs(): Promise<void> {
    this.scheduledTasks.forEach((job) => this.cancelJob(job));
    this.scheduledTasks = [];
  }
  dispose() {
    super.dispose();
    this.cancelAllJobs();
  }
}
