import path from 'path';
import { compress, decompress } from '@base/common/compression';
import { AbstractProjectService } from '@src/platform/project/projectService';
import { ILogService } from '@base/log/logService';
import { IFileService } from '@base/file/fileService';
import { IEnvironmentService } from '@base/environment/environmentService';
import { IProjectService, CompressResult } from '@src/platform/project/project';
import { IGroupMeta } from '@src/platform/group/group';
import { createDecorator } from '@base/instantiation/instantiation';
import { ReadStream } from 'fs';

export const IGroupProjectService = createDecorator<IGroupProjectService>('groupProjectService');

export interface IGroupProjectService extends IProjectService<IGroupMeta> {
  setGroupTypes(key: string, typesArr: string[]): Promise<void>;
  getGroupTypes(folderName: string): Promise<string[]>;
  checkVersionExist(folderName: string, version: string): Promise<boolean>;
}

export class GroupProjectService
  extends AbstractProjectService<IGroupMeta>
  implements IGroupProjectService
{
  declare readonly _serviceBrand: undefined;
  constructor(
    @ILogService protected readonly logService: ILogService,
    @IFileService protected readonly fileService: IFileService,
    @IEnvironmentService protected readonly environmentService: IEnvironmentService,
  ) {
    super(environmentService.groupPath, environmentService.groupTmplPath, logService, fileService);
  }
  async setGroupTypes(folderName: string, typesArr: string[]): Promise<void> {
    const typesPath = path.join(this.projectRootPath, folderName, 'types.json');
    await this.fileService.writeJson(typesPath, typesArr);
  }
  async getGroupTypes(folderName: string): Promise<string[]> {
    const typesPath = path.join(this.projectRootPath, folderName, 'types.json');
    const typesArr = (await this.fileService.readJson(typesPath)) as string[];
    return typesArr;
  }
  async checkVersionExist(folderName: string, version: string): Promise<boolean> {
    const targetPath = path.join(path.join(this.projectRootPath, folderName, version));
    const exist = await this.fileService.exists(targetPath);
    return exist;
  }
  async compress(folderName: string, subFolderName: string): Promise<CompressResult> {
    // 压缩group目录下除components目录的内容
    const stream = compress(subFolderName, {
      cwd: path.join(this.projectRootPath, folderName),
      excludes: ['/components', 'degit.md5', '.gitignore', '.DS_Store'],
    });

    return { fileStream: stream };
  }
  async decompress(projectKey: string, etag: string, remoteStream: ReadStream): Promise<void> {
    const targetPath = path.join(path.join(this.projectRootPath, projectKey));
    await this.fileService.ensureDir(targetPath);
    await this.fileService.writeFile(path.join(targetPath, 'degit.md5'), etag);
    await decompress(remoteStream, targetPath);
  }
}
