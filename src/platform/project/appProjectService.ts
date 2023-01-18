import path from 'path';
import { compress, decompress } from '@base/common/compression';
import { CommandNode } from '@src/platform/common/types';
import { AbstractProjectService } from '@src/platform/project/projectService';
import { ILogService } from '@base/log/logService';
import { IFileService } from '@base/file/fileService';
import { IEnvironmentService } from '@base/environment/environmentService';
import { IProjectService, CompressResult } from '@src/platform/project/project';
import { IAppMeta } from '@src/platform/app/app';
import { createDecorator } from '@base/instantiation/instantiation';
import { ReadStream } from 'fs';

export const IAppProjectService = createDecorator<IAppProjectService>('appProjectService');
export interface IAppProjectService extends IProjectService<IAppMeta> {
  setAppFlow(folderName: string, jsonArr: CommandNode[]): Promise<void>;
  getAppFlow(folderName: string): Promise<CommandNode[]>;
  checkVersionExist(folderName: string, version: string): Promise<boolean>;
}

export class AppProjectService
  extends AbstractProjectService<IAppMeta>
  implements IAppProjectService
{
  declare readonly _serviceBrand: undefined;
  constructor(
    @ILogService protected readonly logService: ILogService,
    @IFileService protected readonly fileService: IFileService,
    @IEnvironmentService protected readonly environmentService: IEnvironmentService,
  ) {
    super(
      environmentService.workspacePath,
      environmentService.appTmplPath,
      logService,
      fileService,
    );
  }
  // 设置项目元信息
  async setAppFlow(folderName: string, jsonArr: CommandNode[]): Promise<void> {
    const flowPath = path.join(this.projectRootPath, folderName, 'flow.json');
    await this.fileService.writeJson(flowPath, jsonArr);
  }
  // 获取项目元信息
  async getAppFlow(folderName: string): Promise<CommandNode[]> {
    const flowPath = path.join(this.projectRootPath, folderName, 'flow.json');
    const flowList = (await this.fileService.readJson(flowPath)) as CommandNode[];
    return flowList;
  }
  async checkVersionExist(folderName: string, version: string): Promise<boolean> {
    const targetPath = path.join(path.join(this.projectRootPath, folderName, version));
    const exist = await this.fileService.exists(targetPath);
    return exist;
  }
  async compress(folderName: string, subFolderName: string): Promise<CompressResult> {
    const stream = compress(subFolderName, {
      cwd: path.join(this.projectRootPath, folderName),
      excludes: ['/index.js', 'degit.md5', '.gitignore', '.DS_Store'],
    });
    return { fileStream: stream };
  }
  async decompress(projectId: string, etag: string, remoteStream: ReadStream): Promise<void> {
    const targetPath = path.join(path.join(this.projectRootPath, projectId));
    await this.fileService.ensureDir(targetPath);
    await this.fileService.writeFile(path.join(targetPath, 'degit.md5'), etag);
    await decompress(remoteStream, targetPath);
  }
}
