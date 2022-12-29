import path from 'path';
import { generateUuid } from '@base/common/uuid';
import { ILogService } from '@base/log/logService';
import { IHttpService } from '@src/base/http/http';
import { getPlatform } from '@src/platform/common/utils';
import { IGroupProjectService } from '@src/platform/project/groupProjectService';
import { IGroupMeta, initialMetaInfo } from '@src/platform/group/group';
import { IPackageInfo } from '@src/platform/project/project';
import { GroupModel } from '@src/platform/group/groupModel';
import { IRequiredGroupDep } from '@src/platform/command/command';
import { IInstantiationService } from '@base/instantiation/instantiation';

const VITE_GLOB_APP_SHORT_NAME = process.env['VITE_GLOB_APP_SHORT_NAME'];
const INITIAL_VERSION = 1;

type GroupMap = Map<string, GroupModel>;

export class GroupManager {
  localGroupMap: GroupMap = new Map();
  enabledGroupMap: GroupMap = new Map();
  constructor(
    @ILogService private readonly logService: ILogService,
    @IGroupProjectService private readonly projectService: IGroupProjectService,
    @IHttpService private readonly httpService: IHttpService,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
  ) {
    this.loadLocalGroups();
    this.loadEnabledGroups();
  }
  private async loadLocalGroups() {
    const editableGroups = (await this.getEditableGroups()) || [];
    await this.loadGroups(this.localGroupMap, editableGroups);
    await this.syncLocalGroups();
  }
  // 获取本地的启用分组，与远端启用分组比较并同步
  private async loadEnabledGroups() {
    const enableGroups = (await this.getEnabledGroups()) || [];
    await this.loadGroups(this.enabledGroupMap, enableGroups);
    await this.syncEnabledGroups();
  }
  private async loadGroups(groupMap: GroupMap, remoteGroups) {
    // 启用中的分组key及version
    const keyVersionMap = new Map<string, any>(
      remoteGroups.map((item) => [item.group.project_key, item]),
    );
    const list = await this.projectService.getFolderList();
    const filteredList: string[] = [];
    for (const item of list) {
      const version = keyVersionMap.get(item)?.version;
      // 只保留启用中的分组文件夹
      if (version && (await this.projectService.checkVersionExist(item, `v${version}`))) {
        filteredList.push(item);
      }
    }
    const groupList: [string, GroupModel][] = await Promise.all(
      filteredList.map(async (folder) => {
        const { version, published, enabled, editable } = keyVersionMap.get(folder)!;
        const groupState = {
          published,
          enabled,
          editable,
        };
        return [
          folder,
          await this.instantiationService.createInstance(
            GroupModel,
            folder,
            version,
            groupState,
            true,
          ),
        ];
      }),
    );
    if (groupMap) {
      // 清除实例监听，防止内存泄漏
      Array.from(groupMap.values()).forEach((item) => item.dispose());
      groupMap.clear();
    }
    const filteredGroupList = groupList.filter(([_key, value]) => !!value);
    for (const [key, value] of filteredGroupList) {
      groupMap.set(key, value);
    }
  }
  async newGroup(info: Partial<IGroupMeta>) {
    const uuid = generateUuid();
    if (!info.key) {
      throw new Error('require group key');
    }
    const groupKey = info.key;
    let groupLowerKey = groupKey.toLowerCase();
    if (groupLowerKey.includes('$')) {
      // $在package name中不合法，替换处理
      groupLowerKey = groupLowerKey.replace('$', 'admin-');
    }
    const pkgName = `${VITE_GLOB_APP_SHORT_NAME}-${groupLowerKey}`;

    const localFolderName = path.join(groupKey, `v${INITIAL_VERSION}`);
    const packageInfo = {
      path: localFolderName,
      name: pkgName,
      auth: 'slt',
    };
    const metaInfo = { ...initialMetaInfo(uuid), ...info };
    await this.projectService.newProject(packageInfo, metaInfo);
    const groupModel = await this.instantiationService.createInstance(
      GroupModel,
      groupKey,
      INITIAL_VERSION,
      { published: false, enabled: false, editable: true },
      true,
    );
    if (groupModel) {
      this.localGroupMap.set(groupKey, groupModel);
    }
    await this.create(groupKey);
    return uuid;
  }
  async getVersions(key: string) {
    const { id } = this.localGroupMap.get(key)?.meta || {};
    try {
      const platform = getPlatform(true);
      const res = await this.httpService.get({
        url: `group/${id}/version`,
        params: {
          platform,
        },
      });
      return res?.data;
    } catch (e: any) {
      this.logService.error('get versions error:' + e);
      throw new Error(e.message);
    }
  }
  async delLocalGroup(key: string) {
    await this.localGroupMap.get(key)?.delete();
    this.localGroupMap.delete(key);
  }
  async delEnabledGroup(key: string) {
    await this.enabledGroupMap.get(key)?.delete();
    this.enabledGroupMap.delete(key);
  }
  async delGroup(key: string) {
    const { id } = this.localGroupMap.get(key)!.meta;
    await this.httpService.delete({
      url: `group/${id}`,
    });
    await this.delLocalGroup(key);
    await this.delEnabledGroup(key);
  }
  async getGroupList() {
    await this.syncLocalGroups();
    const list = Array.from(this.localGroupMap.values()).map((group) => group.item);
    return list;
  }
  async getComponentList(key: string) {
    const group = this.localGroupMap.get(key)!;
    const list = Array.from(group.componentMap.values()).map((group) => group.item);
    return list;
  }
  async getGroupInfo(key: string) {
    const { meta, state, version } = this.localGroupMap.get(key)! || {};
    return { ...meta, ...state, version };
  }
  async setGroupInfo(key: string, info: Partial<IGroupMeta>) {
    await this.localGroupMap.get(key)?.setGroupMeta(info);
    await this.update(key);
  }
  async getWorkspace(key: string): Promise<string> {
    const path = this.localGroupMap.get(key)!.root;
    return path;
  }
  async setGroupTypes(key: string, typeItem: string): Promise<void> {
    if (typeItem === '') {
      throw new Error('need a string type, but got empty type');
    }
    await this.projectService.setGroupTypes(key, typeItem);
  }
  async getTypes(): Promise<string[]> {
    const list = Array.from(this.localGroupMap.values()).map((group) => {
      return group.types;
    });
    return list.reduce((prev, curr) => prev.concat(curr), []);
  }
  async getPackageInfo(key: string): Promise<IPackageInfo> {
    const info = this.localGroupMap.get(key)!.pkgInfo;
    return info;
  }
  private async createGroup(group: GroupModel) {
    const { fileStream } = await group.compress();
    const { id: groupId, key: groupKey, diffPlatform } = group.meta;
    const platform = getPlatform(diffPlatform);
    try {
      await this.httpService.uploadFile(
        {
          url: 'group',
        },
        {
          data: {
            platform: platform,
            project_key: groupKey,
            project_id: groupId,
          },
          files: [{ name: 'file', file: fileStream, filename: 'group.tgz' }],
        },
      );
    } catch (e: any) {
      this.logService.error('save error:' + e);
      throw new Error(e.message);
    }
  }
  private async createComponents(group: GroupModel) {
    const { id: groupId, key: groupKey } = group.meta;
    const components = Array.from(group.componentMap.values());
    if (components?.length > 0) {
      const componentsInfo = components.map((item) => {
        const { id, func, diffPlatform } = item.meta;
        const platform = getPlatform(diffPlatform);
        return { id, func, platform };
      });
      const componentFiles = await Promise.all(
        components.map(async (item) => {
          const { fileStream } = await item.compress();
          return {
            name: item.folderName,
            file: fileStream,
            filename: 'component.tgz',
          };
        }),
      );
      await this.httpService.uploadFile(
        {
          url: 'component',
        },
        {
          data: {
            group_key: groupKey,
            group_id: groupId,
            group_version: group.version,
            components: JSON.stringify(componentsInfo),
          },
          files: componentFiles,
        },
      );
    }
  }
  async create(key: string) {
    const group = this.localGroupMap.get(key)!;
    await this.createGroup(group);
    await this.createComponents(group);
  }
  async update(key: string) {
    const group = this.localGroupMap.get(key)!;
    const newestVersion = await this.updateGroup(group);
    await this.updateComponents(group, newestVersion);
    if (newestVersion) {
      // 生成新版本后更新localGroupMap和enabledGroupMap
      await Promise.all([this.loadEnabledGroups(), this.loadLocalGroups()]);
    }
  }
  private async updateGroup(group: GroupModel, isPublish = false) {
    const { fileStream } = await group.compress();
    const { id: groupId, key: groupKey, diffPlatform } = group.meta;
    const platform = getPlatform(diffPlatform);
    try {
      const params = isPublish ? { isPublish } : {};
      const res = await this.httpService.uploadFile(
        {
          url: 'group',
          method: 'PUT',
          params,
        },
        {
          data: {
            platform: platform,
            project_key: groupKey,
            project_id: groupId,
            version: group.version,
            published: group.state.published.toString(),
          },
          files: [{ name: 'file', file: fileStream, filename: 'group.tgz' }],
        },
      );
      return res?.data;
    } catch (e: any) {
      this.logService.error('update error:' + e);
      throw new Error(e.message);
    }
  }
  private async updateComponents(group: GroupModel, newestVersion?: string) {
    const { id: groupId, key: groupKey } = group.meta;
    const components = Array.from(group.componentMap.values());
    if (components?.length > 0) {
      const componentsInfo = components.map((item) => {
        const { id, func, diffPlatform } = item.meta;
        const platform = getPlatform(diffPlatform);
        return { id, func, platform };
      });
      const componentFiles = await Promise.all(
        components.map(async (item) => {
          const { fileStream } = await item.compress();
          return {
            name: item.folderName,
            file: fileStream,
            filename: 'component.tgz',
          };
        }),
      );
      await this.httpService.uploadFile(
        {
          url: 'component',
          method: 'PUT',
        },
        {
          data: {
            group_key: groupKey,
            group_id: groupId,
            group_version: newestVersion || group.version,
            components: JSON.stringify(componentsInfo),
          },
          files: componentFiles,
        },
      );
      if (newestVersion) {
        await this.delEnabledGroup(groupKey);
      }
    }
  }
  async publish(key: string): Promise<void> {
    const group = this.localGroupMap.get(key)!;
    await this.updateGroup(group, true);
    await this.updateComponents(group);
    // 发布后更新localGroupMap和enabledGroupMap
    await Promise.all([this.loadEnabledGroups(), this.loadLocalGroups()]);
  }
  private async downloadComponent(groupModel: GroupModel | undefined, components) {
    // 对比etag只下载etag不一致的文件
    return await Promise.all(
      components.map(async (component) => {
        const remoteMd5 = component.md5;
        const componentKey = component.project_key;
        const componentOldModel = groupModel?.componentMap?.get(componentKey);
        const localMd5 = componentOldModel?.md5;
        if (remoteMd5 !== localMd5) {
          const ossKey = component.oss_path;
          const res = await this.httpService.get({
            url: 'oss',
            params: {
              key: ossKey,
            },
            responseType: 'stream',
          });
          const componentModel = await groupModel?.newComponentModel(componentKey, false);
          await componentModel?.decompress(remoteMd5, res);
          // 通过initilized判断groupModel是否被初始化，以决定是否初始化componentModel
          if (groupModel?.initilized) {
            const model = await componentModel?.init();
            if (model) {
              groupModel?.componentMap.get(componentKey)?.dispose();
              groupModel?.componentMap.set(componentKey, model);
            }
          }
        }
      }),
    );
  }
  private async downloadGroup(groupMap: GroupMap | null, group) {
    // groupMap为null时只下载文件不初始化model
    const projectKey = group.group.project_key;
    const { published, enabled, editable, md5, version } = group || {};
    const remoteMd5 = md5;
    const localMd5 = groupMap?.get(projectKey)?.md5;
    const groupState = {
      published,
      enabled,
      editable,
    };
    const groupModel = this.instantiationService.createInstance(
      GroupModel,
      projectKey,
      version,
      groupState,
      false,
    );
    if (remoteMd5 !== localMd5) {
      const ossKey = group.oss_path;
      const res = await this.httpService.get({
        url: 'oss',
        params: {
          key: ossKey,
        },
        responseType: 'stream',
      });

      await groupModel.decompress(remoteMd5, res);
      if (groupMap !== null) {
        const model = await groupModel.init();
        if (model) {
          groupMap.get(projectKey)?.dispose();
          groupMap.set(projectKey, model);
        }
      }
    }
    const components = group.components;
    if (components.length !== 0) {
      const model = groupMap === null ? groupModel : groupMap.get(projectKey);
      await this.downloadComponent(model, components);
    }
  }
  async getEnabledGroups() {
    try {
      const platform = getPlatform(true);
      const res = await this.httpService.get({
        url: 'group',
        params: {
          enabled: true,
          platform,
        },
      });
      return res?.data;
    } catch (e: any) {
      this.logService.error('get enabled error:' + e);
      throw new Error(e.message);
    }
  }
  async getGroupByVersion(groupKey, version) {
    try {
      const platform = getPlatform(true);
      const res = await this.httpService.get({
        url: `group/${groupKey}`,
        params: {
          version,
          platform,
        },
      });
      const group = res?.data;
      const groupVersion = group?.versions[0];
      groupVersion.group = { project_key: group.project_key };
      return groupVersion;
    } catch (e: any) {
      this.logService.error('get group error:' + e);
      throw new Error(e.message);
    }
  }
  async syncEnabledGroups() {
    try {
      const groups = await this.getEnabledGroups();
      return await Promise.all(
        groups?.map(async (group) => {
          await this.downloadGroup(this.enabledGroupMap, group);
        }),
      );
    } catch (e: any) {
      this.logService.error('sync enabled error:' + e);
      throw new Error(e.message);
    }
  }
  async getEditableGroups() {
    try {
      const platform = getPlatform(true);
      const res = await this.httpService.get({
        url: 'group',
        params: {
          editable: true,
          platform,
        },
      });
      return res?.data;
    } catch (err: any) {
      this.logService.error('get editable error:' + err);
      throw new Error(err.message);
    }
  }
  async syncLocalGroups() {
    try {
      const groups = await this.getEditableGroups();
      if (Array.isArray(groups)) {
        return await Promise.all(
          groups?.map(async (group) => {
            await this.downloadGroup(this.localGroupMap, group);
          }),
        );
      }
    } catch (e: any) {
      this.logService.error('sync editable error:' + e);
      throw new Error(e.message);
    }
  }
  async checkRequiredGroups(deps: IRequiredGroupDep[]) {
    return await Promise.all(
      deps.map(async ({ groupKey, version }) => {
        const isExist = await this.projectService.checkVersionExist(groupKey, `v${version}`);
        if (isExist) {
          return true;
        } else {
          const group = await this.getGroupByVersion(groupKey, version);
          await this.downloadGroup(null, group);
        }
      }),
    );
  }
}
