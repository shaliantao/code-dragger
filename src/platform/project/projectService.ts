import path from 'path';
import ncp from 'ncp';
import ejs from 'ejs';
import chokidar from 'chokidar';
import { Readable } from 'stream';
import { consumeStream } from '@base/common/stream';
import { ILogService } from '@base/log/logService';
import { IFileService } from '@base/file/fileService';
import {
  IProjectService,
  NewPackageInfo,
  IStatInfo,
  IPackageInfo,
  CompressResult,
} from '@src/platform/project/project';
import { ReadStream } from 'fs-extra';

export abstract class AbstractProjectService<T extends object> implements IProjectService<T> {
  readonly _serviceBrand: undefined;
  constructor(
    // 工程根目录
    protected readonly projectRootPath: string,
    private readonly tmplPath: string,
    @ILogService protected readonly logService: ILogService,
    @IFileService protected readonly fileService: IFileService,
  ) {}
  // 创建工程目录结构
  private async createProject(packageInfo: NewPackageInfo): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const projectPath = path.join(this.projectRootPath, packageInfo.path);
      const isExists = await this.fileService.exists(projectPath);
      if (isExists) {
        reject('path exists');
        return;
      }
      await this.fileService.ensureDir(projectPath);
      ncp(
        this.tmplPath,
        projectPath,
        {
          async transform(read: NodeJS.ReadableStream & { path: string }, write) {
            // 需要动态生成的文件
            const renderPathList = ['package.json'];
            if (renderPathList.some((item) => read.path.includes(item))) {
              const result = await consumeStream<string>(read, (chunks) => chunks.join(''));
              const newStr = ejs.render(result, packageInfo);
              const newRead = Readable.from(newStr);
              newRead.pipe(write);
              return;
            }
            read.pipe(write);
          },
        },
        (err) => {
          if (err) {
            this.logService.error(err.toString());
            reject(err);
          }
          this.logService.info('create npm project success');
          resolve(packageInfo.path);
        },
      );
    });
  }
  async delProject(folderName: string): Promise<void> {
    const projectPath = path.join(this.projectRootPath, folderName);
    await this.fileService.remove(projectPath);
  }

  // 创建新工程并初始化工程信息
  async newProject(packageInfo: NewPackageInfo, metaInfo: T): Promise<void> {
    const folderName = await this.createProject(packageInfo);
    await this.setProjectMeta(folderName, metaInfo);
  }
  // 获取文件夹列表
  async getFolderList(folderName = ''): Promise<string[]> {
    const folderPath = path.join(this.projectRootPath, folderName);
    await this.fileService.ensureDir(folderPath);
    const list = await this.fileService.readdir(folderPath);
    const folderList = list.filter((item) => item.isDirectory());
    return folderList.map((item) => item.name);
  }
  // 设置项目元信息
  async setProjectMeta(folderName: string, metaInfo: T): Promise<void> {
    const metaPath = path.join(this.projectRootPath, folderName, 'meta.json');
    await this.fileService.writeJson(metaPath, metaInfo);
  }
  // 获取项目元信息
  async getProjectMeta(folderName: string): Promise<T> {
    const metaPath = path.join(this.projectRootPath, folderName, 'meta.json');
    const metaInfo = await this.fileService.readJson(metaPath);
    return metaInfo as T;
  }
  // 设置项目元信息
  async setPackageInfo(
    folderName: string,
    packageInfo: Omit<IPackageInfo, 'dependencies'>,
  ): Promise<void> {
    const packagePath = path.join(this.projectRootPath, folderName, 'package.json');
    const oldInfo = await this.fileService.readJson(packagePath);
    const newInfo = Object.assign({}, oldInfo, packageInfo);
    await this.fileService.writeJson(packagePath, newInfo);
  }
  // 获取项目元信息
  async getPackageInfo(folderName: string): Promise<IPackageInfo> {
    const packagePath = path.join(this.projectRootPath, folderName, 'package.json');
    const packageInfo = await this.fileService.readJson(packagePath);
    return packageInfo as IPackageInfo;
  }
  // 保存至项目index文件
  async setIndexContent(folderName: string, str: string): Promise<void> {
    const indexPath = path.join(this.projectRootPath, folderName, 'index.js');
    await this.fileService.writeFile(indexPath, str);
  }
  // 从项目index文件获取内容
  async getIndexContent(folderName: string): Promise<string> {
    const indexPath = path.join(this.projectRootPath, folderName, 'index.js');
    const res = await this.fileService.readFile(indexPath);
    return res;
  }
  // 保存至指定文件
  async setFileContent(folderName: string, fileName: string, str: string): Promise<void> {
    const filePath = path.join(this.projectRootPath, folderName, fileName);
    await this.fileService.writeFile(filePath, str);
  }
  // 从指定文件获取内容
  async getFileContent(folderName: string, fileName: string): Promise<string> {
    const filePath = path.join(this.projectRootPath, folderName, fileName);
    const res = await this.fileService.readFile(filePath);
    return res;
  }
  abstract compress(folderName: string, subFolderName?: string): Promise<CompressResult>;
  abstract decompress(key: string, etag: string, res: ReadStream): Promise<void>;
  // 获取项目stat信息
  async getProjectStat(folderName: string): Promise<IStatInfo> {
    const indexPath = path.join(this.projectRootPath, folderName, 'meta.json');
    const pState = await this.fileService.getStat(indexPath);
    const { birthtimeMs, mtimeMs, size } = pState;
    return { createTime: birthtimeMs, modifyTime: mtimeMs, size };
  }
  getProjectRoot(folderName): string {
    return path.join(this.projectRootPath, folderName);
  }
  watchProjectRoot(addCb: (path: string) => void, removeCb: (path: string) => void): void {
    chokidar
      .watch(this.projectRootPath, {
        ignored: 'node_modules',
        cwd: this.projectRootPath,
        ignoreInitial: true,
      })
      .on('addDir', (path) => {
        if (typeof addCb === 'function') {
          addCb(path);
        }
      })
      .on('unlinkDir', (path) => {
        if (typeof removeCb === 'function') {
          removeCb(path);
        }
      });
  }
}
