/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IMessagePassingProtocol } from '@base/ipc/common/ipc';
import { Event } from '@base/common/event';
import { VSBuffer } from '@base/common/buffer';

export interface Sender {
  send(channel: string, msg: unknown): void;
}

export class Protocol implements IMessagePassingProtocol {
  constructor(private sender: Sender, readonly onMessage: Event<VSBuffer>) {}

  send(message: VSBuffer): void {
    try {
      this.sender.send('smart:message', message.buffer);
    } catch (e) {
      // systems are going down
    }
  }

  dispose(): void {
    this.sender.send('smart:disconnect', null);
  }
}
