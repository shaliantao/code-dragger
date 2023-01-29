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

const VITE_GLOB_NPM_SHORT_NAME = import.meta.env.VITE_GLOB_NPM_SHORT_NAME;
const INITIAL_VERSION = 1;

type GroupMap = Map<string, GroupModel>;

export class GroupManager {
  editableGroupMap: GroupMap = new Map();
  enabledGroupMap: GroupMap = new Map();
  constructor(
    @ILogService private readonly logService: ILogService,
    @IGroupProjectService private readonly projectService: IGroupProjectService,
    @IHttpService private readonly httpService: IHttpService,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
  ) {
    this.initEditableGroups();
    this.initEnabledGroups();
  }
  // 获取本地可编辑分组,初始化editableGroupMap并与远端启用分组比较同步
  private async initEditableGroups() {
    const editableGroups = (await this.getEditableGroups()) || [];
    await this.initGroupMap(this.editableGroupMap, editableGroups);
    await this.syncEditableGroups(editableGroups);
  }
  // 获取本地的启用分组,初始化enabledGroupMap并与远端启用分组比较同步
  private async initEnabledGroups() {
    const enabledGroups = (await this.getEnabledGroups()) || [];
    await this.initGroupMap(this.enabledGroupMap, enabledGroups);
    await this.syncEnabledGroups(enabledGroups);
  }
  // 获取本地文件系统的可用分组，初始化groupMap
  private async initGroupMap(groupMap: GroupMap, remoteGroups) {
    // 启用中或编辑中的分组key及分组信息
    const keyVersionMap = new Map<string, any>(
      remoteGroups.map((item) => [item.group.project_key, item]),
    );
    // 获取文件系统中的分组名称列表
    const list = await this.projectService.getFolderList();
    const filteredList: string[] = [];
    for (const item of list) {
      // 获取本地分组名称对应的线上版本
      const version = keyVersionMap.get(item)?.version;
      // 只保留本地和线上版本一致的分组
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
    // 过滤掉初始化失败的GroupModel
    const filteredGroupList = groupList.filter(([_key, value]) => !!value);
    for (const [key, value] of filteredGroupList) {
      groupMap.set(key, value);
    }
  }
  // 新建分组
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
    const pkgName = `${VITE_GLOB_NPM_SHORT_NAME}-${groupLowerKey}`;

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
      this.editableGroupMap.set(groupKey, groupModel);
    }
    await this.create(groupKey);
    return uuid;
  }
  // 获取分组版本列表
  async getVersions(key: string) {
    const { id } = this.editableGroupMap.get(key)?.meta || {};
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
  private async delEditableGroup(key: string) {
    //await this.editableGroupMap.get(key)?.delete();
    this.editableGroupMap.delete(key);
  }
  private async delEnabledGroup(key: string) {
    //await this.enabledGroupMap.get(key)?.delete();
    this.enabledGroupMap.delete(key);
  }
  async delGroup(key: string) {
    const { id } = this.editableGroupMap.get(key)!.meta;
    await this.httpService.delete({
      url: `group/${id}`,
    });
    await this.delEditableGroup(key);
    await this.delEnabledGroup(key);
  }
  async getGroupList() {
    await this.syncEditableGroups();
    const list = Array.from(this.editableGroupMap.values()).map((group) => group.item);
    return list;
  }
  async getComponentList(key: string) {
    const group = this.editableGroupMap.get(key)!;
    const list = Array.from(group.componentMap.values()).map((group) => group.item);
    return list;
  }
  async getGroupInfo(key: string) {
    const { meta, state, version } = this.editableGroupMap.get(key)! || {};
    return { ...meta, ...state, version };
  }
  async setGroupInfo(key: string, info: Partial<IGroupMeta>) {
    await this.editableGroupMap.get(key)?.setGroupMeta(info);
    await this.update(key);
  }
  async getWorkspace(key: string): Promise<string> {
    const path = this.editableGroupMap.get(key)!.root;
    return path;
  }
  async setGroupTypes(key: string, typeItem: string): Promise<void> {
    await this.editableGroupMap.get(key)?.setTypes(typeItem);
  }
  async getTypes(): Promise<string[]> {
    const list = Array.from(this.editableGroupMap.values()).map((group) => {
      return group.types;
    });
    return list.reduce((prev, curr) => prev.concat(curr), []);
  }
  async getPackageInfo(key: string): Promise<IPackageInfo> {
    const info = this.editableGroupMap.get(key)!.pkgInfo;
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
  // 新建远端分组
  private async create(key: string) {
    const group = this.editableGroupMap.get(key)!;
    await this.createGroup(group);
  }
  private async updateGroup(group: GroupModel, isPublish = false) {
    const { fileStream } = await group.compress();
    const { id: groupId, key: groupKey, diffPlatform } = group.meta;
    const platform = getPlatform(diffPlatform);
    try {
      const url = `group/${isPublish ? 'publish' : ''}`;
      const res = await this.httpService.uploadFile(
        {
          url,
          method: 'PUT',
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
  // 更新分组
  async update(key: string) {
    const group = this.editableGroupMap.get(key)!;
    const newestVersion = await this.updateGroup(group);
    await this.updateComponents(group, newestVersion);
    if (newestVersion) {
      // 生成新版本后更新editableGroupMap和enabledGroupMap
      await Promise.all([this.syncEditableGroups(), this.syncEnabledGroups()]);
    }
  }
  // 发布分组
  async publish(key: string): Promise<void> {
    const group = this.editableGroupMap.get(key)!;
    await this.updateGroup(group, true);
    await this.updateComponents(group);
    // 发布后更新editableGroupMap和enabledGroupMap
    await Promise.all([this.syncEditableGroups(), this.syncEnabledGroups()]);
  }
  // 根据etag循环判断是否从远端下载组件
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
  // 根据etag判断是否从远端下载分组
  private async downloadGroup(groupMap: GroupMap | null, group) {
    // groupMap为null时只下载文件不初始化model
    const projectKey = group.group.project_key;
    const { published, enabled, editable, md5: remoteMd5, version } = group || {};
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
  // 获取启用中的分组
  private async getEnabledGroups() {
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
  // 获取编辑中的分组
  private async getEditableGroups() {
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
  // 获取指定版本的分组
  private async getGroupByVersion(groupKey, version) {
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
  // 同步enabledGroupMap，使其与远端分组保持一致，并根据etag判断是否更新本地文件
  async syncEnabledGroups(remoteGroups?) {
    try {
      // 获取远端分组
      const groups = remoteGroups || (await this.getEnabledGroups());
      // 删除enabledGroupMap中groups不包含的分组, 防止出现缓存的历史分组
      for (const key of this.enabledGroupMap.keys()) {
        const find = groups.find((group) => group?.group?.project_key === key);
        if (!find) {
          await this.delEnabledGroup(key);
        }
      }
      // 循环groups，同步enabledGroupMap，并根据etag判断是否更新本地文件
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
  // 同步editableGroupMap，使其与远端分组保持一致，并根据etag判断是否更新本地文件
  async syncEditableGroups(remoteGroups?) {
    try {
      // 获取远端分组
      const groups = remoteGroups || (await this.getEditableGroups());
      // 删除editableGroupMap中groups不包含的分组, 防止出现缓存的历史分组
      for (const key of this.editableGroupMap.keys()) {
        const find = groups.find((group) => group?.group?.project_key === key);
        if (!find) {
          await this.delEditableGroup(key);
        }
      }
      // 循环groups，同步editableGroupMap，并根据etag判断是否更新本地文件
      if (Array.isArray(groups)) {
        return await Promise.all(
          groups?.map(async (group) => {
            await this.downloadGroup(this.editableGroupMap, group);
          }),
        );
      }
    } catch (e: any) {
      this.logService.error('sync editable error:' + e);
      throw new Error(e.message);
    }
  }
  // 检查运行所需分组，并下载本地不存在的分组版本
  async checkRequiredGroups(deps: IRequiredGroupDep[]) {
    return await Promise.all(
      deps.map(async ({ groupKey, version }) => {
        // TODO 可能会造成组件缓存无法更新的情况，可同时通过md5判断
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
