import httpSender from '/@/ipc/http';
import { ResultData } from '@base/http/http';
import { LoginParams, LoginResultModel } from './model/userModel';
import type { UserInfo } from '/#/store';

import { ErrorMessageMode } from '/#/axios';

enum Api {
  Login = '/login',
  Logout = '/logout',
  GetUserInfo = '/user/info',
  GetPermCode = '/getPermCode',
}

/**
 * @description: user login api
 */
export function loginApi(params: LoginParams, mode: ErrorMessageMode = 'modal') {
  return httpSender.post<ResultData<LoginResultModel>>(
    {
      url: Api.Login,
      data: params,
    },
    {
      errorMessageMode: mode,
    },
  );
}

/**
 * @description: getUserInfo
 */
export function getUserInfo() {
  return httpSender.get<ResultData<UserInfo>>(
    { url: Api.GetUserInfo },
    { errorMessageMode: 'none' },
  );
}

export function getPermCode() {
  return httpSender.get<string[]>({ url: Api.GetPermCode });
}

export function doLogout() {
  return httpSender.get({ url: Api.Logout });
}
