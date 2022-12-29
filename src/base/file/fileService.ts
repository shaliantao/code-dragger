import fse, { Stats, Dirent, ReadStream } from 'fs-extra';
import { createDecorator as createServiceDecorator } from '@base/instantiation/instantiation';
import { ILogService } from '@base/log/logService';

export const IFileService = createServiceDecorator<IFileService>('fileService');

export interface IFileService {
  readonly _serviceBrand: undefined;
  createReadStream(path: string): Promise<ReadStream>;
  createFolder(path: string): Promise<void>;
  createFile(path: string): Promise<void>;
  copy(src: string, dist: string, overwrite: boolean): Promise<void>;
  move(src: string, dest: string, overwrite: boolean): Promise<void>;
  exists(path: string): Promise<boolean>;
  writeFile(path: string, data: string | Buffer | Uint8Array): Promise<void>;
  writeJson(path: string, object: object | []): Promise<void>;
  readFile(path: string): Promise<string>;
  readJsonSync(path: string): object | [];
  readJson(path: string): Promise<object | []>;
  remove(path: string): Promise<void>;
  getStat(path: string): Promise<Stats>;
  getStatSync(path: string): Stats;
  readdir(path: string): Promise<Dirent[]>;
  ensureDir(path: string): Promise<void>;
}

export class FileService implements IFileService {
  readonly _serviceBrand: undefined;
  constructor(@ILogService private readonly logService: ILogService) {}
  async createReadStream(path: string): Promise<ReadStream> {
    try {
      const readStream = await fse.createReadStream(path);
      this.logService.info(`folder ${path} has been created`);
      return readStream;
    } catch (err) {
      this.logService.error(`create folder ${path} error: ${err}`);
      throw new Error(`create folder ${path} error: ${err}`);
    }
  }
  async createFolder(path: string): Promise<void> {
    try {
      await fse.ensureDir(path);
      this.logService.info(`folder ${path} has been created`);
    } catch (err) {
      this.logService.error(`create folder ${path} error: ${err}`);
      throw new Error(`create folder ${path} error: ${err}`);
    }
  }
  async createFile(path: string): Promise<void> {
    try {
      await fse.ensureFile(path);
      this.logService.info(`file ${path} has been created`);
    } catch (err) {
      this.logService.error(`create file ${path} error: ${err}`);
      throw new Error(`create file ${path} error: ${err}`);
    }
  }
  async copy(src: string, dest: string, overwrite = true): Promise<void> {
    try {
      await fse.copy(src, dest, { overwrite });
      this.logService.info(`${src} has been copyed to: ${dest}`);
    } catch (err) {
      this.logService.error(`copy ${src} to ${dest} error: ${err}`);
      throw new Error(`copy ${src} to ${dest} error: ${err}`);
    }
  }
  async move(src: string, dest: string, overwrite = false): Promise<void> {
    try {
      await fse.move(src, dest, { overwrite });
      this.logService.info(`${src} has been moved to: ${dest}`);
    } catch (err) {
      this.logService.error(`move ${src} to ${dest} error: ${err}`);
      throw new Error(`move ${src} to ${dest} error: ${err}`);
    }
  }
  async exists(path: string): Promise<boolean> {
    try {
      const exists = await fse.pathExists(path);
      this.logService.info(`path ${path} exists: ${exists}`);
      return exists;
    } catch (err) {
      this.logService.error(`get ${path} exists error: ${err}`);
      throw new Error(`get ${path} exists error: ${err}`);
    }
  }
  async writeFile(path: string, data: string | Buffer | Uint8Array): Promise<void> {
    try {
      await fse.outputFile(path, data);
      this.logService.info(`write to file ${path} success`);
    } catch (err) {
      this.logService.error(`write to file ${path} error: ${err}`);
      throw new Error(`write to file ${path} error: ${err}`);
    }
  }
  async writeJson(path: string, object: object): Promise<void> {
    try {
      await fse.outputJson(path, object, { spaces: '\t' });
      this.logService.info(`write to json ${path} success`);
    } catch (err) {
      this.logService.error(`write to json ${path} error: ${err}`);
      throw new Error(`write to json ${path} error: ${err}`);
    }
  }
  async readFile(path: string): Promise<string> {
    try {
      const res = await fse.readFile(path, 'utf-8');
      this.logService.info(`read from file: ${path} success`);
      return res;
    } catch (err) {
      this.logService.error(`read from file: ${path} error: ${err}`);
      throw new Error(`read from file: ${path} error: ${err}`);
    }
  }
  async readJson(path: string): Promise<object> {
    try {
      const obj = await fse.readJson(path);
      this.logService.info(`read from json: ${path} success`);
      return obj;
    } catch (err) {
      this.logService.error(`read from json: ${path} error: ${err}`);
      throw new Error(`read from json: ${path} error: ${err}`);
    }
  }
  readJsonSync(path: string): object {
    try {
      const obj = fse.readJsonSync(path);
      this.logService.info(`read from json: ${path} success`);
      return obj;
    } catch (err) {
      this.logService.error(`read from json: ${path} error: ${err}`);
      throw new Error(`read from json: ${path} error: ${err}`);
    }
  }
  async remove(path: string): Promise<void> {
    try {
      await fse.remove(path);
      this.logService.info(`remove: ${path} success`);
    } catch (err) {
      this.logService.error(`remove: ${path} error: ${err}`);
      throw new Error(`remove: ${path} error: ${err}`);
    }
  }
  async getStat(path: string): Promise<Stats> {
    try {
      const stat = await fse.stat(path);
      this.logService.info(`get stat from: ${path} success`);
      return stat;
    } catch (err) {
      this.logService.error(`get stat from: ${path} error: ${err}`);
      throw new Error(`get stat from: ${path} error: ${err}`);
    }
  }
  getStatSync(path: string): Stats {
    try {
      const stat = fse.statSync(path);
      this.logService.info(`get stat from: ${path} success`);
      return stat;
    } catch (err) {
      this.logService.error(`get stat from: ${path} error: ${err}`);
      throw new Error(`get stat from: ${path} error: ${err}`);
    }
  }
  async readdir(path: string): Promise<Dirent[]> {
    try {
      const list = await fse.readdir(path, { withFileTypes: true });
      this.logService.info(`readdir from: ${path} success`);
      return list;
    } catch (err) {
      this.logService.error(`readdir from: ${path} error: ${err}`);
      throw new Error(`readdir from: ${path} error: ${err}`);
    }
  }
  async ensureDir(path: string): Promise<void> {
    try {
      await fse.ensureDir(path);
      this.logService.info(`ensure path: ${path} success`);
    } catch (err) {
      this.logService.error(`ensure path: ${path} error: ${err}`);
      throw new Error(`ensure path: ${path} error: ${err}`);
    }
  }
}
