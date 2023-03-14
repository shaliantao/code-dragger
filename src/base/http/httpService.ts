import type { AxiosRequestConfig, AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { RequestOptions, Result, UploadFileParams } from '/#/axios';
import type { CreateAxiosOptions } from './axiosTransform';
import axios from 'axios';
import qs from 'qs';
import FormData from 'form-data';
import { cloneDeep } from 'lodash-es';
import { ContentTypeEnum, RequestEnum } from '/@/enums/httpEnum';
import { IHttpService } from './http';
import { IAuthService } from '@src/base/auth/authService';
import { Disposable } from '@src/base/common/lifecycle';
import { Emitter, Event } from '@base/common/event';

export * from './axiosTransform';

/**
 * @description:  axios module
 */
export class HttpService extends Disposable implements IHttpService {
  readonly _serviceBrand: undefined;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private retryReqs: any[] = [];
  private readonly _onLogout = this._register(new Emitter<void>());
  readonly onLogout: Event<void> = this._onLogout.event;

  constructor(
    private readonly options: CreateAxiosOptions,
    @IAuthService private authService: IAuthService,
  ) {
    super();
    this.axiosInstance = axios.create({ timeout: 20000, ...options });
    this.setupInterceptors(this.axiosInstance);
  }

  getAxios(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * @description: Interceptor configuration 拦截器配置
   */
  private setupInterceptors(axiosInstance: AxiosInstance) {
    // Request interceptor configuration processing
    axiosInstance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // If cancel repeat request is turned on, then cancel repeat request is prohibited
        // @ts-ignore
        const token = this.authService.accessToken;
        if (token && !config.headers?.Authorization) {
          config.headers = { ...config.headers, Authorization: token };
        }

        return config;
      },
      () => {},
    );

    // Response result interceptor processing
    axiosInstance.interceptors.response.use(
      (response: AxiosResponse<any>) => {
        const res = response?.data;
        if (res.code && res.code !== 200) {
          return Promise.reject(res.msg);
        }
        if (res || response.config?.responseType === 'blob') {
          return res;
        }
        return null;
      },
      async (error) => {
        const response = error.response;
        // 授权错误
        if (response?.status === 401) {
          if (!this.authService.accessToken) {
            this._onLogout.fire();
          }
          const config = response?.config as AxiosRequestConfig;
          if (this.authService.refreshTokenExp <= Date.now()) {
            this.authService.clearToken();
            this._onLogout.fire();
          } else if (!this.isRefreshing) {
            try {
              this.isRefreshing = true;
              const res = await this.post({
                url: 'auth/token',
                headers: { Authorization: 'Bearer ' + this.authService.refreshToken },
              });
              const data = res.data;
              this.authService.setToken(data);
              for (let i = 0, len = this.retryReqs.length; i < len; i++) {
                this.retryReqs[i](data.accessToken);
              }
              // 队列请求完成，清空
              this.retryReqs = [];
              // 返回触发 401 接口正常结果
              config.headers = { ...config.headers, Authorization: data.accessToken };
              return await this.request(config);
            } catch (error) {
              console.log(error);
            } finally {
              this.isRefreshing = false;
            }
          } else {
            // 刷新 token 期间，将其他请求存入队列，刷新成功之后重新请求一次
            return new Promise((resolve) => {
              this.retryReqs.push((token: string) => {
                config.headers = { ...config.headers, Authorization: token };
                resolve(this.request(config));
              });
            });
          }
        }

        // 传参错误
        if (response?.status === 400) {
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * @description:  File Upload
   */
  uploadFile<T = any>(config: AxiosRequestConfig, params: UploadFileParams) {
    const formData = new FormData();
    const formHeaders = formData?.getHeaders();
    for (const item of params.files) {
      const customFilename = item.name || 'file';
      formData.append(customFilename, item.file, item.filename);
    }

    if (params.data) {
      Object.keys(params.data).forEach((key) => {
        const value = params.data![key];
        if (Array.isArray(value)) {
          value.forEach((item) => {
            formData.append(`${key}[]`, item);
          });
          return;
        }

        formData.append(key, params.data![key]);
      });
    }

    const res = this.axiosInstance.request<T>({
      method: 'POST',
      ...config,
      data: formData,
      headers: {
        'Content-type': ContentTypeEnum.FORM_DATA,
        // @ts-ignore
        ignoreCancelToken: true,
        ...formHeaders,
      },
    });
    return res as unknown as Promise<T>;
  }

  downloadFile() {
    //this.axiosInstance.get()
  }

  // support form-data
  private supportFormData(config: AxiosRequestConfig) {
    const headers = config.headers || this.options.headers;
    const contentType = headers?.['Content-Type'] || headers?.['content-type'];

    if (
      contentType !== ContentTypeEnum.FORM_URLENCODED ||
      !Reflect.has(config, 'data') ||
      config.method?.toUpperCase() === RequestEnum.GET
    ) {
      return config;
    }

    return {
      ...config,
      data: qs.stringify(config.data, { arrayFormat: 'brackets' }),
    };
  }

  get<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'GET' }, options);
  }

  post<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'POST' }, options);
  }

  put<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'PUT' }, options);
  }

  delete<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'DELETE' }, options);
  }

  request<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    let conf: CreateAxiosOptions = cloneDeep(config);

    const { requestOptions } = this.options || {};

    const opt: RequestOptions = Object.assign({}, requestOptions, options);

    conf.requestOptions = opt;

    conf = this.supportFormData(conf);

    return new Promise((resolve, reject) => {
      this.axiosInstance
        .request<any, AxiosResponse<Result>>(conf)
        .then((res: AxiosResponse<Result>) => {
          resolve(res as unknown as Promise<T>);
        })
        .catch((e: Error | AxiosError) => {
          if (axios.isAxiosError(e)) {
            // rewrite error message from axios in here
          }
          reject(e);
        });
    });
  }
}
