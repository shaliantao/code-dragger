import path from 'node:path';
import { IGroupMeta } from '@src/platform/group/group';
import { IComponentMeta } from '@src/platform/component/component';
import { ComponentModel } from '@src/platform/component/componentModel';
import { ILogService } from '@base/log/logService';
import { ICodeService } from '@src/platform/code/code';
import { CompressResult } from '@src/platform/project/project';
import { IGroupProjectService } from '@src/platform/project/groupProjectService';
import {
  IComponentProjectService,
  CompProjectService,
} from '@src/platform/project/compProjectService';
import { IInstantiationService } from '@base/instantiation/instantiation';
import { ServiceCollection } from '@base/instantiation/serviceCollection';
import { SyncDescriptor } from '@base/instantiation/descriptors';
import { IStatInfo, IPackageInfo, NewPackageInfo } from '@src/platform/project/project';
import { Disposable } from '@base/common/lifecycle';
import chokidar from 'chokidar';
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { memoize } from '@base/common/decorators';

const COMP_FOLDER = 'components';
const TYPES_FILE = 'types.json';
const META_FILE = 'meta.json';
const PKG_FILE = 'package.json';
const MD5_FILE = 'degit.md5';

export interface IGroupState {
  published: boolean;
  enabled: boolean;
  editable: boolean;
}

export class GroupModel extends Disposable {
  public md5?: string;
  public meta!: IGroupMeta;
  public stat!: IStatInfo;
  public pkgInfo!: IPackageInfo;
  public types!: string[];
  public componentMap: Map<string, ComponentModel> = new Map();
  private vFolderName: string;
  private then?;
  private watcher?: chokidar.FSWatcher;
  private innerInstantiationService!: IInstantiationService;
  constructor(
    public readonly folderName: string,
    public readonly version: number,
    public readonly state: IGroupState,
    public initilized: boolean,
    @ILogService private readonly logService: ILogService,
    @ICodeService private readonly codeService: ICodeService,
    @IGroupProjectService private readonly projectService: IGroupProjectService,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
  ) {
    super();
    this.vFolderName = path.join(folderName, this.versionFolder);
    this.innerInstantiationService = this.createServices();
    if (initilized) {
      const promise = this.init();
      this.then = promise.then.bind(promise);
    }
  }
  async init() {
    try {
      this.initWatcher();
      await Promise.all([
        this.loadComponents(),
        this.getGroupStat(),
        this.getGroupMeta(),
        this.getGroupMd5(),
        this.getPkgInfo(),
        this.getTypes(),
      ]);
      delete this.then;
      this.initilized = true;
      return this;
    } catch (e) {
      this.logService.error('Initial:' + e);
    }
  }
  private createServices(): IInstantiationService {
    const services = new ServiceCollection();
    services.set(
      IComponentProjectService,
      new SyncDescriptor(CompProjectService, [this.vFolderName]),
    );
    return this.instantiationService.createChild(services);
  }
  private initWatcher(): void {
    this.watcher = chokidar.watch(this.root, {
      ignored: ['node_modules', COMP_FOLDER],
      ignoreInitial: true,
      cwd: this.root,
    });
    this.watcher.on('change', (path) => {
      if (path === META_FILE) {
        this.getGroupMeta();
      } else if (path === PKG_FILE) {
        this.getPkgInfo();
      } else if (path === MD5_FILE) {
        this.getGroupMd5();
      } else if (path === TYPES_FILE) {
        this.getTypes();
      }
    });
  }
  private async getGroupStat() {
    this.stat = await this.projectService.getProjectStat(this.vFolderName);
  }
  async setGroupMeta(info: Partial<IGroupMeta>) {
    const newMeta = Object.assign({}, this.meta, info);
    await this.projectService.setProjectMeta(this.vFolderName, newMeta);
    this.meta = newMeta;
  }
  private async getGroupMeta() {
    const meta = await this.projectService.getProjectMeta(this.vFolderName);
    this.meta = meta;
  }
  private async getPkgInfo() {
    this.pkgInfo = await this.projectService.getPackageInfo(this.vFolderName);
  }
  private async getGroupMd5() {
    try {
      this.md5 = await this.projectService.getFileContent(this.vFolderName, MD5_FILE);
    } catch (err) {
      this.md5 = '';
    }
  }
  private async getTypes() {
    this.types = await this.projectService.getTypes(this.vFolderName);
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
  get versionFolder() {
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
  private async updateGroupIndex() {
    const indexCode = this.codeService.genGroupIndex(
      Array.from(this.componentMap.values()).map((comp) => comp.item),
    );
    await this.projectService.setIndexContent(this.vFolderName, indexCode);
  }
  async compress(): Promise<CompressResult> {
    const { fileStream } = await this.projectService.compress(this.folderName, this.versionFolder);
    return { fileStream };
  }
  async decompress(md5: string, remoteStream): Promise<void> {
    await this.projectService.decompress(this.vFolderName, md5, remoteStream);
  }
  async setMd5(md5: string) {
    this.md5 = md5;
    await this.projectService.setFileContent(this.vFolderName, 'degit.md5', md5);
  }
  private async loadComponents() {
    const list = await this.projectService.getFolderList(path.join(this.vFolderName, COMP_FOLDER));
    const componentList: [string, ComponentModel][] = await Promise.all(
      list.map(async (compFolder) => [compFolder, await this.newComponentModel(compFolder, true)]),
    );
    this.componentMap = new Map(componentList);
  }
  async newComponentModel(compName: string, initial: boolean) {
    return await this.innerInstantiationService.createInstance(ComponentModel, compName, initial);
  }
  async setComponent(compName: string) {
    this.componentMap.set(compName, await this.newComponentModel(compName, true));
  }
  async createComponents(packageInfo: NewPackageInfo, metaInfo: IComponentMeta) {
    await this.innerInstantiationService.invokeFunction(async (accessor) => {
      try {
        await accessor.get(IComponentProjectService).newProject(packageInfo, metaInfo);
        await this.setComponent(metaInfo.func);
        // 先设置componentMap，后更新index
        await this.updateGroupIndex();
      } catch (e) {
        this.logService.error('createComponents error: ', e);
      }
    });
  }
  async deleteComponent(compName: string) {
    await this.componentMap.get(compName)?.delete();
    this.componentMap.delete(compName);
    await this.updateGroupIndex();
  }
  dispose() {
    super.dispose();
    if (this.componentMap) {
      Array.from(this.componentMap.values()).forEach((item) => item.dispose());
    }
    this.watcher?.close();
  }
}
