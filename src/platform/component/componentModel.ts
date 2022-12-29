import { IComponentMeta } from '@src/platform/component/component';
import { ILogService } from '@base/log/logService';
import { ICodeService } from '@src/platform/code/code';
import { IComponentProjectService } from '@src/platform/project/compProjectService';
import { IStatInfo, IPackageInfo } from '@src/platform/project/project';
import { Disposable } from '@base/common/lifecycle';
import { memoize } from '@base/common/decorators';
import chokidar from 'chokidar';

const CODE_FILE = 'code.js';
const META_FILE = 'meta.json';
const PKG_FILE = 'package.json';
const MD5_FILE = 'degit.md5';

export class ComponentModel extends Disposable {
  public md5?: string;
  public meta!: IComponentMeta;
  public stat!: IStatInfo;
  public pkgInfo!: IPackageInfo;
  private then?;
  private watcher?: chokidar.FSWatcher;
  constructor(
    public readonly folderName: string,
    initial: boolean,
    @ILogService private readonly logService: ILogService,
    @ICodeService private readonly codeService: ICodeService,
    @IComponentProjectService private readonly projectService: IComponentProjectService,
  ) {
    super();
    if (initial) {
      const promise = this.init();
      this.then = promise.then.bind(promise);
    }
  }
  async init() {
    try {
      this.initWatcher();
      await Promise.all([
        this.getCompStat(),
        this.getCompMeta(),
        this.getCompMd5(),
        this.getPkgInfo(),
      ]);
      delete this.then;
      return this;
    } catch (e) {
      this.logService.error('Initial:' + e);
    }
  }
  private initWatcher(): void {
    this.watcher = chokidar.watch(this.root, {
      ignored: ['node_modules', CODE_FILE],
      ignoreInitial: true,
      cwd: this.root,
    });
    this.watcher.on('change', (path) => {
      if (path === META_FILE) {
        this.getCompStat();
      } else if (path === PKG_FILE) {
        this.getPkgInfo();
      } else if (path === MD5_FILE) {
        this.getCompMd5();
      }
    });
  }
  private async getCompStat() {
    this.stat = await this.projectService.getProjectStat(this.folderName);
  }
  async setCompMeta(info: Partial<IComponentMeta>) {
    const newMeta = Object.assign({}, this.meta, info);
    await this.projectService.setProjectMeta(this.folderName, newMeta);
    this.meta = newMeta;
    const indexCodeStr = this.codeService.getModuleExport(newMeta);
    await this.projectService.setIndexContent(this.folderName, indexCodeStr);
  }
  private async getCompMeta() {
    this.meta = await this.projectService.getProjectMeta(this.folderName);
  }
  private async getPkgInfo() {
    this.pkgInfo = await this.projectService.getPackageInfo(this.folderName);
  }
  private async getCompMd5() {
    try {
      this.md5 = await this.projectService.getFileContent(this.folderName, MD5_FILE);
    } catch (err) {
      this.md5 = '';
    }
  }
  get item() {
    return Object.assign({}, this.meta, this.stat);
  }
  @memoize
  get root(): string {
    return this.projectService.getProjectRoot(this.folderName);
  }
  async delete() {
    await this.projectService.delProject(this.folderName);
    this.dispose();
  }
  async saveCode(codeStr: string) {
    await this.projectService.setFileContent(this.folderName, 'code.js', codeStr);
  }
  async showCode() {
    const code = await this.projectService.getFileContent(this.folderName, 'code.js');
    return code;
  }
  async compress() {
    const { fileStream } = await this.projectService.compress(this.folderName);
    return { fileStream };
  }
  async decompress(md5, remoteStream): Promise<void> {
    await this.projectService.decompress(this.folderName, md5, remoteStream);
  }
  dispose() {
    super.dispose();
    this.watcher?.close();
  }
}
