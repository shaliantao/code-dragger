import httpSender from '/@/ipc/http';
import { ResultData } from '@base/http/http';
import type { TaskInfo } from '/#/api';
import { BasicFetchResult } from '/@/api/model/baseModel';

enum Api {
  Tasks = '/tasks',
}

export async function createTask(params) {
  return httpSender.post<ResultData<TaskInfo>>({
    url: Api.Tasks,
    data: params,
  });
}

export async function updateTask(id, params) {
  return httpSender.put<ResultData<TaskInfo>>({
    url: `${Api.Tasks}/${id}`,
    data: params,
  });
}

export function getTaskList(params) {
  return httpSender.get<ResultData<BasicFetchResult<TaskInfo>>>({
    url: Api.Tasks,
    params,
  });
}

export function delTask(id) {
  return httpSender.delete<ResultData<boolean>>({
    url: `${Api.Tasks}/${id}`,
  });
}
