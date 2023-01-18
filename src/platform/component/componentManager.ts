import { generateUuid } from '@base/common/uuid';
import { ILogService } from '@base/log/logService';
import { ICodeService } from '@src/platform/code/code';
import { IGroupService } from '@src/platform/group/group';
import {
  IComponentMeta,
  IGroupComponentMeta,
  initialMetaInfo,
} from '@src/platform/component/component';
import { ComponentCommand } from '@src/platform/common/types';
import { CommandType } from '@src/platform/common/enum';
import { IHttpService } from '@src/base/http/http';
import { IInstantiationService } from '@base/instantiation/instantiation';

export class ComponentManager {
  constructor(
    @ILogService private readonly logService: ILogService,
    @ICodeService private readonly codeService: ICodeService,
    @IGroupService private readonly groupService: IGroupService,
    @IHttpService private readonly httpService: IHttpService,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
  ) {}
  async createComponent(info: Partial<IComponentMeta>) {
    const uuid = generateUuid();
    if (!(info.group && info.func)) {
      throw new Error('require group and func');
    }
    const groupPath = info.group.toLowerCase();
    const compPath = info.func.toLowerCase();
    const pkgName = `${groupPath}-${compPath}`;
    const packageInfo = {
      path: info.func,
      name: pkgName,
      auth: 'slt',
    };
    const metaInfo = { ...initialMetaInfo(uuid), ...info };
    const groupModel = this.groupService.editableGroupMap.get(info.group);
    await groupModel?.createComponents(packageInfo, metaInfo);
    return uuid;
  }
  private getComponentModel(group: string, func: string) {
    const groupModel = this.groupService.editableGroupMap.get(group);
    const compModel = groupModel?.componentMap.get(func);
    return compModel!;
  }
  async delComponent(group: string, func: string) {
    const groupModel = this.groupService.editableGroupMap.get(group);
    await groupModel?.deleteComponent(func);
  }
  async saveCode(group: string, func: string, codeStr: string) {
    await this.getComponentModel(group, func)?.saveCode(codeStr);
  }
  async showCode(group: string, func: string) {
    const codeStr = await this.getComponentModel(group, func)?.showCode();
    return codeStr;
  }
  parseIOParams(codeStr: string) {
    const inputsOutput = this.codeService.parseIOParmas(codeStr);
    return inputsOutput;
  }
  getIOParams(group: string, func: string) {
    const meta = this.getComponentModel(group, func)?.meta;
    return {
      inputs: meta.inputs,
      output: meta.output,
    };
  }
  async getGroupComponentList(): Promise<IGroupComponentMeta[]> {
    // 同步最新分组及组件
    await this.groupService.syncEnabledGroups();
    // 获取分组列表
    const groupList = Array.from(this.groupService.enabledGroupMap.values()).map(
      ({ version, meta }) => ({ ...meta, version }),
    ) as any as IGroupComponentMeta[];
    const list = (await Promise.all(
      groupList.map(async (group) => {
        const groupParent: IGroupComponentMeta = { ...group };
        // 获取分组下组件列表
        const list = Array.from(
          this.groupService.enabledGroupMap.get(group.key)!.componentMap.values(),
        ).map((comp) => comp.meta);
        const componentList: ComponentCommand[] = [];
        list?.forEach((comp) => {
          const command = { ...comp, version: group.version } as ComponentCommand;
          command.componentId = comp.id;
          command.type = CommandType.Component;
          command.formType = CommandType.Component;
          componentList.push(command);
        });
        groupParent.children = componentList;
        return groupParent;
      }),
    )) as IGroupComponentMeta[];
    return list;
  }
  async getComponentInfo(group: string, func: string) {
    const meta = this.getComponentModel(group, func)?.meta;
    return meta;
  }
  async setComponentInfo(group: string, func: string, info: Partial<IComponentMeta>) {
    await this.getComponentModel(group, func)?.setCompMeta(info);
  }
  async getWorkspace(group: string, func: string): Promise<string> {
    const path = this.getComponentModel(group, func)?.root;
    return path;
  }
}
