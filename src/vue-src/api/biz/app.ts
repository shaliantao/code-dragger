import httpSender from '/@/ipc/http';
import { ResultData } from '@base/http/http';
import type { AppInfo } from '/#/api';
import { BasicFetchResult } from '/@/api/model/baseModel';
import { getPlatform } from '@src/platform/common/utils';

enum Api {
  Users = '/application',
  GetAppList = Api.Users,
}

export async function getEnableAppList() {
  const res = await httpSender.get<ResultData<BasicFetchResult<AppInfo>>>({
    url: Api.GetAppList,
    params: {
      enabled: true,
      platform: getPlatform(true),
    },
  });
  return res.data;
}
