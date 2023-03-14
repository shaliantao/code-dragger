import { generateUuid } from '@base/common/uuid';
import { ILogService } from '@base/log/logService';
import { IHttpService } from '@src/base/http/http';
import { CommandNode } from '@src/platform/common/types';
import { ICommandService } from '@src/platform/command/command';
import { IGroupService } from '@src/platform/group/group';
import { IAppProjectService } from '@src/platform/project/appProjectService';
import { IAppMeta, IGlobalVar, initialMetaInfo } from '@src/platform/app/app';
import { AppModel } from '@src/platform/app/appModel';
import { IInstantiationService } from '@base/instantiation/instantiation';
import { getPlatform } from '@src/platform/common/utils';
import { CaptureWindow } from '@src/window/captureWindow';
import path from 'node:path';
import { AppInfo } from '/#/api';

const INITIAL_VERSION = 1;

type AppMap = Map<string, AppModel>;
export class AppManager {
  editableAppMap: AppMap = new Map();
  enabledAppMap: AppMap = new Map();
  private _captureWin: CaptureWindow | null = null;
  constructor(
    @ILogService private readonly logService: ILogService,
    @IHttpService private readonly httpService: IHttpService,
    @IGroupService private readonly groupService: IGroupService,
    @ICommandService private readonly commandService: ICommandService,
    @IAppProjectService private readonly projectService: IAppProjectService,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
  ) {
    this.initEditableApp();
    this.initEnableApp();
  }
  private async initEditableApp() {
    const editableApps = (await this.getEditableApps()) || [];
    await this.initAppMap(this.editableAppMap, editableApps);
    await this.syncEditableApps(editableApps);
  }
  private async initEnableApp() {
    const enabledApps = (await this.getEnabledApps()) || [];
    await this.initAppMap(this.enabledAppMap, enabledApps);
  }

  private async initAppMap(appMap: AppMap, remoteApps: AppInfo[]) {
    // 启用中或编辑中的应用id及应用信息
    const keyVersionMap = new Map<string, any>(remoteApps.map((item) => [item.appId, item]));
    const list = await this.projectService.getFolderList();
    const filteredList: string[] = [];
    for (const item of list) {
      // 获取本地应用名称对应的线上版本
      const version = keyVersionMap.get(item)?.version;
      // 只保留本地和线上版本一致的应用
      if (version && (await this.projectService.checkVersionExist(item, `v${version}`))) {
        filteredList.push(item);
      }
    }
    const appList: [string, AppModel][] = await Promise.all(
      filteredList.map(async (folder) => {
        const { version, published, enabled, editable } = keyVersionMap.get(folder)!;
        const appState = {
          published,
          enabled,
          editable,
        };
        return [
          folder,
          await this.instantiationService.createInstance(AppModel, folder, version, appState, true),
        ];
      }),
    );
    if (appMap) {
      // 清除实例监听，防止内存泄漏
      Array.from(appMap.values()).forEach((item) => item.dispose());
      appMap.clear();
    }
    // 过滤掉初始化失败的AppModel
    const filteredGroupList = appList.filter(([_key, value]) => !!value);
    for (const [key, value] of filteredGroupList) {
      appMap.set(key, value);
    }
  }
  // 新建应用
  async newApp(info: Partial<IAppMeta>) {
    const uuid = generateUuid();
    const localFolderName = path.join(uuid, `v${INITIAL_VERSION}`);
    const packageInfo = {
      path: localFolderName,
      name: `app-${uuid}`,
      auth: 'slt',
    };
    const metaInfo = { ...initialMetaInfo(uuid), ...info };
    await this.projectService.newProject(packageInfo, metaInfo);
    const appModel = await this.instantiationService.createInstance(
      AppModel,
      uuid,
      INITIAL_VERSION,
      { published: false, enabled: false, editable: true },
      true,
    );
    if (appModel) {
      this.editableAppMap.set(uuid, appModel);
    }
    await this.create(uuid, info);
    return uuid;
  }
  // 删除内存中编辑中的应用
  async delEditableApp(uuid: string) {
    await this.editableAppMap.get(uuid)?.delete();
    this.editableAppMap.delete(uuid);
  }
  async delApp(uuid: string) {
    try {
      await this.httpService.delete({
        url: `application/${uuid}`,
      });
      this.delEditableApp(uuid);
    } catch (e) {
      this.logService.error('delete app error:' + e);
      throw new Error('Delete: ' + e);
    }
  }
  // 应用运行前的处理
  async initBeforeStart(appModel: AppModel, jsonArr: CommandNode[]) {
    const { code, requiredGroupDeps, requiredCodeMap } = await this.commandService.jsonToCode(
      jsonArr,
    );
    // 运行前检查依赖的分组是否都已经下载
    await this.groupService.checkRequiredGroups(requiredGroupDeps);
    await appModel.setAppIndex(code);
    await appModel.createAppComponent(requiredCodeMap);
  }
  async saveApp(uuid: string, jsonArr: CommandNode[], info: Partial<IAppMeta>) {
    const app = this.editableAppMap.get(uuid)!;
    await app.setAppMeta(info);
    await app.setAppFlow(jsonArr);
    await this.update(uuid);
  }
  async showApp(uuid: string) {
    const app = this.editableAppMap.get(uuid)!;
    const flowList = app.getAppFlow();
    return flowList;
  }
  async getAppList() {
    await this.syncEditableApps();
    return Array.from(this.editableAppMap.values()).map((app) => app.item);
  }
  async getAppInfo(uuid: string) {
    const { meta, state, version } = this.editableAppMap.get(uuid)! || {};
    return { ...meta, ...state, version };
  }
  getWorkspace(uuid: string): string {
    const path = this.editableAppMap.get(uuid)!.root;
    return path;
  }
  // 新建远端应用
  async create(uuid: string, info: Partial<IAppMeta>) {
    const app = this.editableAppMap.get(uuid)!;
    const { fileStream } = await app.compress();
    const { id: appId, diffPlatform } = app.meta;
    const platform = getPlatform(diffPlatform);
    try {
      await this.httpService.uploadFile(
        {
          url: 'application',
        },
        {
          data: {
            platform: platform,
            appId,
            appName: info.name,
          },
          files: [{ name: 'file', file: fileStream, filename: 'app.tgz' }],
        },
      );
    } catch (e: any) {
      this.logService.error('save app error:' + e);
      throw new Error(e.message);
    }
  }
  private async updateApp(uuid: string, isPublish = false): Promise<void> {
    const appModel = this.editableAppMap.get(uuid)!;
    const { fileStream } = await appModel.compress();
    const { id: appId, name, diffPlatform } = appModel.meta;
    const platform = getPlatform(diffPlatform);
    try {
      const url = `application/${isPublish ? 'publish' : ''}`;
      await this.httpService.uploadFile(
        {
          url,
          method: 'PUT',
        },
        {
          data: {
            platform: platform,
            appId,
            appName: name,
            version: appModel.version,
            published: appModel.state.published.toString(),
          },
          files: [{ name: 'file', file: fileStream, filename: 'app.tgz' }],
        },
      );
    } catch (e: any) {
      this.logService.error('upload app error:' + e);
      throw new Error(e.message);
    }
  }
  async update(uuid: string): Promise<void> {
    await this.updateApp(uuid);
  }
  async publish(uuid: string): Promise<void> {
    await this.updateApp(uuid, true);
    await this.syncEditableApps();
  }
  private async download(appMap: AppMap, app: AppInfo) {
    // 对比etag只下载etag不一致的文件
    const { appId: uuid, published, enabled, editable, md5: remoteMd5, version } = app || {};
    const localMd5 = appMap.get(uuid)?.md5;
    const appState = {
      published,
      enabled,
      editable,
    };
    const appModel = this.instantiationService.createInstance(
      AppModel,
      uuid,
      version,
      appState,
      false,
    );
    if (remoteMd5 !== localMd5) {
      const ossKey = app.oss_path;
      // 下载
      const res = await this.httpService.get({
        url: 'oss',
        params: {
          key: ossKey,
        },
        responseType: 'stream',
      });
      // 解压
      await appModel.decompress(remoteMd5, res);
      const model = await appModel.init();
      if (model) {
        appMap.get(uuid)?.dispose();
        appMap.set(uuid, model);
      }
    }
  }
  async syncEditableApps(remoteApps?: AppInfo[]) {
    try {
      const apps = remoteApps || (await this.getEditableApps());
      // 删除editableGroupMap中groups不包含的分组, 防止出现缓存的历史分组
      for (const uuid of this.editableAppMap.keys()) {
        const find = apps.find((app) => app?.appId === uuid);
        if (!find) {
          await this.delEditableApp(uuid);
        }
      }
      return await Promise.all(
        apps?.map(async (app) => {
          await this.download(this.editableAppMap, app);
        }),
      );
    } catch (e: any) {
      this.logService.error('sync app error:' + e);
      throw new Error(e.message);
    }
  }
  // 获取编辑中的应用列表
  private async getEditableApps(): Promise<AppInfo[]> {
    try {
      const platform = getPlatform(true);
      const res = await this.httpService.get({
        url: 'application',
        params: {
          editable: true,
          platform,
        },
      });
      return res?.data;
    } catch (err: any) {
      this.logService.error('get editable app list error:' + err);
      throw new Error(err.message);
    }
  }
  // 获取编辑中的应用列表
  private async getEnabledApps(): Promise<AppInfo[]> {
    try {
      const platform = getPlatform(true);
      const res = await this.httpService.get({
        url: 'application',
        params: {
          enabled: true,
          platform,
        },
      });
      return res?.data;
    } catch (err: any) {
      this.logService.error('get enabled app list error:' + err);
      throw new Error(err.message);
    }
  }
  // 获取启用中的应用
  private async getEnabledApp(uuid: string): Promise<AppInfo> {
    try {
      const platform = getPlatform(true);
      const res = await this.httpService.get({
        url: `application/${uuid}`,
        params: {
          enabled: true,
          platform,
        },
      });
      return res?.data[0];
    } catch (err: any) {
      this.logService.error('get enabled app error:' + err);
      throw new Error(err.message);
    }
  }
  // 检查运行所需应用，并下载与本地版本不一致的应用
  async checkRequiredEnabledApp(uuid: string): Promise<void> {
    const app = await this.getEnabledApp(uuid);
    if (app) {
      await this.download(this.enabledAppMap, app);
    } else {
      throw new Error('app not found');
    }
  }
  private showCaptureWin(url?: string) {
    if (this._captureWin === null) {
      this._captureWin = this.instantiationService.createInstance(CaptureWindow);
      this._captureWin.createWindow();
    }
    this._captureWin?.show(url);
  }
  // 打开新窗口获取xpath
  async getXpath(uuid: string, url?: string): Promise<void> {
    this.showCaptureWin(url);
  }
  async addGlobalVar(uuid: string, globalVar: IGlobalVar) {
    const model = this.editableAppMap.get(uuid);
    await model?.addGlobalVar(globalVar);
  }
  async editGlobalVar(uuid: string, globalVar: IGlobalVar) {
    const model = this.editableAppMap.get(uuid);
    await model?.editGlobalVar(globalVar);
  }
  async getGlobalList(uuid: string): Promise<IGlobalVar[]> {
    const globalVarObj = this.editableAppMap.get(uuid)!.globalVarObj;
    return Object.values(globalVarObj);
  }
  async setTypes(uuid: string, typeItem: string): Promise<void> {
    await this.editableAppMap.get(uuid)!.setTypes(typeItem);
  }
  async getTypes(uuid: string): Promise<string[]> {
    const list = await this.editableAppMap.get(uuid)!.types;
    return list;
  }
}
