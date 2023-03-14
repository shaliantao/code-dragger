import chokidar from 'chokidar';
import path from 'node:path';
import { IAppMeta, ICodeMeta, IGlobalVar, IGlobalVarObj } from '@src/platform/app/app';
import { ICodeService } from '@src/platform/code/code';
import { ILogService } from '@base/log/logService';
import { IAppProjectService } from '@src/platform/project/appProjectService';
import { IStatInfo, IPackageInfo, CompressResult } from '@src/platform/project/project';
import { Disposable } from '@base/common/lifecycle';
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
import { memoize } from '@base/common/decorators';
import { CommandNode } from '@src/platform/common/types';
import { convertStrByType } from '@src/platform/common/utils';
import { cloneDeep } from 'lodash-es';

const COMP_FOLDER = 'components';
const FLOW_FILE = 'flow.json';
const META_FILE = 'meta.json';
const PKG_FILE = 'package.json';
const TYPES_FILE = 'types.json';
const MD5_FILE = 'degit.md5';

export interface IAppState {
  published: boolean;
  enabled: boolean;
  editable: boolean;
}
export class AppModel extends Disposable {
  public md5?: string;
  public meta!: IAppMeta;
  public stat!: IStatInfo;
  public pkgInfo!: IPackageInfo;
  public types!: string[];
  public globalVarObj!: IGlobalVarObj;
  private then?;
  private watcher?: chokidar.FSWatcher;
  private vFolderName: string;
  constructor(
    public readonly folderName: string,
    public readonly version: number,
    public readonly state: IAppState,
    initial: boolean,
    @ILogService private readonly logService: ILogService,
    @ICodeService private readonly codeService: ICodeService,
    @IAppProjectService private readonly projectService: IAppProjectService,
  ) {
    super();
    this.vFolderName = path.join(folderName, this.versionFolder);
    if (initial) {
      const promise = this.init();
      this.then = promise.then.bind(promise);
    }
  }
  async init() {
    try {
      this.initWatcher();
      await Promise.all([
        this.getAppStat(),
        this.getAppMeta(),
        this.getAppMd5(),
        this.getPkgInfo(),
        this.getGlobalVar(),
        this.getTypes(),
      ]);
      delete this.then;
      return this;
    } catch (e) {
      this.logService.error('Initial:' + e);
    }
  }
  private initWatcher(): void {
    this.watcher = chokidar.watch(this.root, {
      ignored: ['node_modules', FLOW_FILE, /(^|[\/\\])\../],
      ignoreInitial: true,
      cwd: this.root,
    });
    this.watcher.on('change', (path) => {
      if (path === META_FILE) {
        this.getAppStat();
      } else if (path === PKG_FILE) {
        this.getPkgInfo();
      } else if (path === MD5_FILE) {
        this.getAppMd5();
      } else if (path === TYPES_FILE) {
        this.getTypes();
      }
    });
  }
  private async getAppStat() {
    try {
      this.stat = await this.projectService.getProjectStat(this.vFolderName);
    } catch (e) {
      this.delete();
    }
  }
  async setAppMeta(info: Partial<IAppMeta>) {
    const newMeta = Object.assign({}, this.meta, info);
    await this.projectService.setProjectMeta(this.vFolderName, newMeta);
    this.meta = newMeta;
  }
  private async getAppMeta() {
    try {
      this.meta = await this.projectService.getProjectMeta(this.vFolderName);
    } catch (e) {
      this.delete();
    }
  }
  async setAppIndex(codeStr: string) {
    await this.projectService.setIndexContent(this.vFolderName, codeStr);
  }
  async createAppComponent(requiredCodeMap: Map<string, ICodeMeta>) {
    for (const [id, codeMeta] of requiredCodeMap) {
      const indexStr = await this.codeService.getModuleExport(codeMeta.meta);
      await this.projectService.setFileContent(
        path.join(this.vFolderName, COMP_FOLDER, id),
        'index.js',
        indexStr,
      );
      await this.projectService.setFileContent(
        path.join(this.vFolderName, COMP_FOLDER, id),
        'code.js',
        codeMeta.code,
      );
    }
  }
  async setAppFlow(jsonArr: CommandNode[]) {
    await this.projectService.setAppFlow(this.vFolderName, jsonArr);
  }
  async getAppFlow() {
    const flowList = await this.projectService.getAppFlow(this.vFolderName);
    return flowList;
  }
  private async setGlobalVar(globalVar: IGlobalVar) {
    const { name, value, type } = globalVar;
    globalVar.value = convertStrByType(value, type);
    const clonedGlobalVar = cloneDeep(globalVar);
    clonedGlobalVar.value = JSON.stringify(clonedGlobalVar.value, null, '\t');
    this.globalVarObj[name] = clonedGlobalVar;
    const globalVarObj = await this.projectService.getGlobalVar(this.vFolderName);
    globalVarObj[name] = globalVar;
    await this.projectService.setGlobalVar(this.vFolderName, globalVarObj);
  }
  async addGlobalVar(globalVar: IGlobalVar) {
    if (this.globalVarObj[globalVar.name]) {
      throw new Error('name exist');
    }
    await this.setGlobalVar(globalVar);
  }
  async editGlobalVar(globalVar: IGlobalVar) {
    await this.setGlobalVar(globalVar);
  }
  async getGlobalVar() {
    const globalVarObj = await this.projectService.getGlobalVar(this.vFolderName);
    for (const item in globalVarObj) {
      globalVarObj[item].value = JSON.stringify(globalVarObj[item].value, null, '\t');
    }
    this.globalVarObj = globalVarObj;
  }

  private async getPkgInfo() {
    try {
      this.pkgInfo = await this.projectService.getPackageInfo(this.vFolderName);
    } catch (e) {
      this.delete();
    }
  }
  private async getAppMd5() {
    try {
      this.md5 = await this.projectService.getFileContent(this.vFolderName, MD5_FILE);
    } catch (err) {
      this.md5 = '';
    }
  }
  private async getTypes() {
    const types = await this.projectService.getTypes(this.vFolderName);
    this.types = types;
  }
  async setTypes(typeItem: string) {
    if (typeItem === '') {
      throw new Error('need a string type, but got empty type');
    }
    this.types.push(typeItem);
    await this.projectService.setTypes(this.vFolderName, this.types);
  }
  get item() {
    return Object.assign({ version: this.version }, this.meta, this.stat, this.state);
  }
  get versionFolder(): string {
    return `v${this.version}`;
  }
  @memoize
  get root(): string {
    return this.projectService.getProjectRoot(this.vFolderName);
  }
  async delete() {
    await this.projectService.delProject(this.folderName);
    this.dispose();
  }
  async compress(): Promise<CompressResult> {
    const { fileStream } = await this.projectService.compress(this.folderName, this.versionFolder);
    return { fileStream };
  }
  async decompress(md5, remoteStream): Promise<void> {
    await this.projectService.decompress(this.vFolderName, md5, remoteStream);
  }
  dispose() {
    super.dispose();
    this.watcher?.close();
  }
}
