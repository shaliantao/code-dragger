/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event, Emitter } from '@base/common/event';
import { IPCServer, ClientConnectionEvent } from '@base/ipc/common/ipc';
import { Protocol } from '@base/ipc/common/ipc.electron';
import { ipcMain, WebContents } from 'electron';
import { IDisposable, toDisposable } from '@base/common/lifecycle';
import { VSBuffer } from '@base/common/buffer';

interface IIPCEvent {
  event: { sender: WebContents };
  message: Buffer | null;
}

function createScopedOnMessageEvent(senderId: number, eventName: string): Event<VSBuffer | null> {
  const onMessage = Event.fromNodeEventEmitter<IIPCEvent>(ipcMain, eventName, (event, message) => ({
    event,
    message,
  }));

  const onMessageFromSender = Event.filter(onMessage, ({ event }) => event.sender.id === senderId);

  return Event.map(onMessageFromSender, ({ message }) =>
    message ? VSBuffer.wrap(message) : message,
  );
}

export class Server extends IPCServer {
  private static readonly Clients = new Map<number, IDisposable>();

  private static getOnDidClientConnect(): Event<ClientConnectionEvent> {
    const onHello = Event.fromNodeEventEmitter<WebContents>(
      ipcMain,
      'smart:hello',
      ({ sender }) => sender,
    );

    return Event.map(onHello, (webContents) => {
      const id = webContents.id;
      const client = Server.Clients.get(id);

      if (client) {
        client.dispose();
      }

      const onDidClientReconnect = new Emitter<void>();
      Server.Clients.set(
        id,
        toDisposable(() => onDidClientReconnect.fire()),
      );

      const onMessage = createScopedOnMessageEvent(id, 'smart:message') as Event<VSBuffer>;
      const onDidClientDisconnect = Event.any(
        Event.signal(createScopedOnMessageEvent(id, 'smart:disconnect')),
        onDidClientReconnect.event,
      );
      const protocol = new Protocol(webContents, onMessage);

      return { protocol, onDidClientDisconnect };
    });
  }

  constructor() {
    super(Server.getOnDidClientConnect());
  }
}
