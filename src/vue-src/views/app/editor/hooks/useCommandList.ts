import { ref, unref, onActivated } from 'vue';
import { CommandNode } from '@src/platform/common/types';
import { CommandType, ErrorHandling, SrcType, ValueType } from '@src/platform/common/enum';
import componentSender from '/@/ipc/component';
import { IGroupMeta } from '@src/platform/group/group';

type IMenuGroup = IGroupMeta & {
  open?: boolean;
  children: CommandNode[];
};
export function useCommandList() {
  const menuList = ref<IMenuGroup[]>();
  const innerGroup = ref<IMenuGroup[]>([
    {
      id: 'flow-command',
      desc: '流程控制操作',
      key: '@FlowUtil',
      name: '流程控制',
      open: true,
      diffPlatform: false,
      children: [
        {
          id: 'if',
          name: 'If 条件',
          type: CommandType.If,
          formType: CommandType.If,
          leftSrcType: SrcType.Input,
          leftValue: '',
          operator: '==',
          rightSrcType: SrcType.Input,
          rightValue: '',
        },
        {
          id: 'elseif',
          name: 'Else If',
          type: CommandType.ElseIf,
          formType: CommandType.If,
          leftSrcType: SrcType.Input,
          leftValue: '',
          operator: '==',
          rightSrcType: SrcType.Input,
          rightValue: '',
        },
        {
          id: 'else',
          name: 'Else',
          type: CommandType.Else,
          formType: CommandType.Else,
        },
        {
          id: 'foreach',
          name: 'ForEach',
          type: CommandType.ForEach,
          formType: CommandType.ForEach,
          srcType: SrcType.Input,
          items: '',
          output: {
            name: '输出',
            key: 'output',
            type: ValueType.Unknown,
          },
        },
      ],
    },
    {
      id: 'custom-command',
      desc: '自定义分组操作',
      key: '@CustomUtil',
      name: '自定义分组',
      open: true,
      diffPlatform: false,
      children: [
        {
          id: 'custom',
          name: '自定义组件',
          type: CommandType.Code,
          formType: CommandType.Code,
          errorHandling: ErrorHandling.Stop,
          code: `/**
* @inputs 以对象形式定义导出函数的输入参数
* @output 如有返回值，请直接在导出函数体结尾return结果
*/
module.exports = async function run() {};`,
        },
      ],
    },
  ]);

  async function getMenuList() {
    const groupComponentList = (await componentSender.getGroupComponentList()) as IMenuGroup[];
    const list = groupComponentList.map((item) => {
      item.open = true;
      return item;
    });
    return [...unref(innerGroup), ...list];
  }

  onActivated(async () => {
    menuList.value = await getMenuList();
  });

  return {
    menuList,
  };
}
