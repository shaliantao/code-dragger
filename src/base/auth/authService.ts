/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IEnvironmentService } from '@base/environment/environmentService';
import { ILogService } from '@base/log/logService';
import { IStateService } from '@base/state/stateService';
import { createDecorator } from '@base/instantiation/instantiation';
import jwtDecode from 'jwt-decode';

const ACCESS_TOKEN = 'access_token';
const REFRESH_TOKEN = 'refresh_token';
const REFRESH_TOKEN_EXP = 'refresh_token_exp';

export interface IToken {
  accessToken: string;
  refreshToken: string;
}

interface ITokenDecode {
  id?: string;
  iat: number;
  exp: number;
}

export const IAuthService = createDecorator<IAuthService>('authService');

export interface IAuthService {
  readonly _serviceBrand: undefined;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly refreshTokenExp: number;
  setToken(token: IToken): Promise<void>;
  clearToken(): Promise<void>;
}

export class AuthService implements IAuthService {
  declare readonly _serviceBrand: undefined;

  private _accessToken = '';
  private _refreshToken = '';
  private _refreshTokenExp = 0;

  constructor(
    @IEnvironmentService private environmentService: IEnvironmentService,
    @IStateService private stateService: IStateService,
    @ILogService private logService: ILogService,
  ) {}

  get accessToken() {
    if (this._accessToken === '') {
      this._accessToken = this.stateService.getItem(ACCESS_TOKEN) ?? '';
    }
    return this._accessToken;
  }

  get refreshToken() {
    if (this._refreshToken === '') {
      this._refreshToken = this.stateService.getItem(REFRESH_TOKEN) ?? '';
    }
    return this._refreshToken;
  }

  get refreshTokenExp() {
    if (this._refreshTokenExp === 0) {
      this._refreshTokenExp = this.stateService.getItem(REFRESH_TOKEN_EXP) ?? 0;
    }
    return this._refreshTokenExp;
  }

  async setToken({ accessToken, refreshToken }: IToken) {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  private setAccessToken(accessToken: string) {
    this.stateService.setItem(ACCESS_TOKEN, accessToken);
    this._accessToken = accessToken;
  }

  private setRefreshToken(refreshToken: string) {
    this.stateService.setItem(REFRESH_TOKEN, refreshToken);
    this._refreshToken = refreshToken;
    this.setRefreshTokenExp(refreshToken);
  }

  private setRefreshTokenExp(refreshToken: string) {
    const rtExp = (jwtDecode(refreshToken) as ITokenDecode)?.exp * 1000;
    this.stateService.setItem(REFRESH_TOKEN_EXP, rtExp);
  }

  async clearToken() {
    this.clearAccessToken();
    this.clearRefreshToken();
    this.clearRefreshTokenExp();
  }

  private clearAccessToken() {
    this.stateService.removeItem(ACCESS_TOKEN);
    this._accessToken = '';
  }

  private clearRefreshToken() {
    this.stateService.removeItem(REFRESH_TOKEN);
    this._refreshToken = '';
  }

  private clearRefreshTokenExp() {
    this.stateService.removeItem(REFRESH_TOKEN_EXP);
    this._refreshTokenExp = 0;
  }
}
