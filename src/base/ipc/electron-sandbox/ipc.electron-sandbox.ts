/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from '@base/common/event';
import { IPCClient } from '@base/ipc/common/ipc';
import { Protocol } from '@base/ipc/common/ipc.electron';
import { IDisposable } from '@base/common/lifecycle';
import { VSBuffer } from '@base/common/buffer';
import { ipcRenderer } from '@src/sandbox/globals';

export class Client extends IPCClient implements IDisposable {
  private protocol: Protocol;

  private static createProtocol(): Protocol {
    const onMessage = Event.fromNodeEventEmitter<VSBuffer>(
      ipcRenderer,
      'smart:message',
      (_, message) => VSBuffer.wrap(message),
    );
    ipcRenderer.send('smart:hello');
    return new Protocol(ipcRenderer, onMessage);
  }

  constructor(id: string) {
    const protocol = Client.createProtocol();
    super(protocol, id);
    this.protocol = protocol;
  }

  dispose(): void {
    this.protocol.dispose();
  }
}
