import { IAppMeta } from '@src/platform/app/app';
import { ILogService } from '@base/log/logService';
import { IAppProjectService } from '@src/platform/project/appProjectService';
import { IStatInfo, IPackageInfo, CompressResult } from '@src/platform/project/project';
import { Disposable } from '@base/common/lifecycle';
import { memoize } from '@base/common/decorators';
import chokidar from 'chokidar';

const FLOW_FILE = 'flow.json';
const META_FILE = 'meta.json';
const PKG_FILE = 'package.json';
const MD5_FILE = 'degit.md5';

export class AppModel extends Disposable {
  public md5?: string;
  public meta!: IAppMeta;
  public stat!: IStatInfo;
  public pkgInfo!: IPackageInfo;
  private then?;
  private watcher?: chokidar.FSWatcher;
  constructor(
    public readonly folderName: string,
    initial: boolean,
    @ILogService private readonly logService: ILogService,
    @IAppProjectService private readonly projectService: IAppProjectService,
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
        this.getAppStat(),
        this.getAppMeta(),
        this.getAppMd5(),
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
      }
    });
  }
  private async getAppStat() {
    try {
      this.stat = await this.projectService.getProjectStat(this.folderName);
    } catch (e) {
      this.delete();
    }
  }
  async setAppMeta(info: Partial<IAppMeta>) {
    const newMeta = Object.assign({}, this.meta, info);
    await this.projectService.setProjectMeta(this.folderName, newMeta);
    this.meta = newMeta;
  }
  private async getAppMeta() {
    try {
      this.meta = await this.projectService.getProjectMeta(this.folderName);
    } catch (e) {
      this.delete();
    }
  }
  private async getPkgInfo() {
    try {
      this.pkgInfo = await this.projectService.getPackageInfo(this.folderName);
    } catch (e) {
      this.delete();
    }
  }
  private async getAppMd5() {
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
  async compress(): Promise<CompressResult> {
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
