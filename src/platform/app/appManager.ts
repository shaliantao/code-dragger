import { generateUuid } from '@base/common/uuid';
import { ILogService } from '@base/log/logService';
import { IHttpService } from '@src/base/http/http';
import { CommandNode } from '@src/platform/common/types';
import { ICommandService } from '@src/platform/command/command';
import { IGroupService } from '@src/platform/group/group';
import { IAppProjectService } from '@src/platform/project/appProjectService';
import { IAppMeta, initialMetaInfo } from '@src/platform/app/app';
import { AppModel } from '@src/platform/app/appModel';
import { IInstantiationService } from '@base/instantiation/instantiation';
export class AppManager {
  private appMap: Map<string, AppModel> = new Map();
  constructor(
    @ILogService private readonly logService: ILogService,
    @IHttpService private readonly httpService: IHttpService,
    @IGroupService private readonly groupService: IGroupService,
    @ICommandService private readonly commandService: ICommandService,
    @IAppProjectService private readonly projectService: IAppProjectService,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
  ) {
    this.loadApp();
  }
  private async loadApp() {
    const list = await this.projectService.getFolderList();
    const appList: [string, AppModel][] = await Promise.all(
      list.map(async (folder) => [
        folder,
        await this.instantiationService.createInstance(AppModel, folder, true),
      ]),
    );
    this.appMap = new Map(appList);
    await this.sync();
  }
  async createApp(info?: Partial<IAppMeta>) {
    this.logService.debug('create app');
    const uuid = generateUuid();
    const packageInfo = {
      path: uuid,
      name: `app-${uuid}`,
      auth: 'slt',
    };
    const metaInfo = { ...initialMetaInfo(uuid), ...info };
    await this.projectService.newProject(packageInfo, metaInfo);
    this.appMap.set(uuid, await this.instantiationService.createInstance(AppModel, uuid, true));
    return uuid;
  }
  async delApp(uuid: string) {
    try {
      await this.httpService.delete({
        url: `application/${uuid}`,
      });
      await this.appMap.get(uuid)?.delete();
      this.appMap.delete(uuid);
    } catch (e) {
      this.logService.error('delete error:' + e);
      throw new Error('Delete: ' + e);
    }
  }
  async saveApp(uuid: string, jsonArr: CommandNode[]) {
    const jsonStr = JSON.stringify(jsonArr);
    const codeStr = await this.commandService.jsonToCodeStr(jsonStr);
    const deps = this.commandService.requiredGroupDeps;
    const res = await this.groupService.checkRequiredGroups(deps);
    console.log(res);
    await this.projectService.setIndexContent(uuid, codeStr);
    await this.projectService.setAppFlow(uuid, jsonArr);
  }
  async showApp(uuid: string) {
    const flowList = await this.projectService.getAppFlow(uuid);
    return flowList;
  }
  async getAppList() {
    await this.sync();
    return Array.from(this.appMap.values()).map((app) => app.item);
  }
  async getAppInfo(uuid: string) {
    const info = this.appMap.get(uuid)!.meta;
    return info;
  }
  async setAppInfo(uuid: string, info: Partial<IAppMeta>) {
    await this.appMap.get(uuid)?.setAppMeta(info);
  }
  getWorkspace(uuid: string): string {
    const path = this.appMap.get(uuid)!.root;
    return path;
  }
  async publish(uuid: string): Promise<void> {
    const appModel = this.appMap.get(uuid)!;
    const meta = appModel.meta;
    const { fileStream } = await appModel.compress();
    try {
      await this.httpService.uploadFile(
        {
          url: 'application/publish',
        },
        {
          data: {
            project_id: meta.id,
          },
          files: [{ name: 'file', file: fileStream, filename: 'app.tgz' }],
        },
      );
    } catch (e) {
      this.logService.error('upload error:' + e);
      throw new Error('Publish: ' + e);
    }
  }
  private async download(app) {
    // 对比etag只下载etag不一致的文件
    const projectId = app.app.project_id;
    const remoteMd5 = app.md5;
    const localMd5 = this.appMap.get(projectId)?.md5;
    if (remoteMd5 !== localMd5) {
      const ossKey = app.oss_path;
      // 下载
      const res = await this.httpService.get({
        url: 'oss/download',
        params: {
          key: ossKey,
        },
        responseType: 'stream',
      });
      const appModel = this.instantiationService.createInstance(AppModel, projectId, false);
      // 解压
      await appModel.decompress(remoteMd5, res.data);
      const model = await appModel.init();
      if (model) {
        this.appMap.get(projectId)?.dispose();
        this.appMap.set(projectId, model);
      }
    }
  }
  async sync() {
    try {
      const res = await this.httpService.get({
        url: 'application',
      });
      res?.data?.map((app) => {
        this.download(app);
      });
    } catch (e) {
      this.logService.error('async error:' + e);
    }
  }
}
