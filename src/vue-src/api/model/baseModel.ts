export interface BasicPageParams {
  page: number;
  size: number;
}

export interface BasicFetchResult<T extends any> {
  list: T[];
  total: number;
}
