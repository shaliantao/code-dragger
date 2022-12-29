import { createDecorator as createServiceDecorator } from '@base/instantiation/instantiation';
import { Event } from '@base/common/event';
import type { AxiosRequestConfig, AxiosInstance, AxiosResponse } from 'axios';
import type { RequestOptions, UploadFileParams } from '/#/axios';

export const IHttpService = createServiceDecorator<IHttpService>('httpService');

export interface IHttpService {
  readonly _serviceBrand: undefined;
  readonly onLogout: Event<void>;
  getAxios(): AxiosInstance;
  uploadFile<T = any>(
    config: AxiosRequestConfig,
    params: UploadFileParams,
  ): Promise<AxiosResponse<T, any>>;
  get<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T>;

  post<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T>;

  put<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T>;

  delete<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T>;

  request<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T>;
}

export interface ResultData<T> {
  code: number;
  msg: string;
  data: T;
}
