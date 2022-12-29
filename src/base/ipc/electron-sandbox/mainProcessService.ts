/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IChannel, IServerChannel } from '@base/ipc/common/ipc';
import { Client } from '@base/ipc/electron-sandbox/ipc.electron-sandbox';
import { Disposable } from '@base/common/lifecycle';
import { createDecorator } from '@base/instantiation/instantiation';

export const IMainProcessService = createDecorator<IMainProcessService>('mainProcessService');

export interface IMainProcessService {
  readonly _serviceBrand: undefined;

  getChannel(channelName: string): IChannel;

  registerChannel(channelName: string, channel: IServerChannel<string>): void;
}

export class MainProcessService extends Disposable implements IMainProcessService {
  declare readonly _serviceBrand: undefined;

  private mainProcessConnection: Client;

  constructor(windowId: number | string) {
    super();
    this.mainProcessConnection = this._register(new Client(`window:${windowId}`));
  }

  getChannel(channelName: string): IChannel {
    return this.mainProcessConnection.getChannel(channelName);
  }

  registerChannel(channelName: string, channel: IServerChannel<string>): void {
    this.mainProcessConnection.registerChannel(channelName, channel);
  }
}
