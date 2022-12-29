import { ReadStream } from 'fs-extra';
import { Readable } from 'stream';

export interface IProjectService<T extends object> {
  readonly _serviceBrand: undefined;
  delProject(folderName: string): Promise<void>;
  getFolderList(folderName?: string): Promise<string[]>;
  getProjectStat(folderName: string): Promise<IStatInfo>;
  setProjectMeta(folderName: string, metaInfo: Partial<T>): Promise<void>;
  getProjectMeta(folderName: string): Promise<T>;
  newProject(packageInfo: NewPackageInfo, metaInfo: Partial<T>): Promise<void>;
  setIndexContent(folderName: string, str: string): Promise<void>;
  getIndexContent(folderName: string): Promise<string>;
  setFileContent(folderName: string, fileName: string, str: string): Promise<void>;
  getFileContent(folderName: string, fileName: string): Promise<string>;
  getProjectRoot(folderName): string;
  setPackageInfo(
    folderName: string,
    packageInfo: Omit<IPackageInfo, 'dependencies'>,
  ): Promise<void>;
  getPackageInfo(folderName: string): Promise<IPackageInfo>;
  compress(folderName: string, subFolderName?: string): Promise<CompressResult>;
  decompress(key: string, etag: string, res: ReadStream): Promise<void>;
}

export interface CompressResult {
  fileStream: Readable;
}
export interface IStatInfo {
  createTime: number;
  modifyTime: number;
  size: number;
}

export interface MetaInfo {
  [key: string]: any;
}

export interface NewPackageInfo {
  path: string;
  name: string;
  auth: string;
}

interface Dependencies {
  [key: string]: string;
}

export interface IPackageInfo {
  name: string;
  version: string;
  description: string;
  main: string;
  author: string;
  license: string;
  dependencies: Dependencies;
}
