/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import * as fs from 'fs';
import fse from 'fs-extra';
import { IEnvironmentService } from '@base/environment/environmentService';
import { isUndefined, isUndefinedOrNull } from '@base/common/types';
import { ILogService } from '@base/log/logService';
import { createDecorator } from '@base/instantiation/instantiation';

export const IStateService = createDecorator<IStateService>('stateService');

export interface IStateService {
  readonly _serviceBrand: undefined;

  getItem<T>(key: string, defaultValue: T): T;
  getItem<T>(key: string, defaultValue?: T): T | undefined;
  setItem(key: string, data?: object | string | number | boolean | undefined | null): void;
  removeItem(key: string): void;
}

type StorageDatabase = { [key: string]: any };

export class FileStorage {
  private _database: StorageDatabase | null = null;
  private lastFlushedSerializedDatabase: string | null = null;

  constructor(private dbPath: string, private onError: (error: Error) => void) {}

  private get database(): StorageDatabase {
    if (!this._database) {
      this._database = this.loadSync();
    }

    return this._database;
  }

  async init(): Promise<void> {
    if (this._database) {
      return; // return if database was already loaded
    }

    const database = await this.loadAsync();

    if (this._database) {
      return; // return if database was already loaded
    }

    this._database = database;
  }

  private loadSync(): StorageDatabase {
    try {
      this.lastFlushedSerializedDatabase = fs.readFileSync(this.dbPath).toString();

      return JSON.parse(this.lastFlushedSerializedDatabase);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        this.onError(error);
      }

      return {};
    }
  }

  private async loadAsync(): Promise<StorageDatabase> {
    try {
      this.lastFlushedSerializedDatabase = (await fse.readFile(this.dbPath)).toString() as string;

      return JSON.parse(this.lastFlushedSerializedDatabase);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        this.onError(error);
      }

      return {};
    }
  }

  getItem<T>(key: string, defaultValue: T): T;
  getItem<T>(key: string, defaultValue?: T): T | undefined;
  getItem<T>(key: string, defaultValue?: T): T | undefined {
    const res = this.database[key];
    if (isUndefinedOrNull(res)) {
      return defaultValue;
    }

    return res;
  }

  setItem(key: string, data?: object | string | number | boolean | undefined | null): void {
    // Remove an item when it is undefined or null
    if (isUndefinedOrNull(data)) {
      return this.removeItem(key);
    }

    // Shortcut for primitives that did not change
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      if (this.database[key] === data) {
        return;
      }
    }

    this.database[key] = data;
    this.saveSync();
  }

  removeItem(key: string): void {
    // Only update if the key is actually present (not undefined)
    if (!isUndefined(this.database[key])) {
      this.database[key] = undefined;
      this.saveSync();
    }
  }

  private saveSync(): void {
    const serializedDatabase = JSON.stringify(this.database, null, 4);
    if (serializedDatabase === this.lastFlushedSerializedDatabase) {
      return; // return early if the database has not changed
    }

    try {
      fse.writeFileSync(this.dbPath, serializedDatabase); // permission issue can happen here
      this.lastFlushedSerializedDatabase = serializedDatabase;
    } catch (error: any) {
      this.onError(error);
    }
  }
}

export class StateService implements IStateService {
  declare readonly _serviceBrand: undefined;

  private static readonly STATE_FILE = 'storage.json';

  private fileStorage: FileStorage;

  constructor(
    @IEnvironmentService environmentService: IEnvironmentService,
    @ILogService logService: ILogService,
  ) {
    this.fileStorage = new FileStorage(
      path.join(environmentService.userDataPath, StateService.STATE_FILE),
      (error) => logService.error(error),
    );
  }

  init(): Promise<void> {
    return this.fileStorage.init();
  }

  getItem<T>(key: string, defaultValue: T): T;
  getItem<T>(key: string, defaultValue: T | undefined): T | undefined;
  getItem<T>(key: string, defaultValue?: T): T | undefined {
    return this.fileStorage.getItem(key, defaultValue);
  }

  setItem(key: string, data?: object | string | number | boolean | undefined | null): void {
    this.fileStorage.setItem(key, data);
  }

  removeItem(key: string): void {
    this.fileStorage.removeItem(key);
  }
}
