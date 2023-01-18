import httpSender from '/@/ipc/http';
import { ResultData } from '@base/http/http';
import type { UserInfo } from '/#/api';
import { BasicFetchResult } from '/@/api/model/baseModel';

enum Api {
  Users = '/users',
  GetUserList = Api.Users,
  CreateUser = Api.Users,
}

export function getUserList(params) {
  return httpSender.get<ResultData<BasicFetchResult<UserInfo>>>({
    url: Api.GetUserList,
    params,
  });
}

export function createUser(params) {
  return httpSender.post<ResultData<UserInfo>>({
    url: Api.CreateUser,
    data: params,
  });
}

export function delUser(id) {
  return httpSender.delete<ResultData<boolean>>({
    url: `${Api.Users}/${id}`,
  });
}
