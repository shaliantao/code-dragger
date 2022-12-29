import path from 'path';
import { compress, decompress } from '@base/common/compression';
import { AbstractProjectService } from '@src/platform/project/projectService';
import { ILogService } from '@base/log/logService';
import { IFileService } from '@base/file/fileService';
import { IEnvironmentService } from '@base/environment/environmentService';
import { CompressResult, IProjectService } from '@src/platform/project/project';
import { IComponentMeta, getComponentsPath } from '@src/platform/component/component';
import { createDecorator } from '@base/instantiation/instantiation';
import { ReadStream } from 'fs';

export type IComponentProjectService = IProjectService<IComponentMeta>;
export const IComponentProjectService =
  createDecorator<IComponentProjectService>('componentProjectService');

export class CompProjectService extends AbstractProjectService<IComponentMeta> {
  declare readonly _serviceBrand: undefined;
  constructor(
    groupName: string,
    @ILogService protected readonly logService: ILogService,
    @IFileService protected readonly fileService: IFileService,
    @IEnvironmentService protected readonly environmentService: IEnvironmentService,
  ) {
    // 组件需要建在分组下面， 故这里使用groupPath
    super(
      path.join(environmentService.groupPath, getComponentsPath(groupName)),
      environmentService.compTmplPath,
      logService,
      fileService,
    );
  }
  async compress(func: string): Promise<CompressResult> {
    const stream = compress(func, {
      cwd: this.projectRootPath,
      excludes: ['degit.md5', '.gitignore', '.DS_Store'],
    });
    return { fileStream: stream };
  }
  async decompress(key: string, etag: string, remoteStream: ReadStream): Promise<void> {
    const targetPath = path.join(path.join(this.projectRootPath, key));
    await this.fileService.ensureDir(targetPath);
    await this.fileService.writeFile(path.join(targetPath, 'degit.md5'), etag);
    await decompress(remoteStream, targetPath);
  }
}
